"""Step 2: the voice. Takes the person's own voiceover (made in ElevenLabs or anywhere else), times every word with
Whisper against the script, then tightens the pauses to the genre's pace.

python <skill>/scripts/voice.py <slug> --vo <file>      first run: copies the VO to public/<slug>/vo_source.<ext>
python <skill>/scripts/voice.py <slug>                  later runs (retune the gaps): reuses that copy
Options:
  --lang id|en|...   the VO's language (default: Whisper detects it)
  --model small      Whisper model (default small; medium is slower and more exact)
  --transcript       only print what Whisper hears (writes out/<slug>/transcript.txt), to fill in the script when the
                     person sent the VO without its text
  --tts              the old way: make the voice with the ElevenLabs API instead (needs ELEVENLABS_API_KEY, uses credits)
  --force            transcribe (or call the API) again even if nothing changed

Reads  src/episodes/<slug>/episode.json  (script, gaps; voice settings only for --tts)
Writes public/<slug>/voice.wav (tightened), src/episodes/<slug>/words.json (word timings after tightening, used by
       plan.py and sfx.py) and out/<slug>/words_raw.json.
The spelling always comes from the script, the timing from the voice. Whisper runs once per VO file (cached), so
re-running to retune the gaps is instant.

episode.json "gaps" (seconds, all optional): {"word": 0.12, "comma": 0.2, "sentence": 0.3, "question": 0.45,
  "pairs": {"anything|One": 0.6}}  -> every pause longer than its limit is cut to the limit, from its middle.
  "gaps": "off" keeps the VO exactly as recorded.
"""
import base64, difflib, hashlib, json, re, shutil, sys, time
from pathlib import Path

import numpy as np

from wi import SR, decode, ep_dir, load_episode, load_json, out_dir, pub_dir, save_json, write_wav

args = sys.argv[1:]
if not args or args[0].startswith('--'):
    raise SystemExit(__doc__)
slug = args[0]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args and args.index(k) + 1 < len(args) else d
force = '--force' in args
ep = load_episode(slug)
script_text = ' '.join(b['text'].strip() for b in ep.get('script', []) if b.get('text', '').strip())
raw_words = out_dir(slug) / 'words_raw.json'


def tokens(text):
    """Script words with the punctuation that follows each one (it decides how long the pause after it may be)."""
    return [{'w': m.group(1), 'p': m.group(2).strip()} for m in re.finditer(r"([\w'’]+)([^\w'’]*)", text)]


def norm(w):
    return re.sub(r"[^\w]", '', w.lower().replace('’', "'"))


