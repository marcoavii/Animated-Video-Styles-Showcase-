---
name: basic-jkson-what-if-style
description: jkson what if style. Make a "What If" animated episode from one topic line ("What if you could rewind 10 seconds?"), in the dusk-lit stick-figure style of the What If channels that broke out on YouTube in October 2026. Takes the person's own voiceover (an mp3 they made in ElevenLabs and uploaded) with its script, or writes the script on the seven-beat What If formula for them to record, times every word with Whisper, lays out a shot list at the genre's pace, renders a storyboard of stills and self-checks it before animating, animates every frame in code (Remotion and SVG, with an original cast on one rig, rooms in perspective and light from lamps and windows), synthesizes and syncs the sound offline (no API key needed), and masters a finished 15-25 s episode to -14 LUFS. Use when someone asks for a What If episode, animation or cartoon, "make a what if video about X", a stick-figure explainer in this style, to run the free What If skill, or writes "jkson what if style", "jkson what if", the old name "jkson style", "Jackson style", "gaya jkson", or "jkson".
---

# What If Animation by Jackson AI

> The "jkson what if style" skill (formerly "jkson style"). One topic line in, a finished 15-25 second episode out. Every frame is SVG that Claude writes (rendered by
Remotion); the voice is the person's own ElevenLabs voiceover, uploaded as a file, and the sound effects and music
are synthesized offline by `scripts/synth.py`, so no API key or credits are needed. Two examples ship in `studio/src/episodes/`, both ready to
render: `rewind` ("What if you could rewind 10 seconds?", the proof clip: shots played backwards as the power) and
`copy-paste` ("What if you could copy and paste anything?", the skill's first full run: a new kitchen set, a
schematic for the science beat, a cliffhanger blackout). Read the one closest to your topic before you start.

| File | What's in it |
|---|---|
| `references/formula.md` | The seven-beat What If formula, the 15-25 s shape, script rules, choosing a topic |
| `references/look.md` | The measured look, pace, shot vocabulary, and the storyboard and motion checklists |
| `references/kit.md` | The building blocks: engine, cast, sets, room kit, light, UI, looks, and how to add each |
| `references/sound.md` | Writing sound events, prompts, levels, costs |
| `references/traps.md` | Everything that cost time on the two example episodes |
| `studio/` | The Remotion project: copy it once, then every episode lives in it |
| `scripts/` | voice, plan, stills, board, sfx, synth, mixcheck, motiongrid, master (Python 3.9+ and Node) |

## Rules

