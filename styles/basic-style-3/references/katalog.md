# Katalog

## Shot

```js
S("id", t0, t1, set, cam, { trans, amb, grade, dof, sway, ease, fill, pcam, pk, roll, do(t, u, l) {} });
```

| Opsi | Arti |
|---|---|
| `cam` | `[[u, [x,y,z], [lookX,lookY,lookZ], fov], ...]`, u 0..1 |
| `trans` | transisi masuk shot ini: `whip(dir, d, amt, axis)`, `push(amt, d)`, `diss(d)` |
| `amb` | nama bed ambience (wajib tiap shot, lihat tabel) |
| `ease` | `"io"`, `"out"`, `"in"`; tanpa ini gerak linear |
| `grade` | override warna: `exposure`, `bloom`, `thresh`, `tint`, `sat`, `lift`, `contrast`, `vignette`, `ao`, `edge`, `edgeColor` |
| `dof` | `{ ap, max, focus }`; tanpa `focus` memakai jarak ke titik lihat. `null` mematikan |
| `sway` | goyangan operator, 0 untuk shot yang harus tepat (frame loop) |
| `fill` | kekuatan lampu pengisi kamera |
| `pcam`, `pk` | framing khusus 9:16, lihat `rasio.md` |

Helper `direct.js`: `P`, `whip`, `push`, `diss`, `pulse(t,t0,d)`, `popIn(t,t0,d)`, `blinkLevel(t,list,d)`, `reach(actor,params,"armR",[x,y,z])`, `attachToHand(obj,actor,idx,off)`.
Helper `kit.js`: `K(t,keys)` keyframe, `E.back/out/in/io/elastic`, `clamp`, `lerp`, `sstep`, `smooth`, `wob`, `rng`.

## Karakter (`actor.js`)

`new Actor(parentScene, opsi)`:

| Opsi | Nilai |
|---|---|
| warna | `skin`, `top`, `sleeve`, `bottom`, `hair`, `shoe`, `collar` (`null` tanpa kerah), `browColor` |
| `hairStyle` | `"cap"`, `"bob"`, `"bald"`, `"none"` |
| `hat` + `hatColor` | `"officer"`, `"beanie"`, `"fisher"`, `"harbor"` |
| wajah | `beard`, `beardColor`, `moustache`, `moustacheColor`, `glasses` |
| badan | `tie`, `stripes: [warnaA, warnaB]`, `longBody`, `scale`, `glove`, `details: [fn(actor)]` |
| `seed` | beda tiap aktor |

`actor.pose({...})`, panggil tiap frame:
`x y z ry lean tilt squash hop kneel walk`, `armL armR` (posisi tangan lokal badan, `null` = turun), `headRx headRy headRz`, `expr`, `look: [x,y]` (-1..1), `lid`, `t` (wajib, untuk napas dan kedip), `blink`, `visible`.

Tinggi karakter sekitar 2,4; pusat kepala y≈1,84, bahu y≈1,30. Ke depan badan = +z saat `ry: 0`.

**`expr`**: `neutral bored happy joy bliss beg laugh shock worried angry smirk sly shrug squint star sad`

**`ARM`**: `clasp` (memohon di depan dada), `up`, `shrug`, `hip`, `belly`, `behindHead`. Pakai `ARM.clasp[0]` untuk kiri dan `[1]` untuk kanan.

## Bangun set (`kit.js`)

- **Bentuk**: `box rbox cyl sph plane mesh group`, `poster(parent,w,h,x,y,z,ry,draw,opts)`, `text3D(str,size,color,{e,ei})`, `ink(mesh,width)`.
- **Tekstur**: `plasterTex woodTex brickTex tileTex rockTex stripeTex drawTex`, `textLines` untuk papan.
- **Material**: `M(warna,{r,m,e,ei,side,op})`, `glow(warna,kuat)`.
- **Cahaya**: `spot sun lamp halo shaft dust gradientEnv`.
- **Alam**: `makeSky(scene,o)`, `makeSea(scene,o)`.

Prop yang sudah jadi di `examples/penjaga-mercusuar/`: kapal patroli, kargo, penyelundup, perahu bercadik, camar (`set_sea.js`), kantor (`set_office.js`), ruang lensa (`set_lamp.js`), tangga menara, tangki (`set_stairs.js`), jalan pelabuhan, gedung kolonial, becak, crane (`set_harbor.js`), ruang rapat, peta meja, papan bukti (`set_customs.js`). Salin yang dibutuhkan ke proyek lalu ubah.

