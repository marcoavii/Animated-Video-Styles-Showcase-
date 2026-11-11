# Katalog Basic style 4

## Shot

```js
S("id", t0, t1, set, cam, { trans, amb, grade, dof, sway, ease, frameGrade, pcam, pk, do(t, u, l) {} });
```

Tanpa `trans` = hard cut (gaya ini). `diss(0.12)` hanya untuk lompatan waktu. `cam` = `[[u, [x,y,z], [lookX,lookY,lookZ], fov, ease?], ...]`. `frameGrade: (t) => ({ exposure })` untuk fade gelap di akhir. `dof` biarkan kosong (set gaya ini memakai `dof: null`).

`timeline(timing, { ending: "loop", tail: 0.8, hi: ["kata", "kunci"] })` → `W("A1", i)` awal kata ke-i, `cue`, `hit` (getar kamera), `act` (musik).

## Karakter: `Puppet` (`toon.js`)

`new Puppet(scene, opsi)`; tinggi 2,4 m, kaki di y=0, menghadap +z.

| Opsi | Nilai |
|---|---|
| warna | `skin`, `shirt`, `sleeve`, `sleeveLen` (0 tanpa lengan baju, 0,42 lengan pendek, 1 panjang), `pants`, `shoe`, `hairC`, `browC` |
| `hair` | `"short"`, `"bun"`, `"bald"`, `"none"` |
| `hijab` | warna kerudung (menutup rambut, wajah dibingkai) |
| `pattern` + `patternC` | `"check"`, `"flower"`, `"stripes"` |
| lain | `buttons`, `glasses`, `seed` (wajib beda, menggeser kedip), `res` (1536 default, 768 untuk figuran kecil) |

`p.pose({...})` tiap frame: `x y z ry rx rz scale hop squash t visible`, `expr`, `look:[x,y]`, `armL armR` (derajat, 0 = turun, + = terangkat ke luar), `elbowL elbowR` (+ = lengan bawah melipat ke badan), `headTilt`, `headTurn`, `walk` + `walkRate`, `kneel`, `back` (tampak belakang), `sweat`, `holdR: "bucket"`, `wave` (melambai), `blob:false` (tanpa bayangan kaki), `breath`.

- Berbaring: `rz: Math.PI/2` (kepala ke kiri), lihat fungsi `lying()` di contoh.
- `p.tint(0xfff0de)` untuk menyesuaikan warna dengan cahaya set (malam, lampu minyak).
- Ekspresi: `neutral happy joy laugh angry smug shock terror worried sad sleepy sleep sing hum shout stern`.
- Tambahan benda di tangan: daftarkan fungsi gambar baru di `HOLD`.

## Benda 2D: `Cutout` (`toon.js`) + `props2d.js`

`new Cutout(scene, w, h, tinggiDunia, draw, { anchor: "bottom", res, state })`; `c.update(t, state)` menggambar ulang hanya kalau `state` berubah. Gambar dengan `sticker(g, path, fill)`, `tube(g, titik, lebar, warna)`, `rrect`, `circ`, `ell`, `shade`.

Siap pakai: `drawFish {col, flop}`, `drawNote {col}`, `drawPillow`, `drawBlanket`, `drawArm {open, skin, sleeve}` (insert tangan khas referensi), `drawWave {foam, lip}` (dinding ombak tiga gulungan), `drawWaveShadow`.

## Set

`set_room4.js`: `buildRoom4(engine, { W, D, H, wall, blot, dado, dadoH, floor, grout })` ruangan referensi (plester bercak, dado biru-hijau, keramik). `blotchTex`, `tilesTex` untuk set baru. Helper 3D di `kit.js`: `box rbox cyl sph plane group poster drawTex textLines spot lamp sun makeSky makeSea gradientEnv`. Setiap set mengembalikan `{ scene, grade, dof: null, reset(), update(t) }`.

Contoh di `examples/smong-sample/`: pulau malam, rumah panggung malam (dinding anyaman, lampu minyak, kalender, bayangan ombak di dinding), pantai (laut yang surut, karang, perahu, kampung, bukit dan meunasah, `groundY`, `seaY`, `pathAt`).

## Ambience, musik, SFX

Sama dengan library sintesis di `kit/audio/design.py` (lihat docstring di sana): bed `office customs stairs seaday seanight seawide harbor ...`, babak musik `comic warm suspense busy tension sly resolve none`, SFX `whoosh impact_big sub_drop_big reveal_braam brass_stab sparkle paper_slide stamp_thud cloth_flop footsteps_march crowd_laugh seagull wind_gust ...`. Bunyi, bed, dan babak baru ditulis di `audio/custom_sfx.py` proyek; contoh lengkap (lagu pengantar tidur, laut surut, raungan ombak, hantaman, rapa'i, taiko) ada di `examples/smong-sample/custom_sfx.py`. Bed baru perlu didaftarkan di `AMB2ENV` dan `BED_TARGET` di `audio/design.py` proyek.
