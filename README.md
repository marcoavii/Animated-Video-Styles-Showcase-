# Basic style (1 / 2 / 3)

Satu skill Claude Code berisi tiga gaya video pendek. Kamu cukup kirim **VO ElevenLabs + script + brief visual**, lalu pilih gayanya.

| Gaya | Tampilan | Rasio |
|---|---|---|
| **Basic style 1** | Peta kuno parchment + karakter chibi, caption highlight kuning | 9:16, 30 FPS |
| **Basic style 2** | Kartun tinta tebal malam berbulan + gag UI game, caption per kata | 9:16 / 16:9, 60 FPS |
| **Basic style 3** | Kartun 3D sinematik three.js, whip + motion blur, teks 3D memantul | 9:16 / 16:9, 60 FPS |

## Pasang

```bash
git clone https://github.com/marcoavii/Basic-Style.git ~/.claude/skills/basic-style
```

Folder tujuannya harus bernama `basic-style`. Mulai chat baru setelah memasang.

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
