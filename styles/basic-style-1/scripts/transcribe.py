"""Transcribe a voice-over with faster-whisper: prints segments, word timings and silences as JSON.

Usage: python transcribe.py <vo.mp3> <out.json> [--model small] [--language id]
Word timings let story.js land each caption and visual on the spoken word.
"""
import argparse
import json

from faster_whisper import WhisperModel


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--model", default="small")
    ap.add_argument("--language", default="id")
    a = ap.parse_args()

    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(a.audio, language=a.language, word_timestamps=True, vad_filter=False)
    segs, words = [], []
    for s in segments:
        segs.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"start": round(w.start, 2), "end": round(w.end, 2), "word": w.word.strip()})
    # pauses between words are the natural places to cut phrases and scenes
    gaps = [[words[i]["end"], words[i + 1]["start"]] for i in range(len(words) - 1) if words[i + 1]["start"] - words[i]["end"] >= 0.15]
    result = {"duration": round(info.duration, 2), "segments": segs, "words": words, "gaps": gaps}
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print(f"duration {result['duration']}s, {len(segs)} segments, {len(words)} words, {len(gaps)} gaps -> {a.out}")
    for s in segs:
        print(f"{s['start']:7.2f}-{s['end']:7.2f}  {s['text']}")


if __name__ == "__main__":
    main()