# ---------------------------------------------------------------- the person's own VO (default)
def from_vo():
    pub = pub_dir(slug)
    src = opt('--vo')
    if src:
        src = Path(src)
        if not src.exists():
            raise SystemExit(f'VO file not found: {src}')
        for old in pub.glob('vo_source.*'):
            old.unlink()
        dst = pub / f'vo_source{src.suffix.lower() or ".mp3"}'
        shutil.copy2(src, dst)
        print(f'VO copied to {dst}')
    found = sorted(pub.glob('vo_source.*'))
    if not found:
        raise SystemExit(f'No VO yet. Run: python <skill>/scripts/voice.py {slug} --vo "<path to the ElevenLabs mp3>"')
    vo = found[0]

    model = opt('--model', 'small')
    lang = opt('--lang')
    sig = hashlib.sha1(vo.read_bytes() + f'|{model}|{lang}'.encode()).hexdigest()[:12]
    cache = out_dir(slug) / 'whisper.json'
    heard = load_json(cache, {})
    if force or heard.get('sig') != sig:
        from faster_whisper import WhisperModel
        print(f'Transcribing {vo.name} with Whisper {model} (the first run downloads the model once)...')
        wm = WhisperModel(model, device='cpu', compute_type='int8')
        segs, info = wm.transcribe(str(vo), language=lang, word_timestamps=True, vad_filter=False,
                                   initial_prompt=script_text[:800] or None)
        ws = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in (s.words or [])]
        heard = {'sig': sig, 'lang': info.language, 'words': ws}
        save_json(cache, heard)
    ws = [w for w in heard['words'] if norm(w['w'])]
    text_heard = ' '.join(w['w'] for w in ws)
    (out_dir(slug) / 'transcript.txt').write_text(text_heard + '\n', encoding='utf-8')
    if '--transcript' in args or not script_text:
        print(f'Whisper heard ({heard.get("lang")}):\n{text_heard}\n')
        if not script_text:
            raise SystemExit('episode.json has no "script" yet: put this text into the script beats (fix the spelling of '
                             'names and numbers), then run voice.py again.')
        sys.exit(0)

    # align the script's words to what Whisper heard: spelling from the script, times from the voice
    toks = tokens(script_text)
    a = [norm(t['w']) for t in toks]
    b = [norm(w['w']) for w in ws]
    ops = difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
    times = [None] * len(toks)
    for tag, i1, i2, j1, j2 in ops:
        if tag == 'equal':
            for k in range(i2 - i1):
                times[i1 + k] = (ws[j1 + k]['s'], ws[j1 + k]['e'])
        elif tag == 'replace':  # same stretch of speech, heard differently: share its time out
            s0, e0 = ws[j1]['s'], ws[j2 - 1]['e']
            span = (e0 - s0) / (i2 - i1)
            for k in range(i2 - i1):
                times[i1 + k] = (s0 + k * span, s0 + (k + 1) * span)
    matched = sum(i2 - i1 for tag, i1, i2, _, _ in ops if tag == 'equal')
    i = 0
    while i < len(toks):  # words Whisper missed: spread them over the gap between their neighbours
        if times[i] is None:
            j = i
            while j < len(toks) and times[j] is None:
                j += 1
            s0 = times[i - 1][1] if i > 0 else 0.0
            e0 = times[j][0] if j < len(toks) else (ws[-1]['e'] if ws else s0 + 0.3 * (j - i))
            step = max(0.05, (e0 - s0) / (j - i))
            for k in range(i, j):
                times[k] = (s0 + (k - i) * step, s0 + (k - i + 1) * step)
            i = j
        else:
            i += 1
    words = [{'w': t['w'], 's': round(tm[0], 3), 'e': round(max(tm[1], tm[0] + 0.02), 3), 'p': t['p']} for t, tm in zip(toks, times)]
    for k in range(1, len(words)):  # keep the order strict
        words[k]['s'] = max(words[k]['s'], words[k - 1]['e'])
        words[k]['e'] = round(max(words[k]['e'], words[k]['s'] + 0.02), 3)
    save_json(raw_words, words)
    ratio = matched / max(1, len(toks))
    print(f'Script {len(toks)} words, heard {len(ws)}; {matched} matched exactly ({ratio:.0%}). Language: {heard.get("lang")}')
    for tag, i1, i2, j1, j2 in [o for o in ops if o[0] != 'equal'][:20]:
        print(f'  script "{" ".join(t["w"] for t in toks[i1:i2])}"  <>  heard "{" ".join(w["w"] for w in ws[j1:j2])}"')
    if ratio < 0.6:
        print('! Less than 60% of the script matches the voice: check that the script is the text of this VO.')
    return vo


