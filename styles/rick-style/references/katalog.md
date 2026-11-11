# Katalog Rick Style

## Shot

```js
S("id", t0, t1, set, cam, { trans, amb, grade, dof, sway, ease, frameGrade, pcam, pk, do(t, u, l) {} });
```

`trans`: `diss(0.12–0.25)` default, `push(amt, d)` zoom kejut, `whip(dir, d)` jarang. `cam` boleh banyak keyframe untuk terbang FPV: `[[0, posJauh, look, 52], [0.75, posDekat, look, 40, "io"], [1, posAkhir, look, 38]]`. `sway` 0,4–1,4 (kamera hidup). `dof: { ap: 0.03, max: 0.012 }` untuk close-up benda. `frameGrade: (t) => ({ exposure: 0 })` untuk smash to black.

`timeline(timing, { ending: "loop", tail })` → `W`, `cue`, `hit`, `act`.

## Karakter: `Toon` (`sketch.js`)

`new Toon(scene, opsi)`; tinggi 2,4 m, kaki di y=0, billboard otomatis menghadap kamera.

| Opsi | Nilai |
|---|---|
| warna | `shirt`, `pants`, `shoe`, `head` (default putih), `vest`, `tie`, `hairC`, `hatC` |
| `hair` | `"tuft"` (jambul samping), `"cap"` (rambut penuh), `"none"` |
| `hat` | `"cap"` (garis-garis), `"peci"` |
| `hijab` | warna kerudung |
| lain | `pattern` + `patternC` (`"flower"`, `"stripes"`), `buttons`, `collar:false`, `seed` (wajib beda), `res` |

`t.pose({...})`: `x y z ry t visible scale hop squash`, `expr`, `look`, `armL armR` (derajat, 0 turun), `elbowL elbowR`, `headTilt`, `walk` + `walkRate`, `back`, `sweat`, `steam` (uap marah), `wave` (melambai), `holdR: "bucket"`, `lie` + `lieTilt` (berbaring telentang di bidang 3D), `blob:false`.

Ekspresi: `neutral happy joy laugh smug sly shock terror worried angry sleep sleepy sing hum shout`. Tambah topi atau benda di tangan dengan menambah cabang di `draw()` atau `HOLD`.

`t.tint(0xffe2c8)` untuk ruangan berlampu hangat.

## Set dan prop

- `set_vivid.js`: `buildVivid(engine, { sky, ground })` eksterior awal; `paintTex(stops, seed, rx, ry)` tekstur bergaya cat untuk tanah, dinding, kayu.
- `props.js` (3D, outline tipis): `makePalm makeHouse makeBoat makeFish makeBucket makeNote rockLump coral`.
- Helper `kit.js`: `box rbox cyl sph plane group poster drawTex textLines spot lamp sun makeSky makeSea gradientEnv dust halo shaft`.
- Contoh `examples/smong-sample/`: pulau malam ungu (`set_island.js`), rumah panggung bercahaya lampu minyak (`set_house.js`), pantai jenuh dengan laut yang surut, karang, kampung, bukit, dan ombak 3D bergulung (`set_beach.js`: `groundY`, `seaY`, `pathAt`, `world(t, {waveZ, waveH, flop, gulls})`).

## Ambience, musik, SFX

Library sintesis `kit/audio/design.py`: bed `office customs stairs seaday seanight seawide harbor ...`, babak musik `comic warm suspense busy tension sly resolve none`, SFX `whoosh whoosh_push rise_whoosh impact_big sub_drop_big reveal_braam brass_stab sparkle cloth_flop footsteps_march seagull wind_gust ...`. Tambahan per video di `audio/custom_sfx.py`; contoh lengkap (pengantar tidur, laut surut, raungan dan hantaman ombak, langkah di pasir, kerumunan) di `examples/smong-sample/custom_sfx.py`. Bed baru didaftarkan di `AMB2ENV` dan `BED_TARGET` di `audio/design.py` proyek.
