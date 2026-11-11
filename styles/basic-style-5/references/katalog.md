# Katalog Basic style 5

Semua modul ada di `kit/scenes/js/` dan ikut tersalin ke setiap proyek.

## Pemeran: `people.js`

```js
import { Villager } from "./people.js";
const juragan = new Villager(set.scene, { seed: 3, shirt: "batik", top: "peci", mustache: true });
const petani = new Villager(set.scene, { seed: 7, shirt: "#0d9a86", top: "hair", hairColor: 0x3a2312 });
juragan.pose({ x, z, ry, t,
  expr: { eyes: "dot" | "ring" | "happy" | "closed" | "side", brow: "flat" | "angry" | "worried" | "up" | "sly" | "none",
          mouth: "lips" | "grin" | "smile" | "flat" | "frown" | "open" | "o", look: -1..1 /* pupil kiri-kanan untuk ring */ },
  yaw, pitch, headTilt,              // derajat, kepala
  armL: [raise, forward, elbow], armR: [...],   // derajat; [6, 0, 10] = tergantung santai, [55, 10, -50] = merentang
  walk: 0 | 1.6,                     // langkah per detik
  lean, tilt, bob,                   // badan
  sweat: 0..1, stink: 0..1,          // emote
  talk: 0 | 1 });                    // mulut buka-tutup (bukan untuk mouth "lips")
```

Opsi: `shirt` = `"batik"` atau warna hex; `top` = `"peci"`, `"hair"`, `"none"`; `skin`, `hairColor`, `mustache`, `scale`, `seed`.
Tangan: `villager.arms[0|1].hand` (Object3D) untuk menaruh benda di tangan (`getWorldPosition`).

## Dunia: `village.js`

- `buildVillage(engine, { ponds: [[x, z, w, d, { water: "blue" | "green" | "none", depth, level }]], houses: [[x, z, ry]], sunDir, seed })` → set desa lengkap (tanah berlubang di kolam, rumput depan, rumah, pohon, kelapa, semak, pagar, langit). `set.ponds[i].userData.top` = tinggi permukaan air.
- `buildUnderwater(engine, { seed })` → bawah air hijau dengan pita cahaya, plankton bercahaya (`set.orbs`), batu.
- `rice(parent, pondGroup, { spacing, seed })` → `set({ h, ripe })`: padi di petak dangkal (`pond(..., { depth: 0.32, level: 0.78 })`); muda `{ h: 0.38 }`, panen `{ h: 1.35, ripe: 1 }`. Contoh lengkap: `examples/abu-dapur-sawah/`.
- Bagian lepas: `tree`, `bush`, `palm`, `fence`, `house`, `pond`, `path(parent, x, z, w, l, ry)`, `blades` (rumput depan), `ground`.

## Prop: `props5.js`

- `sack(parent, x, z, s, ry, label)` karung anyaman berlabel merah
- `bucket(parent, x, z, color, s)` ember (biru 0x2a6fd6, merah 0xd43a2a)
- `sign(parent, x, z, [{ t: "9" }, { t: "KARUNG" }], { w, h, post, ry, accent })` papan angka/label
- `hangingScale(parent, x, y, z, s)` → `{ g, needle, set(v 0..1) }` timbangan gantung berpiringan bening
- `fish(parent, x, y, z, s, ry)` ikan low-poly
- `pellets(parent, n, seed, color, size)` (abu: `0x9c9a94, 0.8`) → `set(t, t0, [x,y,z], floorY, dir)` pelet yang dilempar lalu jatuh
- `chicken(parent, x, z, ry, s, color)`

## Shot dan kamera (`story.js`)

- `S(id, t0, t1, set, [[0, pos, look, fov], [1, pos, look, fov]], { amb: "desa", sway: 0.2-0.3, trans, dof, do(t, u, l) })`
- Selalu dua keyframe yang berbeda 10-15% jarak (dorong atau tarik), kadang geser sedikit ke samping untuk efek orbit.
- `trans: diss(0.28)` saat pindah tempat; tanpa `trans` = hard cut.
- Close-up: `dof: { ap: 0.004, max: 0.004 }`.

## Suara

- `act("none", 0)` di awal (tanpa musik).
- Bed: `"desa"`, `"bawahair"`. SFX bawaan `design.py` dipakai seperlunya, misalnya `cue("water_lap", t)`, `cue("sparkle", t)`, `cue("cloth_flop", t)`, `cue("paper_slide", t)`. Bunyi baru di `audio/custom_sfx.py`.
