"""Taman Iblis sound design: every event placed on the shared timeline. Uses tools/sfxlib.py."""
from sfxlib import *

def spot():
    spot_transitions()
    # --- tent ---
    t0 = CUT["tent"]
    put(t0, sub_hit(52, 1.1), .35); put(t0, whoosh(.3, False, 201), .3)
    put(Q["stamp1942"], ui_blip(620, 940), .2, -.5)
    put(Q["stamp1942"], stamp_slam(), .24, -.4, room=.1)
    put(Q["mapIn"] - .03, paper(.34, 202), .4, -.35, room=.14); put(Q["mapIn"] + .28, thud(110, .18, .4, 203), .28, -.25, room=.1)
    for i in range(6):
        put(Q["tanks"] + i * .055, modal([(880 + i * 90, .012, 1), (1900 + i * 110, .007, .5)], .06, seed=i, noise=.35), .24, -.4 + i * .05, room=.1)
    put(Q["arrow"] - .02, whoosh(.5, True, 204), .22, -.25)
    # --- lane: footfalls on sand, the click, then the blast ---
    t = CUT["lane"] + .06; k = 0
    while t < Q["click1"] - .1:
        put(t, sand_crunch(.1, 300 + k), .2 * lerp(1, .68, min(1, k / 10)), .06 * (-1) ** k, desert=.05)
        k += 1; t += 1 / (1.5 * 2)
    put(Q["click1"], click_mech(True, 41), .5, 0, desert=.12)
    put(Q["boom1"], boom(.9, 7, 3.0), 1.0, desert=.3)
    put(Q["boom1"] + .12, ui_blip(420, 280), .13, -.7)
    put(Q["boom1"] + .28, sand_crunch(.14, 45), .22, .46)
    # --- mines appearing under the sand ---
    n = 45
    for i in range(n):
        at = Q["minesFrom"] + (Q["minesTo"] - Q["minesFrom"]) * (i / (n - 1)) ** .62
        put(at, pop_mine(i % 36), lerp(.2, .34, i / n), float(R(i).uniform(-.8, .8)), room=.05)
    put(Q["minesFrom"] - .1, riser(Q["minesTo"] - Q["minesFrom"] + .2, 46, 90, 1500), .1)
    # counter tally
    tick_t = Q["minesFrom"]
    while tick_t < Q["minesTo"]:
        put(tick_t, modal([(2600, .004, 1)], .02, noise=.1), .07, .78); tick_t += .05
    # --- devil's garden ---
    put(Q["rommel"] - .02, water(CUT["scope"] - Q["rommel"], 52), .12, -.25, desert=.04)
    put(Q["signSlam"] - .34, whoosh(.34, False, 53), .36)
    put(Q["signSlam"], stamp_slam(54), .7, .15, desert=.26); put(Q["signSlam"], braam(49, 2.6, 55), .46, desert=.3)
    put(Q["signSlam"], sub_hit(40, 1.8), .5)
    put(Q["signSlam"] + .02, sand_crunch(.2, 56), .3, .2)
    for i in range(9):
        at = Q["bloom"] + i * .05; f = 196 * 2 ** ((i * 2) / 12)
        p = lfilter([1], np.r_[1, np.zeros(int(SR / f) - 1), -.49, -.49], R(i).standard_normal(N(.5)) * (T(N(.5)) < 1 / f))
        put(at, p, .11, -.2 + i * .1, desert=.14)
    # --- scope: mechanical iris on each swap ---
    for k in ("lens1", "lens2", "lens3"):
        put(Q[k] - .035, click_mech(False, 61), .75, .05, room=.14); put(Q[k] + .03, click_mech(False, 62), .5, -.05, room=.14)
        put(Q[k] - .01, lp(white(N(.1), R(63)), 700) * dec(N(.1), .03), .24)
    # --- scratching ---
    put(Q["scribble"] - .55, scratch_stroke(CUT["poster"] - Q["scribble"] - .95, 70), .42, -.1, room=.02, desert=.03)
    for i in range(3): put(Q["think"] + .2 + i * .38, ui_blip(1500 - i * 80, 1500 - i * 80, .03), .1, .4)
    # --- poster ---
    put(CUT["poster"], paper(.25, 72), .27, room=.12)
    put(Q["stamp"], stamp_slam(73), .78, .22, room=.25)
    # --- betty: the click, a held breath, the jump, the blast ---
    put(Q["betClick"], click_mech(True, 80), .62, .2, desert=.14)
    t = Q["betClick"] + .55; g = .4
    while t < Q["boom2"] - .1:
        put(t, heartbeat(), g); t += .72; g = min(.72, g * 1.14)
    put(Q["betJump"] - .02, spring_launch(), .72, .2, desert=.2)
    put(Q["betJump"] + .02, sand_crunch(.22, 81), .35, .2)
    put(Q["betJump"] + .1, tinnitus(Q["boom2"] - Q["betJump"], 3180), .07, .1)
    rd = Q["boom2"] - Q["betJump"] - .28
    put(Q["boom2"] - rd, riser(rd, 82, 160, 3000), .24)
    put(Q["boom2"], boom(1.0, 8, 3.4), 1.08, desert=.34)
    put(Q["boom2"] + .03, tinnitus(3.0), .07)
    # falling helmet: spin whistle, then three bounces
    put(Q["boom2"] + .3, whoosh(.86, False, 83), .1, .3)
    b0 = Q["boom2"] + 1.15
    for off, g in [(0, .4), (.285, .22), (.5, .13), (.64, .07)]:
        put(b0 + off, helmet_clank(84 + int(off * 9), g), 1.0, .32, desert=.14)
    put(Q["boom2"] + .25, ui_blip(420, 280), .12, -.7)
    # --- peek ---
    put(CUT["peek"] + .08, sand_crunch(.2, 86), .28, 0, desert=.05)
    put(Q["glint"] + .02, glint(), .22, .35, desert=.3)
    # --- crawl: cloth drag, then the bayonet going in ---
    a0 = CUT["crawl"] + .1; a1 = CUT["angle"]
    drag_n = N(a1 - a0); drag = lp(hp(white(drag_n, R(87)), 300), 3000) * (.5 + .5 * np.sin(2 * np.pi * .95 * T(drag_n))) ** 2
    put(a0, drag * .07, 1.0, -.1)
    for i, s in enumerate([Q["stab1"], Q["stab2"], Q["stab2"] + 1.15]):
        put(s - .02, sand_crunch(.16, 88 + i), .55, .25, desert=.05); put(s - .02, thud(84, .13, .6, 89 + i, sand=True), .36, .2)
    put(Q["stab2"] + .2, ui_blip(900, 680, .06), .05, .35)
    # --- 30 degree diagram: slow slide, tink ---
    slide_n = N(Q["tink"] - CUT["angle"] - .1)
    fc = np.geomspace(1200, 520, slide_n)
    put(CUT["angle"] + .1, svf(pink(slide_n, R(91)), fc, 1.2) * .18 * np.minimum(1, np.linspace(0, 4, slide_n)), 1.0, -.1)
    put(ws("g4", 1), ui_blip(760, 1140), .07, -.2)
    put(Q["tink"], tink(), .5, .2, desert=.32)
    put(ws("g5", 3), ui_blip(980, 1470), .1, -.2); put(ws("g5", 5), ui_blip(340, 240), .13, .3)
    # --- loading ---
    put(Q["thumb"] + .06, ui_blip(1040, 1560), .18, .3)
    put(Q["pull"], whoosh(.74, False, 92), .34, desert=.2); put(Q["pull"] + .36, sub_hit(44, 1.3), .2)
    put(Q["bar"], ui_blip(520, 390, .1), .22, 0)
    put(Q["bar"] + .3, modal([(310, .1, 1)], .3, noise=.04), .1)
    # --- Kosacki ---
    put(Q["namecard"], stamp_slam(95), .32, .4, room=.2)
    a = Q["board"]; put(a, chalk(.9, 96), .24, -.35, room=.2)
    for i, off in enumerate((0, .2, .35, .45, .5, .55)): put(a + off, modal([(1700, .007, 1)], .03, noise=.5, seed=i), .16, -.35, room=.2)
    put(Q["gratis"] - .34, paper(.3, 97), .32, -.4, room=.18)
    put(Q["gratis"], stamp_slam(98), .66, -.2, room=.3)
    put(Q["paten"], paper(.12, 99), .5, -.3); put(Q["paten"] + .1, paper(.12, 100), .5, -.3)
    # --- detector: speaker beeps speeding up to a solid tone ---
    t = Q["beepFrom"]; lock = Q["beepLock"]
    while t < lock:
        k = (t - Q["beepFrom"]) / max(.01, lock - Q["beepFrom"])
        put(t, beep(980 + 260 * k, .085), .17, .1); t += lerp(.42, .11, k)
    put(lock, beep(1240, CUT["german"] - lock + .02) * (1 + .12 * np.sin(2 * np.pi * 16 * T(N(CUT["german"] - lock + .02)))), .16, .1)
    put(lock, tink(103), .1, .25, desert=.2)
    # --- German reveal ---
    put(Q["woodIn"], modal([(240, .05, 1), (520, .03, .7), (980, .018, .4)], .3, seed=105, noise=.9), .6, -.5, room=.3)
    put(Q["glassIn"], modal([(2920, .16, 1), (4410, .11, .7), (6980, .07, .4)], .7, seed=106, noise=.6), .5, .5, room=.34)
    put(Q["woodIn"], ui_blip(320, 470), .1, -.5); put(Q["glassIn"], ui_blip(1040, 1560), .08, .5)
    # --- blind: a dead hiss where the beep should be ---
    put(CUT["blind"] + .05, hp(lp(white(N(1.6), R(107)), 5200), 800) * .018, 1.0, .1)
    put(Q["buta"], ui_blip(300, 225, .09), .18)
    # --- back to the bayonet ---
    for i in range(3): put(P["j4"]["s"] + .1 + i * .2, ui_blip(1500, 1500, .03), .05)
    put(Q["bayoRise"], whoosh(.3, True, 108), .2, .2)
    put(Q["bayoRise"] + .28, glint(1.1, 109), .34, .25, desert=.32)
    # --- tape ---
    put(Q["tapeFrom"] - .02, tape_zip(.78), .6, 0, desert=.09)
    for i in range(12): put(Q["lamps"] + (i // 2) * .07, lamp_pop(i // 2), .14, -.7 if i % 2 else .7, desert=.1)
    put(Q["offArrow"], whoosh(.44, True, 111), .2, .4)
    t = Q["offArrow"] + .1; k = 0
    while t < Q["boom3"] - .08:
        put(t, sand_crunch(.1, 320 + k), .17, .36 + k * .03, desert=.05); t += 1 / 3; k += 1
    put(Q["boom3"] - .2, click_mech(True, 112), .36, .6, desert=.12)
    put(Q["boom3"], boom(.55, 9, 2.4), .6, .5, desert=.4)
    put(Q["boom3"] + .2, ui_blip(420, 280), .12, -.7)
    # --- split: white line reveal ---
    put(Q["splitMines"], riser(.9, 115, 180, 2200), .14)
    for i in range(14): put(Q["splitMines"] + i * .03, beep(1400 - i * 40, .04), .05, -.8 + i * .12)
    put(Q["splitMines"] + .36, stick_ratchet(), .32, .5); put(Q["splitMines"] + .46, metal_clunk(116, 340), .36, .5, room=.2)
    # --- bangalore ---
    for k, sd in (("pipe1", 120), ("pipe2", 121)):
        put(Q[k], metal_clunk(sd, 720), .4, -.05, desert=.16); put(Q[k] + .05, metal_clunk(sd + 7, 1190), .2, .05, desert=.1)
    pn = N(1.1); put(Q["pipePush"], lp(hp(white(pn, R(122)), 240), 3400) * (.45 + .55 * np.abs(np.sin(2 * np.pi * 2.6 * T(pn)))) * .18 * np.minimum(1, (1.1 - T(pn)) / .2), 1.0, .3)
    put(Q["plunger"] - .02, stick_ratchet(.09, 123), .42, -.75); put(Q["plunger"] + .08, metal_clunk(124, 430), .42, -.75, desert=.14)
    pan_x = [-.1, .1, .3, .5, .7, .85]
    for i, x in enumerate(pan_x):
        put(Q["chain"] + i * .13, boom(.75 + i * .05, 200 + i, 2.6), .68 + i * .03, x, desert=.26)
    # --- flail tank ---
    f0 = CUT["flail"]; f1 = CUT["general"]; fl = N(f1 - f0 + .15); tt = T(fl)
    # diesel: firing pulses through a body resonance
    fire = 19.5 + 1.6 * np.sin(2 * np.pi * .23 * tt) ; ph = np.cumsum(fire) / SR
    pulse = (np.abs(np.sin(np.pi * ph)) ** 8)
    dies = lp(pulse + .16 * R(130).standard_normal(fl) * pulse, 620, 2) + .5 * np.sin(2 * np.pi * np.cumsum(fire * 2) / SR)
    dies = norm(sat(dies, 2)) * np.minimum(1, (f1 - f0 + .15 - tt) / .25) * np.minimum(1, tt / .12)
    cough_i = N(Q["cough"] - f0)
    cn = len(dies[cough_i:cough_i + N(1.05)])
    dies[cough_i:cough_i + cn] *= np.interp(T(cn), [0, .12, .85, 1.05], [1, .22, .3, 1])
    put(f0, dies, .2, -.1, desert=.03)
    # tracks: clanking links
    t = f0; k = 0
    while t < f1:
        put(t, metal_clunk(600 + k % 11, 480 + (k % 5) * 90), .04, -.15, room=.03); t += .118 + (k % 3) * .004; k += 1
    # flail: drum rotation = 2.07 rev/s across 11 chains; each pass lashes the ground
    whip_rate = 13 / (2 * np.pi) * 11
    lash = np.abs(np.sin(np.pi * np.cumsum(np.full(fl, whip_rate)) / SR)) ** 22
    rot = .5 + .5 * np.sin(2 * np.pi * 2.07 * tt)
    lashes = norm(hp(lp(R(131).standard_normal(fl) * lash, 5200), 240) + .5 * lp(lash, 180)) * (.45 + .55 * rot) * np.minimum(1, tt / .1) * np.minimum(1, (f1 - f0 + .15 - tt) / .25)
    put(f0, lashes, .12, .35, desert=.03)
    chain_rat = norm(bp(R(132).standard_normal(fl) * (np.sin(2 * np.pi * 39 * tt) > .6), 2500, 8000)) * np.minimum(1, tt / .1) * np.minimum(1, (f1 - f0 + .15 - tt) / .25)
    put(f0, chain_rat, .05, .35)
    mine_ts = [Q["flailBoomA"] - .56, Q["flailBoomA"], Q["flailBoomB"], Q["flailBoomC"], Q["cough"] + .42, Q["cough"] + 1.1]
    for i, m in enumerate(mine_ts):
        if m > f1 - .05: continue
        put(m, boom(.58, 220 + i, 2.0), .6, .35 - i * .02, desert=.26)
    put(Q["cough"], cough_engine(), .62, -.5, desert=.14)
    # --- final gag ---
    put(Q["genIn"], whoosh(.34, False, 140), .3, .5); put(Q["genIn"] + .3, thud(66, .24, .5, 141), .4, .4, room=.2)
    put(Q["ditolak"], stamp_slam(142), .95, 0, room=.32); put(Q["ditolak"], sub_hit(44, 1.2), .4)
    put(Q["genClick"], click_mech(True, 143), .4, .3, room=.34)  # dead air around it
    put(Q["genClick"] + .3, tinnitus(.32, 2200) * 1.6, .2)
    put(Q["bigBoom"], boom(1.25, 11, 3.0), 1.22, .1, desert=.45)
    put(Q["bigBoom"] + .02, sub_hit(32, 2.4), .65)
    put(Q["pill"] - .12, whoosh(.24, True, 144), .42)
    put(Q["pill"] + .02, modal([(620, .08, 1), (930, .06, .7), (1240, .05, .5), (1860, .04, .3)], .4, seed=145, noise=.5), .34, 0, room=.3)
    put(Q["pill"] + .02, sub_hit(64, .7), .42)


def ambience():
    # shot -> (wind, crickets, guns, room, lantern, canvas)
    S = {
        "tent": (.1, .05, .55, .55, .014, .22), "lane": (.46, .34, .6, 0, 0, 0), "under": (.03, 0, 1.1, .4, 0, 0), "garden": (.42, .4, .55, 0, 0, 0),
        "scope": (.2, .1, .75, .25, 0, 0), "scratch": (.42, .42, .55, 0, 0, 0), "poster": (.02, 0, .35, .55, 0, 0), "betty": (.34, .3, .35, 0, 0, 0),
        "peek": (.42, .45, .55, 0, 0, 0), "crawl": (.42, .4, .55, 0, 0, 0), "angle": (.24, .16, .7, .1, 0, 0), "loading": (.5, .62, .4, 0, 0, 0),
        "kosacki": (.03, 0, .22, .85, 0, 0), "detector": (.42, .4, .55, 0, 0, 0), "german": (.03, 0, .2, .55, 0, 0), "blind": (.58, 1.0, .1, 0, 0, 0),
        "backtobayonet": (.58, .95, .1, 0, 0, 0), "tape": (.42, .42, .8, 0, 0, 0), "split": (.2, .1, .95, .3, 0, 0), "bangalore": (.4, .25, .9, 0, 0, 0),
        "flail": (.36, 0, .9, 0, 0, 0), "general": (.04, 0, .15, .55, 0, 0),
    }
    ambience_mix(S)

def score():
    beat = BEAT; e8 = E8; prog_minor = PROG_MINOR; prog_bright = PROG_BRIGHT
    # tent: dry, curious
    plucks(CUT["tent"] + .4, CUT["lane"], prog_minor, .1)
    # lane: carries on, then pulls away just before the click
    plucks(CUT["lane"], Q["click1"] - .18, prog_minor, .1, with_tick=True, seed=540)
    # under + garden: ominous, no pulse
    drone(hz("D2"), CUT["under"], CUT["scope"], .17)
    put(Q["signSlam"], brass(hz("D2"), 1.8), .16, 0, "mus")
    # scope + scratch
    plucks(CUT["scope"], CUT["poster"], prog_minor, .082, low=True, with_tick=True, seed=580)
    # poster: rising
    drone(hz("A1"), CUT["poster"], CUT["betty"], .14, 7)
    # betty stays bare: heartbeat and the mine carry it
    drone(hz("D1"), Q["betClick"], Q["boom2"] - .05, .12, 8)
    # problem one: back to work
    plucks(CUT["peek"], CUT["loading"], prog_minor, .09, with_tick=True, seed=620)
    for k, s in enumerate(np.arange(CUT["crawl"], CUT["loading"], beat * 2)): put(float(s), tom(62, .45, 1, 7 + k), .13, 0, "mus")
    # loading: deflated pluck phrase
    for k, n in enumerate(("A3", "F3", "D3")): put(Q["bar"] + .1 + k * .34, pluck(hz(n), 1, .4, 700 + k), .1, 0, "mus")
    # Kosacki & detector: the score brightens
    plucks(CUT["kosacki"], CUT["german"], prog_bright, .11, bright=.72, with_tick=True, seed=660, pan=-.1)
    t = CUT["kosacki"]; k = 0
    while t < CUT["german"]:
        ch = prog_bright[(k // 4) % 4]
        put(t, glock(hz(ch[k % 3]) * 4), .035, .4, "mus"); t += beat; k += 1
    # German: sly low walk
    t = CUT["german"]; k = 0; walk = ["D2", "F2", "Ab2", "A2", "D2", "F2", "Ab2", "A2"]
    while t < CUT["blind"] - .1:
        put(t, bass_note(hz(walk[k % 8]), .34), .2, 0, "mus"); put(t, pluck(hz(walk[k % 8]) * 2, .4, .55, 800 + k), .09, -.2, "mus"); t += beat; k += 1
    # blind + back to bayonet: the score drops out for the joke
    put(CUT["backtobayonet"] + .05, bass_note(hz("D2"), 1.1), .16, 0, "mus")
    # tape: low and steady
    plucks(CUT["tape"], CUT["split"], prog_minor, .08, low=True, seed=860)
    # split + bangalore: drums gather
    t = CUT["split"]; k = 0; end = Q["chain"] - .06
    while t < end:
        g = lerp(.16, .36, (t - CUT["split"]) / (end - CUT["split"]))
        put(t, tom(58 if k % 4 == 0 else 74, .42, 1, 20 + k), g, -.2 if k % 2 else .2, "mus")
        if k % 8 == 0: put(t, brass(hz("D2") if (k // 8) % 2 == 0 else hz("Bb1"), 1.1, 1, 30 + k), .1, 0, "mus")
        t += e8; k += 1
    drone(hz("D2"), CUT["split"], Q["chain"], .08, 9)
    # flail: march
    t = CUT["flail"]; k = 0
    while t < CUT["general"] - .08:
        if k % 4 == 0: put(t, tom(58, .42, 1, 40 + k), .3, 0, "mus")
        if k % 2 == 1 or k % 16 >= 14: put(t, snare(50 + k), .085, .25, "mus")
        if k % 8 == 0:
            root = ["D2", "Bb1", "G1", "A1"][(k // 8) % 4]
            put(t, brass(hz(root) * 2, 1.15, 1, 60 + k), .13, 0, "mus")
        t += e8; k += 1
    # general: thin pluck, then nothing at all before the click
    plucks(CUT["general"], Q["ditolak"] - .1, prog_minor, .08, seed=950)
    put(Q["bigBoom"], brass(hz("D2"), 3.2, 1, 90), .3, 0, "mus")
    put(Q["pill"], brass(hz("A2"), 1.6, 1, 91), .14, 0, "mus")


def shellshock():
    """(time, attack, hold, release): the world goes dull after a blast, then opens back up."""
    return [(Q["boom1"], .02, .35, 1.0), (Q["boom2"], .02, .9, 1.8), (Q["betClick"], .1, Q["boom2"] - Q["betClick"], .01), (Q["bigBoom"], .02, .5, 1.1), (Q["chain"] + .65, .02, .1, .8)]

def bed_gain():
    """Automation for ambience + music: held breath before the S-mine blast, dead air before the last click."""
    return ([0, Q["betClick"] - .08, Q["betClick"], Q["boom2"], Q["boom2"] + 2.4, Q["ditolak"] + .2, Q["genClick"] - .28, Q["genClick"] - .12, Q["bigBoom"] - .02, Q["bigBoom"], DUR],
            [1, 1, .42, .42, 1, 1, 1, .02, .02, 1, 1])
