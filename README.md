# Basic style

Satu skill Claude Code berisi tiga gaya video pendek. Kamu cukup kirim **VO ElevenLabs + script + brief visual**, lalu
pilih gayanya. Repo ini juga berisi skill lain yang dipasang terpisah: **Basic style 4**, **Rick Style**, **2D Vintage Character**, dan
**jkson what if style** (animasi kartun "What If" 15-25 detik dari satu baris topik, di bagian bawah README).

| Gaya | Tampilan | Rasio |
|---|---|---|
| **Basic style 1** | Peta kuno parchment + karakter chibi, caption highlight kuning | 9:16, 30 FPS |
| **Basic style 2** | Kartun tinta tebal malam berbulan + gag UI game, caption per kata | 9:16 / 16:9, 60 FPS |
| **Basic style 3** | Kartun 3D sinematik three.js, whip + motion blur, teks 3D memantul | 9:16 / 16:9, 60 FPS |
| **Basic style 4** | Karakter stiker 2D vektor (outline tebal + glow krem) di set 3D kalem, hard cut, insert tangan + benda, kata kunci kuning | 9:16 / 16:9, 60 FPS |
| **Rick Style** | Karakter kepala putih bergaris tinta, kaki lidi, di dunia 3D sangat berwarna, kamera terbang FPV, dissolve | 9:16 / 16:9, 60 FPS |
| **2D Vintage Character** | Karakter kartun 2D kepala kacang bergaris ungu tebal-tipis di dunia 3D berwarna yang dicat tangan, kamera meluncur halus, preset cahaya pagi/senja/malam | 9:16 / 16:9, 30 FPS |
| **jkson what if style** | animasi kartun stick-figure "What If" (Remotion + ElevenLabs) | 9:16 / 16:9, 60 FPS |

## Pasang

```bash
# Basic style (1 / 2 / 3) - kartun peta chibi, tinta malam, atau 3D sinematik
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git ~/.claude/skills/basic-style

# Basic style 4 dan Rick Style - masing-masing skill terpisah
git clone --depth 1 https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git /tmp/styles-repo
cp -r /tmp/styles-repo/styles/basic-style-4 ~/.claude/skills/basic-style-4
cp -r /tmp/styles-repo/styles/rick-style ~/.claude/skills/rick-style && rm -rf /tmp/styles-repo

# 2D Vintage Character - karakter kartun 2D di dunia 3D lukisan tangan
git clone --depth 1 https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git /tmp/styles-repo
cp -r /tmp/styles-repo/styles/2d-vintage-character ~/.claude/skills/2d-vintage-character && rm -rf /tmp/styles-repo

# jkson what if style - animasi kartun stick-figure "What If" (Remotion + ElevenLabs)
git clone --depth 1 https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git /tmp/styles-repo
cp -r /tmp/styles-repo/styles/jkson-what-if-style ~/.claude/skills/jkson-what-if-style && rm -rf /tmp/styles-repo
```

Nama folder tujuannya harus benar: `basic-style` untuk Basic style, `basic-style-4` untuk Basic style 4, `rick-style` untuk Rick Style, `2d-vintage-character` untuk 2D Vintage Character, dan `jkson-what-if-style` untuk jkson what if style (jangan meng-clone seluruh repo langsung sebagai `jkson-what-if-style`, karena `SKILL.md` di akar repo milik Basic style). Mulai chat baru setelah memasang.

## Cara pakai

Tulis salah satu:

```
Basic style 1
Basic style 2 9:16
Basic style 2 16:9
Basic style 3 9:16
Basic style 3 16:9
Basic style 4 9:16
Basic style 4 16:9
Rick Style 9:16
Rick Style 16:9
2D Vintage Character 9:16
2D Vintage Character 16:9
```

lalu kirim VO, script, dan brief visual. Kalau cuma menulis `Basic style` atau langsung kirim VO + brief, Claude akan menanyakan mau pakai gaya 1, 2, atau 3 (dan rasionya). Basic style 4, Rick Style, dan 2D Vintage Character dipanggil dengan namanya sendiri.

Basic style 1-4 dan Rick Style tidak pernah membuat voice over sendiri. 2D Vintage Character juga menerima VO milikmu; kalau hanya diberi script, ia bisa membuat suara gratis lewat edge-tts.

## Isi

| Lokasi | Isi |
|---|---|
| `SKILL.md` | Pemilih gaya, dibaca Claude pertama kali |
| `styles/basic-style-1/` | Engine Canvas peta, scripts, templates, 6 contoh video |
| `styles/basic-style-2/` | Kit Canvas + audio sintesis, templates, contoh "Taman Iblis" |
| `styles/basic-style-3/` | Kit three.js + audio sintesis, templates, contoh "Penjaga Mercusuar" |
| `styles/basic-style-4/` | Skill terpisah: `SKILL.md`, kit three.js + karakter stiker 2D (`toon.js`, `props2d.js`), audio sintesis, templates, contoh "Smong" 9:16 |
| `styles/2d-vintage-character/` | Skill terpisah: `SKILL.md`, `SETUP.md`, kit three.js + Playwright (`web/cast.js`, `toonbase.js`, `paint.js`), tools (captions, thumbnail, TTS, mix), contoh "Why Is It So Hard to Let Go?" |
| `styles/rick-style/` | Skill terpisah: `SKILL.md`, kit three.js + karakter tinta billboard (`sketch.js`), set berwarna, audio sintesis, templates, contoh "Smong" 9:16 |