## Ambience (`amb`)

| Nama | Karakter | Cocok untuk |
|---|---|---|
| `office` | ruang kecil hangat, ketikan jauh | kantor, rumah, toko |
| `customs` | dengung neon, ketikan | kantor pemerintah, kelas, rumah sakit |
| `stairs` | angin bergema, tetes air | gua, gudang, gedung kosong, ruang bawah tanah |
| `lampday` | ruang kaca, angin tipis | kamar tinggi, menara, kereta |
| `lampout` | angin kencang terbuka | atap, tebing, balkon |
| `lampnight` | dengung lampu, angin pelan | ruang kerja malam, ruang mesin |
| `lampdawn` | burung jauh, angin lembut | pagi di dalam ruangan |
| `seaday` `seadawn` | ombak, angin, camar | pantai, kapal siang atau pagi |
| `seanight` | ombak pelan, lonceng pelampung | laut malam, dermaga malam |
| `seawide` | angin tinggi, ombak jauh | shot udara, peta, pemandangan luas |
| `harbor` `harbordusk` | keramaian kota, air, tali kapal | kota, pasar, jalan |

Lokasi baru: `BEDS_CUSTOM` di `audio/custom_sfx.py`.

## Musik (`act("nama", waktu)`)

`comic` (bass berjalan, buka dan lelucon), `warm` (arpeggio hangat), `suspense` (senar rendah sepi), `busy` (ostinato dan drum yang membangun), `tension` (ostinato naik untuk reveal), `sly` (tema comic kembali, punchline), `resolve` (akor penutup untuk ending fade), `none` (hening).

Satu babak berlaku sampai babak berikutnya. Musik otomatis merunduk saat ada suara.

## SFX (`cue("nama", waktu, {opsi})`)

Semua menerima `gain` kalau tertulis; `pan` -1..1.

| Kelompok | Nama |
|---|---|
| Transisi (otomatis) | `whoosh` `whoosh_push` `air_soft` |
| Besar | `impact_big{gain}` `sub_drop_big{gain}` `reveal_braam{gain}` `brass_stab{note:"up"\|"sly"}` `alarm_thud{pan}` `beat_thud{gain}` `door_burst` `reverb_tail_big` |
| Hening twist | `drop_silence` (semua bed dan musik turun hampir nol sebentar), lalu `sub_drop_big` dan `tension_bed{dur}` |
| Kilau dan nada | `sparkle{gain}` `rise_sparkle{dur}` `happy_sigh_tone{dur}` `safe_chord{gain}` `alarm_blip{pan}` `morse_tone{dur,gain}` |
| Suasana tegang | `night_sting` `drone_question{dur}` `distant_tension{dur}` `wide_swell{dur,gain}` `dawn_swell{dur}` `beam_sweep{dur,gain}` `rise_whoosh{dur}` |
| Kertas dan kain | `paper_slide` `calendar_flip{dur}` `stamp_thud{gain}` `x_stamp{gain,pan}` `cloth_flop` `cloth_shrug` |
| Benda | `knock_wall{gain,hollow}` `metal_hatch{gain}` `lever_clunk{gain}` `relay_clack{gain}` `flashlight_click` `handcuffs{gain}` `camera_flash{gain,pan}` `phone_ring{dur,gain}` `becak_bell{pan,gain}` `token_slide{dur}` `brick_settle` `creak_wood` `tick_tick{dur}` `clock_tick{dur,rate,gain}` `lamp_ignite` `rag_squeak{dur,gain}` `sip` `tank_echo{dur}` |
| Langkah | `footsteps_march{dur}` `footsteps_stair{dur}` |
| Orang | `crowd_laugh{dur}` `crowd_cheer{dur}` `sad_trombone_low{gain}` |
| Alam | `seagull{pan,gain,far}` `wing_flap{pan}` `rooster_far{gain}` `water_lap{dur,pan,gain}` `wake_water{dur}` `wind_lonely{dur}` `wind_gust{gain}` `wind_height{dur}` |
| Kapal dan kendaraan | `ship_horn_far{pan,gain}` `ship_horn_near{dur,pan}` `ship_engine_pass{dur,pan0,pan1,gain}` `speedboat{dur,pan0,pan1}` `boat_creak` `siren{dur,pan0,pan1}` `siren_far{dur,pan,gain}` `siren_room{dur,gain}` |

Tiga hal yang paling mungkin terdengar buatan: `crowd_laugh`, `crowd_cheer`, `rooster_far`. Gunakan seperlunya.
