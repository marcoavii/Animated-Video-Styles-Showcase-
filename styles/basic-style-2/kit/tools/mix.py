"""Builds audio/mix.wav and stems from the video's sound.py. Run from the project folder: python tools/mix.py"""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(ROOT, "tools"), ROOT]
from sfxlib import *
import sound


def main():
    print("spotting"); sound.spot()
    print("ambience"); sound.ambience()
    print("score"); sound.score()
    print("voice"); vo = process_vo()
    n = LEN
    env_quiet = vo_env(vo)[:n]            # 1 = no speech, 0 = speech
    print("reverbs")
    wetD = np.stack([fftconvolve(buses["sendD"][:n + SR * 4, c], IR_DESERT[:, c])[:n] for c in range(2)], 1)
    wetR = np.stack([fftconvolve(buses["sendR"][:n + SR * 4, c], IR_ROOM[:, c])[:n] for c in range(2)], 1)
    wet = wetD * 1.0 + wetR * .75
    sfx = buses["sfx"][:n]; amb = buses["amb"][:n]; mus = buses["mus"][:n]
    sfx = sat(sfx * 1.05, 1.15) / 1.05
    # Sidechain: speech always sits on top. Beds and reverb tails dip most, direct hits least.
    duck = lambda d: db(d) + (1 - db(d)) * env_quiet
    mus = mus * duck(-9)[:, None]; amb = amb * duck(-5)[:, None]
    sfx = sfx * duck(-6)[:, None] + wet * duck(-12)[:, None]
    # Shell-shock moments and dead air, defined per video.
    w = sound.shellshock() if hasattr(sound, "shellshock") else []
    amb = muffle(amb, w); mus = muffle(mus, w, 420)
    if hasattr(sound, "bed_gain"):
        pts = sound.bed_gain(); g = automate(pts[0], pts[1], n)
        amb = amb * g[:, None]; mus = mus * g[:, None]
    voice = np.stack([vo[:n], vo[:n]], 1) + np.stack([fftconvolve(vo[:n], IR_ROOM[:, c])[:n] for c in range(2)], 1) * .035
    write("stems/vo.wav", voice); write("stems/sfx.wav", sfx); write("stems/amb.wav", amb); write("stems/mus.wav", mus)
    mix = voice * db(2.0) + sfx * db(-5.0) + amb * db(9) + mus * db(2.5)
    e = np.interp(T(n), [TL["dur"] - .35, TL["dur"] - .02], [1, 0])
    mix = mix * e[:, None]
    target = -13.0
    gain = 1.0
    for _ in range(3):
        y = peak_limit(mix * gain)
        write("mix.wav", y)
        I, Pk, L = lufs(os.path.join(ROOT, "audio", "mix.wav"))
        print(f"pass gain {20*np.log10(gain):.2f} dB -> I {I} LUFS  peak {Pk} dBFS  LRA {L} LU")
        gain *= db(target - I)
    print("done")


if __name__ == "__main__":
    main()