# ---------------------------------------------------------------- ElevenLabs text-to-speech (only with --tts)
def from_tts():
    from wi import api, log_cost, spent_since
    if not script_text:
        raise SystemExit('episode.json has no "script" yet.')
    V = {'id': 'TX3LPaxmHKxFdv7VOQHJ', 'model': 'eleven_multilingual_v2', 'settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}}
    V.update(ep.get('voice', {}))
    sig = hashlib.sha1(json.dumps([script_text, V], sort_keys=True).encode()).hexdigest()[:12]
    raw_mp3 = pub_dir(slug) / 'voice_raw.mp3'
    meta = load_json(out_dir(slug) / 'voice_meta.json', {})
    if force or meta.get('sig') != sig or not raw_mp3.exists() or not raw_words.exists():
        print(f'{len(script_text)} characters to ElevenLabs (voice {V["id"]})')
        t0 = time.time()
        res = json.loads(api(f'/v1/text-to-speech/{V["id"]}/with-timestamps?output_format=mp3_44100_128', {'text': script_text, 'model_id': V['model'], 'voice_settings': V['settings']}))
        raw_mp3.write_bytes(base64.b64decode(res['audio_base64']))
        al = res['alignment']
        words, cur = [], None
        for ch, s, e in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
            if re.match(r"[\w'’]", ch):
                if cur is None:
                    cur = {'w': '', 's': s, 'e': e, 'p': ''}
                cur['w'] += ch
                cur['e'] = e
            else:
                if cur is not None:
                    words.append(cur)
                    cur = None
                if words and ch.strip():
                    words[-1]['p'] += ch
        if cur:
            words.append(cur)
        for w in words:
            w['s'], w['e'] = round(w['s'], 3), round(w['e'], 3)
        save_json(raw_words, words)
        save_json(out_dir(slug) / 'voice_meta.json', {'sig': sig, 'chars': len(script_text)})
        used, n = spent_since(t0, expect=1)
        log_cost(slug, 'voice', used, f'{len(script_text)} characters' + ('' if n else '; not in the history yet, check the usage page'))
    else:
        print('Voice unchanged since the last call: reusing it (no credits).')
    return raw_mp3


raw_audio = from_tts() if '--tts' in args else from_vo()

# ---------------------------------------------------------------- tighten the pauses
words = load_json(raw_words)
x = decode(raw_audio)
cuts = []
gaps = ep.get('gaps', {})
if gaps in ('off', False):
    print('gaps: off, the VO is kept exactly as recorded')
else:
    G = {'word': 0.12, 'comma': 0.2, 'sentence': 0.3, 'question': 0.45, 'pairs': {}}
    G.update(gaps if isinstance(gaps, dict) else {})

    def bare(w):
        return re.sub(r'[^\w]', '', w)

    for a, b in zip(words, words[1:]):
        gap = b['s'] - a['e']
        key = bare(a['w']) + '|' + bare(b['w'])
        if key in G['pairs']:
            keep = G['pairs'][key]
        elif '?' in a['p'] or '!' in a['p']:
            keep = G['question']
        elif '.' in a['p'] or ':' in a['p'] or ';' in a['p'] or '…' in a['p']:
            keep = G['sentence']
        elif ',' in a['p'] or '—' in a['p'] or '-' in a['p']:
            keep = G['comma']
        else:
            keep = G['word']
        if gap > keep:
            mid = (a['e'] + b['s']) / 2
            rm = gap - keep
            cuts.append((mid - rm / 2, mid + rm / 2))
parts, last = [], 0.0
for s, e in cuts:
    parts.append(x[int(last * SR):int(s * SR)])
    last = e
parts.append(x[int(last * SR):])
fade = int(0.004 * SR)  # a 4 ms fade either side of each join, so no click
for i, part in enumerate(parts):
    part = part.copy()
    if i > 0 and len(part) > fade:
        part[:fade] *= np.linspace(0, 1, fade)
    if i < len(parts) - 1 and len(part) > fade:
        part[-fade:] *= np.linspace(1, 0, fade)
    parts[i] = part
y = np.concatenate(parts)
write_wav(pub_dir(slug) / 'voice.wav', y)


def shift(t):
    return t - sum(min(e, t) - s for s, e in cuts if t > s)


out = [{'w': w['w'], 's': round(shift(w['s']), 3), 'e': round(shift(w['e']), 3), 'p': w.get('p', '')} for w in words]
save_json(ep_dir(slug) / 'words.json', out)
print(f'Tightened {len(cuts)} pauses, removed {sum(e - s for s, e in cuts):.2f} s: {len(x) / SR:.2f} s -> {len(y) / SR:.2f} s')
print(' '.join(f"{w['w']}@{w['s']}" for w in out))
