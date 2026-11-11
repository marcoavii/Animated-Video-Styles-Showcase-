# Optional: sounds this video needs that the library lacks. audio/design.py loads this file automatically.
# Every helper from design.py is available here (T, noise, bp, lp, hp, sine_sweep, pan_st, wide, sat, ...).
# A sound is a function returning a stereo or mono array; call it from story.js with cue("nama", t, {...}).
#
# def gamelan_hit(gain=1, **k):
#     t = T(1.4)
#     x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * a) * g for f, a, g in [(392, 3, .6), (1050, 5, .3), (2210, 8, .12)])
#     return wide(x, .5, 9) * .3 * gain
#
# BEDS_CUSTOM = {"pasar": lambda: farmurmur(40, .02) + surf(41, .004, .2, 800)}   # then amb: "pasar" on a shot
# ACTS_CUSTOM = {}                                                                 # fn(t0, t1) writing into mus
