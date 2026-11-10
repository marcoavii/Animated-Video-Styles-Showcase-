"""Sound design for one video: place events on the timeline. All synths live in tools/sfxlib.py."""
from sfxlib import *


def spot():
    spot_transitions()                                          # whooshes for every cut in cues.json
    put(Q["boom"], boom(.9, 7, 3.0), 1.0, desert=.3)
    put(Q["boom"] + .15, ui_blip(420, 280), .13, -.7)           # kill feed
    put(Q["bigBoom"], boom(1.25, 11, 3.0), 1.22, .1, desert=.45)
    put(Q["bigBoom"] + .02, sub_hit(32, 2.4), .65)
    put(Q["pill"] - .12, whoosh(.24, True, 144), .42)
    put(Q["pill"] + .02, sub_hit(64, .7), .42)


def ambience():
    # shot -> (wind, crickets, guns, room, lantern, canvas)
    ambience_mix({"intro": (.42, .4, .55, 0, 0, 0), "field": (.42, .4, .55, 0, 0, 0)})


def score():
    plucks(CUT["intro"] + .3, Q["boom"] - .2, PROG_MINOR, .1, with_tick=True)
    put(Q["bigBoom"], brass(hz("D2"), 3.2, 1, 90), .3, 0, "mus")


def shellshock():
    return [(Q["boom"], .02, .35, 1.0), (Q["bigBoom"], .02, .5, 1.1)]