Setiap gaya punya `STYLE.md` (alur kerja lengkap) dan `references/` sendiri. Kode antar gaya sengaja tidak dicampur, supaya hasil tiap gaya tetap sama dengan video aslinya.

## Kebutuhan

- Python 3.12 dengan numpy, scipy, Pillow, faster-whisper. Pakai `av==14.2.0` (av yang lebih baru merusak faster-whisper).
- ffmpeg dan ffprobe di PATH
- Node.js
- Chrome atau Edge
- Internet saat render Basic style 1 (data peta, font, dan encoder diunduh)

Proyek dibuat di `D:\basic-style-2\<nama>`, `D:\basic-style-3\<nama>`, `D:\basic-style-4\<nama>`, `D:\rick-style\<nama>`, dan `D:\2d-vintage-character\<nama>`. Basic style 1 memakai folder kerja sementara. Semua hasil disalin ke Desktop. Path Python ditulis untuk Windows, jadi sesuaikan kalau beda.

Video MP4, file VO, dan audio tidak disimpan di repo ini.

## Lisensi font

`styles/basic-style-2/kit/fonts/` berisi Rubik dan Black Ops One (SIL Open Font License) serta Permanent Marker (Apache License 2.0). `styles/basic-style-3/kit/scenes/fonts/` berisi Plus Jakarta Sans (SIL Open Font License). Semua dari paket Fontsource. `styles/basic-style-4/kit/scenes/fonts/` dan `styles/rick-style/kit/scenes/fonts/` berisi Montserrat (SIL Open Font License).

## 2D Vintage Character

Berasal dari plugin "2D Vintage Animation" oleh Lumenstick Studio (MIT, lihat `styles/2d-vintage-character/LICENSE` dan `licenses/THIRD-PARTY.md`), dipasang ulang sebagai satu skill mandiri: path plugin diganti ke folder skill, dan langkah setup dipindah ke `SETUP.md`. Kit berisi three.js r160 (MIT). Playwright, edge-tts, dan faster-whisper dipasang lewat npm/pip, tidak ikut di repo.

## jkson what if style (What If animation)

Dulu bernama **jkson style**; namanya diganti menjadi **jkson what if style** (folder `jkson-what-if-style`). Nama lama tetap memicu skill ini.

Skill kedua di repo ini: animasi kartun stick-figure gaya channel "What If" yang meledak di YouTube Oktober 2026.
Satu baris topik ("What if you could rewind 10 seconds?") masuk, episode jadi 15-25 detik keluar: script di atas
formula tujuh beat What If, voice ElevenLabs, storyboard yang dicek sendiri sebelum animasi, setiap frame digambar
sebagai SVG yang dirender Remotion, sound design disintesis, master ke -14 LUFS.

- **Isi**: `styles/jkson-what-if-style/` — `SKILL.md` (alur kerja 8 langkah), `references/` (formula, look, kit, sound, traps), `scripts/` (voice, plan, stills, board, sfx, mixcheck, motiongrid, master), `studio/` (proyek Remotion + episode contoh: `rewind`, `copy-paste`, dan demo `intro-demo` yang bisa dirender tanpa ElevenLabs), `opencode/commands/what-if.md`
- **Rasio**: 16:9 (default) dan 9:16 — re-frame vertikal dari dunia animasi yang sama, per-shot reframe di `episode.json`; render `python scripts/master.py <slug> --aspect 9x16`
- **Pasang**:

```bash
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git
cp -r Animated-Video-Styles-Showcase-/styles/jkson-what-if-style ~/.config/opencode/skills/jkson-what-if-style   # OpenCode
cp -r Animated-Video-Styles-Showcase-/styles/jkson-what-if-style ~/.claude/skills/jkson-what-if-style            # Claude Code
```

- **Pakai**: tulis "jkson what if style: what if ..." di Claude Code atau OpenCode (atau `/what-if <topik>` di OpenCode) — skill terdeteksi otomatis
- **Kebutuhan**: Python 3.9+ dengan numpy dan Pillow, Node 18+, ffmpeg dan ffprobe di PATH, dan `ELEVENLABS_API_KEY` di environment atau `.env` (tanpa VO pakai key, tanpa kredensial ElevenLabs)
- Video MP4, file VO, dan audio SFX tidak disimpan di repo ini; `studio/library/sfx/` diisi ulang otomatis oleh `sfx.py` (cached by prompt), audio bisa juga diunduh ulang dari contoh yang ada.
