# Basic style (1 / 2 / 3)

Satu skill Claude Code berisi tiga gaya video pendek. Kamu cukup kirim **VO ElevenLabs + script + brief visual**, lalu
pilih gayanya. Repo ini juga berisi **jkson style**, skill kedua di bagian bawah README: animasi kartun "What If"
15-25 detik dari satu baris topik.

| Gaya | Tampilan | Rasio |
|---|---|---|
| **Basic style 1** | Peta kuno parchment + karakter chibi, caption highlight kuning | 9:16, 30 FPS |
| **Basic style 2** | Kartun tinta tebal malam berbulan + gag UI game, caption per kata | 9:16 / 16:9, 60 FPS |
| **Basic style 3** | Kartun 3D sinematik three.js, whip + motion blur, teks 3D memantul | 9:16 / 16:9, 60 FPS |

## Pasang

```bash
# Basic style (1 / 2 / 3) - kartun peta chibi, tinta malam, atau 3D sinematik
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git ~/.claude/skills/basic-style

# jkson style - animasi kartun stick-figure "What If" (Remotion + ElevenLabs)
git clone --depth 1 https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git /tmp/styles-repo
cp -r /tmp/styles-repo/styles/jkson-style ~/.claude/skills/jkson-style && rm -rf /tmp/styles-repo
```

Nama folder tujuannya harus benar: `basic-style` untuk Basic style, dan `jkson-style` untuk jkson style (jangan meng-clone seluruh repo langsung sebagai `jkson-style`, karena `SKILL.md` di akar repo milik Basic style). Mulai chat baru setelah memasang.

## Cara pakai

Tulis salah satu:

```
Basic style 1
Basic style 2 9:16
Basic style 2 16:9
Basic style 3 9:16
Basic style 3 16:9
```

lalu kirim VO, script, dan brief visual. Kalau cuma menulis `Basic style` atau langsung kirim VO + brief, Claude akan menanyakan mau pakai gaya 1, 2, atau 3 (dan rasionya).

Skill ini tidak pernah membuat voice over sendiri.

## Isi

| Lokasi | Isi |
|---|---|
| `SKILL.md` | Pemilih gaya, dibaca Claude pertama kali |
| `styles/basic-style-1/` | Engine Canvas peta, scripts, templates, 6 contoh video |
| `styles/basic-style-2/` | Kit Canvas + audio sintesis, templates, contoh "Taman Iblis" |
| `styles/basic-style-3/` | Kit three.js + audio sintesis, templates, contoh "Penjaga Mercusuar" |

Setiap gaya punya `STYLE.md` (alur kerja lengkap) dan `references/` sendiri. Kode antar gaya sengaja tidak dicampur, supaya hasil tiap gaya tetap sama dengan video aslinya.

## Kebutuhan

- Python 3.12 dengan numpy, scipy, Pillow, faster-whisper. Pakai `av==14.2.0` (av yang lebih baru merusak faster-whisper).
- ffmpeg dan ffprobe di PATH
- Node.js
- Chrome atau Edge
- Internet saat render Basic style 1 (data peta, font, dan encoder diunduh)

Proyek dibuat di `D:\basic-style-2\<nama>` dan `D:\basic-style-3\<nama>`. Basic style 1 memakai folder kerja sementara. Semua hasil disalin ke Desktop. Path Python ditulis untuk Windows, jadi sesuaikan kalau beda.

Video MP4, file VO, dan audio tidak disimpan di repo ini.

## Lisensi font

`styles/basic-style-2/kit/fonts/` berisi Rubik dan Black Ops One (SIL Open Font License) serta Permanent Marker (Apache License 2.0). `styles/basic-style-3/kit/scenes/fonts/` berisi Plus Jakarta Sans (SIL Open Font License). Semua dari paket Fontsource.

## jkson style (What If animation)

Skill kedua di repo ini: animasi kartun stick-figure gaya channel "What If" yang meledak di YouTube Oktober 2026.
Satu baris topik ("What if you could rewind 10 seconds?") masuk, episode jadi 15-25 detik keluar: script di atas
formula tujuh beat What If, voice ElevenLabs, storyboard yang dicek sendiri sebelum animasi, setiap frame digambar
sebagai SVG yang dirender Remotion, sound design disintesis, master ke -14 LUFS.

- **Isi**: `styles/jkson-style/` — `SKILL.md` (alur kerja 8 langkah), `references/` (formula, look, kit, sound, traps), `scripts/` (voice, plan, stills, board, sfx, mixcheck, motiongrid, master), `studio/` (proyek Remotion + dua episode contoh: `rewind` dan `copy-paste`), `opencode/commands/what-if.md`
- **Pasang**:

```bash
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git
cp -r Animated-Video-Styles-Showcase-/styles/jkson-style ~/.config/opencode/skills/jkson-style
```

- **Pakai**: tulis "jkson style: what if ..." (atau `/jkson <topik>`) di OpenCode — skill terdeteksi otomatis
- **Kebutuhan**: Python 3.9+ dengan numpy dan Pillow, Node 18+, ffmpeg dan ffprobe di PATH, dan `ELEVENLABS_API_KEY` di environment atau `.env` (tanpa VO pakai key, tanpa kredensial ElevenLabs)
- Video MP4, file VO, dan audio SFX tidak disimpan di repo ini; `studio/library/sfx/` diisi ulang otomatis oleh `sfx.py` (cached by prompt), audio bisa juga diunduh ulang dari contoh yang ada.