- **Original characters only.** Pip (the hero, look B) and Mo (his friend) are ours, and so are the sister, mum and
  the suit on the rig. Never a channel's own hero, and nothing that resembles a famous cartoon character: check every
  new look on the cast sheet (Mo's first hat was dropped for drifting toward one).
- **Original stories.** The formula is shared; the episode isn't anyone else's. Don't remake a channel's title.
- **Never claim the viral channels are made with Claude** or any other tool. Nobody has said how they're made.
- **The VO comes from the person.** They make it in ElevenLabs and upload the file, like every other style in this
  repo. Never make a voice yourself (no TTS, not even as a placeholder): if the VO is missing, ask for it. The script
  they send is the text of that VO: put it in `episode.json` as it is, only split into beats.
- **No API key needed.** Sound effects and music are synthesized offline (`sfx.py`, engine `synth`). The ElevenLabs
  API is only used when the person explicitly asks for it (`voice.py --tts`, `sfx.py --engine elevenlabs`); then
  `ELEVENLABS_API_KEY` comes from the environment or a `.env` above the studio, by name only (never print, paste or
  hardcode a key), and the credits it used are logged in `out/<slug>/costs.json` and reported at hand-over.
- **Storyboard before animation.** No video render until the stills pass the self-check (step 5) and, when the person
  is in the loop, they've seen the board.
- **Every fact is real.** A number in the script is worked out and sourced in the episode's `science` field first.

## Setup (once per machine)

Needs Node 18+, ffmpeg and ffprobe on the PATH, and Python 3.10+ with `numpy`, `scipy`, `Pillow` and `faster-whisper`
(the repo's `setup/install.ps1` or `setup/install.sh` installs all of it).

```bash
cp -r <skill>/studio ./what-if-studio && cd what-if-studio && npm install
```

Everything below runs from that studio folder; `<skill>` is this skill's folder. To work offline or in your own
brand face, put a display font in `public/fonts/` and set `titleFont` in `src/studio.config.ts` (the default title
face, Bricolage Grotesque, and the UI faces load from Google Fonts at render time). To update an existing studio to
a newer engine, copy `<skill>/studio/src/engine` over its `src/engine`.

## The pipeline

Work through the steps in order. Each ends on something you look at before the next.

### 1. Script

**The person sent a VO and its script** (the usual case): the script is fixed, because it has to match the voice.
Split it into the beats of `references/formula.md` (`script`, one entry per beat, the text exactly as spoken), work
out `title`, `power`, the three demos and the turn from it, and fill `science` for any fact in it. If they sent the VO
without the text, run step 2 with `--transcript` first and use what Whisper heard (fix names and numbers with them).

**The person sent only a topic:** write the script as below, give it to them to record in ElevenLabs, and wait for
the VO before step 2.

Read `references/formula.md`. Search YouTube for the premise first: if a What If channel already has that exact
episode, change the power or the rule. From the topic line, decide the power's word, its rule, three escalating
demos and the turn (one real fact with a number). Write `src/episodes/<slug>/episode.json` with `id` (PascalCase,
the composition name), `slug`, `topic`, `title` (two lines), `script` (one entry per beat) and `science` (each fact:
the claim, the working, the source). 45 to 65 words. Read it aloud at pace: every line must be a picture.

### 2. Voice

```bash
python <skill>/scripts/voice.py <slug> --vo "<path to the uploaded VO>" [--lang id]
```

It copies the VO to `public/<slug>/vo_source.<ext>`, times every word with Whisper (the spelling comes from the
script, the timing from the voice) and prints how much of the script it matched and where it differs: below 100%,
check those words. Then it cuts the pauses to the genre's pace: `public/<slug>/voice.wav` and
`src/episodes/<slug>/words.json`. Check the length and the word times it prints. Retune pauses with `gaps` in
`episode.json` and re-run without `--vo` (Whisper is cached, so it's instant); `"gaps": "off"` keeps the VO exactly as
recorded. The genre runs 15-25 s; a longer VO still works, with more shots.

### 3. Shot list

Design one shot per picture in the script (usually 9 to 14), varying the size and angle every cut (wide, insert,
medium, close-up, over the shoulder, high, low; see `references/look.md`). Add to `episode.json`:

- `shots`: `{ "id": "S1", "size": "medium", "set": "kitchen", "key": 14, "note": "what we see" }` (`key` is the
  frame of the shot's own clock the storyboard shows)
- `edit`: `{ "shot": "S1", "at": "cookie" }` per cut, cued on the word it lands on (`plan.py` lists the cue forms;
  `reverse`, `from`, `to` and `look` for powers that bend a shot's clock)
- `fx`: one-frame flashes and shakes, `{ "at": "S3+2", "kind": "flash" }`

```bash
python <skill>/scripts/plan.py <slug>
```

It writes `timeline.json` and `out/<slug>/shotlist.md` and prints the pace. Aim for 27+ cuts a minute in the
opening and no static shot over about 3 s; fix what it flags before drawing anything.

### 4. Storyboard

Read `references/kit.md` for the building blocks. Write `src/episodes/<slug>/shots.tsx`, one component per shot,
each a pure function of its clock `t` (copy the patterns in the two examples' `shots.tsx`), and `index.tsx` (the
episode and its power look), then add the episode to `src/episodes/index.ts`. At this step each shot only needs to
be right at its `key` frame. When a topic needs a place the library lacks, build it with the room kit and add it to
`src/engine/sets/` (and to the skill's copy) so the next episode has it, as the copy-paste run did with the kitchen
and the schematic. A new character or costume: add the look, then check it on the cast sheet
(`npx remotion still src/index.ts Cast out/cast.png`).

```bash
npx tsc --noEmit
node <skill>/scripts/stills.mjs <slug>
python <skill>/scripts/board.py <slug>
```

`out/<slug>/storyboard.jpg`: one captioned still per shot.

### 5. Self-check the stills

Look at the storyboard, then open every still in `out/<slug>/board/` at full size, and run the storyboard checklist
in `references/look.md` honestly, shot by shot. Write down what fails, fix it, re-render just those shots
(`stills.mjs <slug> S3 S7`), rebuild the sheet and look again. Repeat until it passes. Check `references/traps.md`
for the failure you're seeing before inventing a fix. If the person is in the loop, show them the board now and
take their notes before animating.

### 6. Animate

Bring each shot to life from its key pose: `poseAt` keys with anticipation, holds and overshoot, `faceAt` for
expressions, camera moves with `kf`, the power's look, the `fx`. Then render a draft and check the motion:

```bash
python <skill>/scripts/master.py <slug>
python <skill>/scripts/motiongrid.py <slug> S2 S5
node <skill>/scripts/stills.mjs <slug> --frames 120 240
```

Read the grids like a flipbook against the motion checklist in `references/look.md`; fix and re-render until it
reads.

### 7. Sound

Read `references/sound.md`. Add `sound` to `episode.json`: the clips (prompt and length), one event per visible
action cued to its shot, ambiences per location, the music bed and the levels. Check what the library already has,
then generate:

```bash
python <skill>/scripts/sfx.py <slug> --dry
python <skill>/scripts/sfx.py <slug>
```

Every clip is synthesized offline from its prompt: `--dry` shows which recipe each prompt picks (`python
<skill>/scripts/synth.py --list` shows them all). If a clip picks the wrong one, reword the prompt with that recipe's
word or force it with a third field: `"pop": ["a cartoon speech bubble pop", 0.5, "pop"]`. It sets the stem volumes
in `timeline.json`. (Only if the person asks for ElevenLabs sound and has a key: `--engine elevenlabs`.) Then check that every word stays clear:

```bash
python <skill>/scripts/mixcheck.py <slug>
```

It lists the moments, while a word is being spoken, where effects or music come within 3 dB of the voice. A hit that
illustrates a word lands in the pause just after it, never on it; a bed (a hum, a drone) under a key line comes down;
if most of the stem crowds the voice, lower `sfx_lu`. Re-run sfx.py and the check until only deliberate overlaps
remain (a title boom, a turn).

### 8. Master and hand over

```bash
python <skill>/scripts/master.py <slug>
```

Renders, brings the mix to -14 LUFS with peaks under -1 dBTP, and writes `out/<slug>/report.json` (length, loudness,
pace, credits). Watch the final file once through with sound. Hand over `out/<slug>/<slug>-final.mp4` and
`out/<slug>/storyboard.jpg`, with the length, how well the VO matched the script, and anything you'd still improve
(plus the ElevenLabs credits, only if the API was used).

## Where an episode lives

| Path | What |
|---|---|
| `src/episodes/<slug>/episode.json` | Everything you write: script, science, shots, edit, fx, sound |
| `src/episodes/<slug>/shots.tsx`, `index.tsx` | The drawing: one component per shot, the power's look |
| `src/episodes/<slug>/words.json`, `timeline.json` | Written by voice.py and plan.py (sfx.py adds the volumes) |
| `public/<slug>/` | vo_source.* (the uploaded VO), voice.wav, sfx.wav, music.wav |
| `out/<slug>/` | board stills, storyboard.jpg, shotlist.md, motion grids, renders, costs.json, report.json |
| `library/sfx/` | Every synthesized (or generated) sound clip, shared by all episodes |
