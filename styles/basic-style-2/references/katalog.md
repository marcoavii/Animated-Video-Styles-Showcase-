# Katalog kit

Cek daftar ini sebelum menggambar atau mensintesis sesuatu yang baru. Contoh pemakaian ada di `examples/taman-iblis/`.

## Dasar (`kit/src/art.js`)
- Konstanta: `W`, `H` (stage), `OW`, `OH` (output), `PORTRAIT`, `RATIO`, `INK`, `Q` (cue bernama), `TL` (timeline), `SC` (daftar shot).
- Waktu: `ws(id, i)` awal kata ke-i, `seg(t,a,b)`, `pop(t,t0,d)`, `blinkAt(t,seed)`.
- Easing: `clamp`, `lerp`, `inCubic`, `outCubic`, `outQuart`, `inOut`, `outBack`, `outElastic`.
- Acak tetap: `hash(n)`, `noise1(x)`, `RNG(seed)`. Jangan memakai `Math.random`, karena worker render akan berbeda hasil.
- Bentuk: `sp(titik, tertutup)` kurva halus, `poly`, `ell`, `rrect`, `lin`, `rad`.
- Gambar: `ink(c, path, fill, tebal, shadeFn)`, `line(c, titik, tebal, warna, halus)`, `softGlow(c,x,y,r,warna,a)`, `label(c, teks, x, y, ukuran, {font:'Stencil'|'Marker'|'Rubik', fill, stroke, lw, rot, align})`.

## Karakter
`soldier(c, x, y, skala, opsi)`: x,y di antara kaki; skala 1 ≈ 400 px.
- `kit`: `brit`, `german`, `rommel`, `general`, `polish`, `soviet`, `us`. Kit baru: tambahkan entri ke `KITS` di `scenes.js`.
- `face` (lihat `gaya.md`), `blink`, `lookX`, `lookY`, `headTilt`, `tilt`, `sweat` (0–1), `glasses`, `mustache: warna`, `phones`, `noHat`, `flip`.
- `stance: 'sit'`, `stride`, `footDir`.
- `armL`, `armR`: `[sudutBahu, sudutSiku, tangan]`, radian dengan 0 = kanan, plus = bawah; tangan `open`, `fist`, `point`, `thumb`.
- `holdL`, `holdR`: `(R, A) => ...` menggambar benda di tangan. `extra: R => ...` menambah bagian tubuh.

`proneSoldier(c, x, y, skala, opsi)`: tengkurap menghadap kanan (`wig`, `face`, `nearA`, `nearB`, `hold`, `sweat`).

`ghostWalk(c, x, y, skala, fase, alfa)`: figur transparan "kamu".

Topi: `helmetBrit`, `helmetGerman`, `capGeneral`, `capRommel`, `capPolish`, `capSoviet`, `capUS`.

`Rig` membuat puppet baru dengan halo: `new Rig(c, halo)`, lalu `.shape`, `.tube`, `.fn`, `.draw()`.

## Latar (`kit/src/props.js`)
- `drawBg(c, 'kunci', fungsiLukis)`: dilukis sekali lalu di-cache. `Object.assign(BG_GRADE, { kunci: '#a4b1c9' })` memberi grade malam; kunci berakhiran `Fg` untuk layer berlubang.
- `camAt(lt, d, z0, z1, x0, x1, y0, y1)`, `layer(c, cam, depth, fn)`, `fgFrame(c, cam, seed, {top:false})`, `fullRect(c, warna)`.
- `desertBack(g, r, {hz, mx, my, mr})`: langit, awan, bulan, dan dune. Atau rakit dari `sky`, `clouds`, `moon`, `ridge`.
- `sandGround(g, r, y, {hi, mid, lo, seed, amp, px, pool})`, `sandSpecks`, `tuft`, `rock`, `wirePost`, `barbed`.

Latar nondesert (kota, hutan, laut) dibuat dengan fungsi lukis baru di `scenes.js`, memakai `ink`, `sp`, dan gradien yang sama.

## Prop
`tellerMine`, `mineSide`, `sMine`, `woodMine`, `glassMine`, `bayonet` (holdR), `detectorTool` (holdR), `plunger`, `flailTank`, `skull`. Di contoh `scenes.js`: `lantern`, `missionMap`, `wreckTruck`, `drums`, `devilFlower`.

## Efek
`explosion(c,x,y,umur,{s,seed,smoke,life})`, `puffs`, `dustKick`, `sparkle`, `twinkle`, `stepped`.

## Gag dan UI
`killFeed`, `hudStrip`, `hud`, `progressBar`, `stamp(c,t,t0,x,y,teks,{size,rot,col})`, `bubble(c,x,y,skala,teks,{w,h,size,tail})`, `thoughtDots`, `redArrow(c,x0,y0,cx,cy,x1,y1,k,{lw,col})`.

## `window.VIDEO`
Di akhir `scenes.js`: `shakes` `[t, px, detik]`, `flashes` `[t, detik, warna]`, `grade` (warna multiply per shot), `bigWords` (ukuran caption per frasa), `framing` (lihat `rasio.md`).

## Suara (`kit/tools/sfxlib.py`)
`sound.py` mendefinisikan `spot()`, `ambience()`, `score()`, dan opsional `shellshock()` serta `bed_gain()`.

Penempatan: `put(t, sinyal, gain, pan, bus="sfx", desert=kirim, room=kirim)`. `spot_transitions()` otomatis memberi suara semua cut.

**Efek:** `boom(ukuran, seed, ekor)`, `whoosh`, `riser`, `sub_hit`, `thud`, `stamp_slam`, `paper`, `sand_crunch`, `scratch_stroke`, `chalk`, `click_mech(berat)`, `metal_clunk`, `helmet_clank`, `tink`, `glint`, `modal` (logam/kayu kustom), `beep`, `ui_blip`, `braam`, `heartbeat`, `spring_launch`, `water`, `tape_zip`, `lamp_pop`, `stick_ratchet`, `tinnitus`, `cough_engine`, `pop_mine`. Mesin tank dan rantai flail ada di `spot()` contoh.

**Ambience:** `ambience_mix(tabel)`, dengan tabel `shot: (angin, jangkrik, meriam, ruangan, lentera, kanvas)`. Shot yang tidak ada di tabel memakai default luar ruangan.

**Musik:** `plucks(t0, t1, PROG_MINOR|PROG_BRIGHT, gain, ...)` mulai ulang di tiap cut supaya perubahan jatuh di edit; `drone`, `tom`, `snare`, `tick`, `brass`, `bass_note`, `pluck`, `glock`, `hz("D2")`.

**Waktu:** `Q`, `CUT[nama]`, `P`, `ws(id, i)`.

Level detail di bawah narasi sekitar 0,2–0,7. Mix mengecilkan efek saat ada narasi, jadi efek kecil perlu gain lebih besar dari yang terasa wajar.
