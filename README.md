# Basic style

Satu skill Claude Code berisi tiga gaya video pendek. Kamu cukup kirim **VO ElevenLabs + script + brief visual**, lalu
pilih gayanya. Repo ini juga berisi skill lain yang dipasang terpisah: **Basic style 4**, **Basic style 5**, **Rick Style**, **2D Vintage Character**, dan
**jkson what if style** (animasi kartun "What If" 15-25 detik dari satu baris topik, di bagian bawah README).

| Gaya | Tampilan | Rasio |
|---|---|---|
| **Basic style 1** | Peta kuno parchment + karakter chibi, caption highlight kuning | 9:16, 30 FPS |
| **Basic style 2** | Kartun tinta tebal malam berbulan + gag UI game, caption per kata | 9:16 / 16:9, 60 FPS |
| **Basic style 3** | Kartun 3D sinematik three.js, whip + motion blur, teks 3D memantul | 9:16 / 16:9, 60 FPS |
| **Basic style 4** | Karakter stiker 2D vektor (outline tebal + glow krem) di set 3D kalem, hard cut, insert tangan + benda, kata kunci kuning | 9:16 / 16:9, 60 FPS |
| **Basic style 5** | Kartun 3D desa low-poly: kepala bola krem bergaris tepi hitam tebal, peci/batik, kaki lidi; sawah, kolam, pohon kelapa; kamera selalu dorong/tarik pelan, dissolve cepat, caption 1 kata, tanpa musik | 9:16 / 16:9, 30 FPS |
| **Rick Style** | Karakter kepala putih bergaris tinta, kaki lidi, di dunia 3D sangat berwarna, kamera terbang FPV, dissolve | 9:16 / 16:9, 60 FPS |
| **2D Vintage Character** | Karakter kartun 2D kepala kacang bergaris ungu tebal-tipis di dunia 3D berwarna yang dicat tangan, kamera meluncur halus, preset cahaya pagi/senja/malam | 9:16 / 16:9, 30 FPS |
| **jkson what if style** | animasi kartun stick-figure "What If" (Remotion), dari VO ElevenLabs milikmu, SFX + musik disintesis | 9:16 / 16:9, 60 FPS |

## Pasang (sekali per komputer)

Satu installer memasang **semua** gaya di repo ini plus semua tool yang dibutuhkan: program (Python 3.12, Node.js, ffmpeg, Git, Chrome) kalau belum ada, paket Python (numpy, scipy, Pillow, faster-whisper, av 14.2.0, edge-tts), paket Node yang dipakai renderer (three, puppeteer-core, Playwright Chromium), model suara Whisper `small`, lalu menyalin skill ke `~/.claude/skills`. Di akhir ia menjalankan pengecekan dan menulis OK / MISSING untuk setiap item.

### Windows

Buka **PowerShell**, lalu:

```powershell
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git
powershell -ExecutionPolicy Bypass -File Animated-Video-Styles-Showcase-\setup\install.ps1
```

Program yang belum ada dipasang lewat winget (bawaan Windows 10/11). Installer juga memastikan perintah `python` mengarah ke Python yang benar, bukan alias Microsoft Store.

### Mac

Buka aplikasi **Terminal**, lalu:

```bash
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git
bash Animated-Video-Styles-Showcase-/setup/install.sh
```

Kalau Mac menawarkan memasang "command line developer tools" saat `git clone`, klik **Install**, tunggu selesai, lalu ulangi perintahnya.

Di Mac installer ini:
- memasang **Homebrew** kalau belum ada (macOS meminta password login sekali), lalu Python 3.12, Node.js, ffmpeg, Git, dan Google Chrome;
- memakai `ffmpeg-full` kalau ffmpeg biasa tidak punya filter subtitle (dipakai untuk caption);
- membuat lingkungan Python sendiri di `~/.animated-video-styles/venv` (supaya macOS tidak menolak `pip install`) dan menaruh `python`-nya di depan PATH lewat `~/.zprofile`, `~/.zshrc`, dan `~/.bash_profile`. Jadi perintah `python` yang dipakai skill langsung jalan;
- selebihnya sama dengan Windows: paket Node, Playwright Chromium, model Whisper, salin skill, lalu pengecekan.

Proyek di Mac dibuat di `~/Videos/<gaya>/<nama>`, hasil akhir disalin ke `~/Desktop`. Render 3D memakai GPU lewat Metal.

### Linux

Sama seperti Mac (`bash .../setup/install.sh`). Program yang kurang dipasang dengan `apt` (meminta password sudo).

### Setelah memasang

Installer bertanya sekali sebelum memasang program; tambahkan `-Yes` (Windows) atau `--yes` (Mac/Linux) supaya langsung jalan. Belum punya Git? Unduh ZIP dari tombol **Code → Download ZIP**, ekstrak, lalu jalankan perintah kedua dari folder hasil ekstrak.

Setelah selesai, **tutup terminal dan mulai chat Claude Code baru** supaya PATH dan skill terbaca. Folder hasil clone boleh dihapus.

Tidak perlu API key apa pun: semua gaya memakai VO yang kamu buat sendiri di ElevenLabs lalu upload. Font dan data peta Basic style 1 serta browser Remotion untuk jkson diunduh otomatis saat pertama dipakai, jadi butuh internet.

| Perintah | Gunanya |
|---|---|
| `python setup/doctor.py` | Cek ulang apa saja yang sudah/belum terpasang |
| `python setup/install.py --update` | Perbarui skill yang sudah terpasang (versi lama dipindah ke `~/.claude/skills-backup`) |
| `python setup/install.py --skip-models --skip-node` | Hanya paket Python + salin skill |

Skill yang terpasang (semuanya diawali `basic`, jadi ketik `/basic` untuk melihat semua gaya): `basic-style` (pilih Basic style 1/2/3), `basic-style-1`, `basic-style-2`, `basic-style-3` (pintasan langsung ke gaya itu), `basic-style-4`, `basic-style-5`, `basic-rick-style`, `basic-2d-vintage-character`, dan `basic-jkson-what-if-style`.

<details>
<summary>Pasang manual (tanpa installer)</summary>

```bash
# Basic style (1 / 2 / 3) - kartun peta chibi, tinta malam, atau 3D sinematik
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git ~/.claude/skills/basic-style

# Basic style 4, Basic style 5, Rick Style, 2D Vintage Character, jkson what if style - masing-masing skill terpisah
cd ~/.claude/skills/basic-style
cp -r launchers/basic-style-1 launchers/basic-style-2 launchers/basic-style-3 styles/basic-style-4 styles/basic-style-5 ~/.claude/skills/
cp -r styles/rick-style ~/.claude/skills/basic-rick-style
cp -r styles/2d-vintage-character ~/.claude/skills/basic-2d-vintage-character
cp -r styles/jkson-what-if-style ~/.claude/skills/basic-jkson-what-if-style

# Paket Python (Python 3.10-3.13)
python -m pip install -r ~/.claude/skills/basic-style/setup/requirements.txt
```

Nama folder tujuannya harus benar: `basic-style`, `basic-style-1`, `basic-style-2`, `basic-style-3`, `basic-style-4`, `basic-style-5`, `basic-rick-style`, `basic-2d-vintage-character`, dan `basic-jkson-what-if-style` (jangan meng-clone seluruh repo langsung sebagai nama gaya lain, karena `SKILL.md` di akar repo milik Basic style). Program (Node.js 18+, ffmpeg, Chrome) pasang sendiri, lalu cek dengan `python ~/.claude/skills/basic-style/setup/doctor.py`.

</details>

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
Basic style 5 9:16
Basic style 5 16:9
Rick Style 9:16
Rick Style 16:9
2D Vintage Character 9:16
2D Vintage Character 16:9
jkson what if style 16:9
jkson what if style 9:16
```

lalu kirim VO, script, dan brief visual. Kalau cuma menulis `Basic style` atau langsung kirim VO + brief, Claude akan menanyakan mau pakai gaya 1, 2, atau 3 (dan rasionya). Basic style 4, Basic style 5, Rick Style, 2D Vintage Character, dan jkson what if style dipanggil dengan namanya sendiri.

Basic style 1-5, Rick Style, dan jkson what if style tidak pernah membuat voice over sendiri. 2D Vintage Character juga menerima VO milikmu; kalau hanya diberi script, ia bisa membuat suara gratis lewat edge-tts.

## Isi

| Lokasi | Isi |
|---|---|
| `SKILL.md` | Pemilih gaya, dibaca Claude pertama kali |
| `setup/` | Installer (`install.ps1`, `install.sh`, `install.py`), pengecek `doctor.py`, `requirements.txt` |
| `styles/basic-style-1/` | Engine Canvas peta, scripts, templates, 6 contoh video |
| `styles/basic-style-2/` | Kit Canvas + audio sintesis, templates, contoh "Taman Iblis" |
| `styles/basic-style-3/` | Kit three.js + audio sintesis, templates, contoh "Penjaga Mercusuar" |
| `styles/basic-style-4/` | Skill terpisah: `SKILL.md`, kit three.js + karakter stiker 2D (`toon.js`, `props2d.js`), audio sintesis, templates, contoh "Smong" 9:16 |
| `styles/basic-style-5/` | Skill terpisah: `SKILL.md`, kit three.js + pemeran 3D kepala bola (`people.js`), desa/sawah/kolam/bawah air (`village.js`), prop (`props5.js`), audio sintesis tanpa musik, templates, contoh "abu dapur ke sawah" 9:16. Dibuat dengan [Style Cloner](https://github.com/marcoavii/Style-Cloner) dari satu video referensi |
| `styles/2d-vintage-character/` | Skill terpisah: `SKILL.md`, `SETUP.md`, kit three.js + Playwright (`web/cast.js`, `toonbase.js`, `paint.js`), tools (captions, thumbnail, TTS, mix), contoh "Why Is It So Hard to Let Go?" |
| `styles/rick-style/` | Skill terpisah: `SKILL.md`, kit three.js + karakter tinta billboard (`sketch.js`), set berwarna, audio sintesis, templates, contoh "Smong" 9:16 |

Setiap gaya punya `STYLE.md` (alur kerja lengkap) dan `references/` sendiri. Kode antar gaya sengaja tidak dicampur, supaya hasil tiap gaya tetap sama dengan video aslinya.

## Kebutuhan

Semuanya dipasang oleh installer di atas, di Windows maupun Mac:

- Python 3.10-3.13 (disarankan 3.12) dengan numpy, scipy, Pillow, edge-tts, faster-whisper, dan `av==14.2.0` (av yang lebih baru merusak faster-whisper)
- ffmpeg dan ffprobe di PATH, dengan filter subtitle (libass)
- Node.js 18+
- Chrome atau Edge (bisa diarahkan lewat env `CHROME_PATH`)
- Git (di Windows sekalian Git Bash, dipakai skrip `new-video.sh`; Mac sudah punya shell sendiri)
- Mac: Homebrew dan lingkungan Python `~/.animated-video-styles/venv`
- Internet saat render Basic style 1 (data peta, font, dan encoder diunduh) dan saat transkrip pertama (model Whisper)

Proyek dibuat di `D:\basic-style-2\<nama>`, `D:\basic-style-3\<nama>`, `D:\basic-style-4\<nama>`, `D:\basic-style-5\<nama>`, dan `D:\rick-style\<nama>`. Di komputer tanpa drive D: otomatis pindah ke `~/Videos/<gaya>/<nama>`, atau atur sendiri lewat env `VIDEO_ROOT`. Basic style 1 memakai folder kerja sementara, 2D Vintage Character membuat folder proyek di folder kerja. Semua hasil disalin ke Desktop.

Video MP4, file VO, dan audio tidak disimpan di repo ini.

## Lisensi font

`styles/basic-style-2/kit/fonts/` berisi Rubik dan Black Ops One (SIL Open Font License) serta Permanent Marker (Apache License 2.0). `styles/basic-style-3/kit/scenes/fonts/` berisi Plus Jakarta Sans (SIL Open Font License). Semua dari paket Fontsource. `styles/basic-style-4/kit/scenes/fonts/`, `styles/basic-style-5/kit/scenes/fonts/`, dan `styles/rick-style/kit/scenes/fonts/` berisi Montserrat (SIL Open Font License).

## 2D Vintage Character

Berasal dari plugin "2D Vintage Animation" oleh Lumenstick Studio (MIT, lihat `styles/2d-vintage-character/LICENSE` dan `licenses/THIRD-PARTY.md`), dipasang ulang sebagai satu skill mandiri: path plugin diganti ke folder skill, dan langkah setup dipindah ke `SETUP.md`. Kit berisi three.js r160 (MIT). Playwright, edge-tts, dan faster-whisper dipasang lewat npm/pip, tidak ikut di repo.

## jkson what if style (What If animation)

Dulu bernama **jkson style**; namanya diganti menjadi **jkson what if style** (folder `styles/jkson-what-if-style`, terpasang sebagai skill `basic-jkson-what-if-style`). Nama lama tetap memicu skill ini.

Skill kedua di repo ini: animasi kartun stick-figure gaya channel "What If" yang meledak di YouTube Oktober 2026.
Satu baris topik ("What if you could rewind 10 seconds?") masuk, episode jadi 15-25 detik keluar: script di atas
formula tujuh beat What If, VO ElevenLabs milikmu (diupload, diselaraskan per kata dengan Whisper), storyboard yang dicek sendiri sebelum animasi, setiap frame digambar
sebagai SVG yang dirender Remotion, efek suara dan musik disintesis offline (tanpa API key), master ke -14 LUFS. Kirim VO + script-nya seperti gaya lain; kalau baru punya topik, Claude menuliskan script untuk kamu rekam di ElevenLabs.

- **Isi**: `styles/jkson-what-if-style/` — `SKILL.md` (alur kerja 8 langkah), `references/` (formula, look, kit, sound, traps), `scripts/` (voice, plan, stills, board, sfx, synth, mixcheck, motiongrid, master), `studio/` (proyek Remotion + episode contoh: `rewind`, `copy-paste`, dan demo `intro-demo` tanpa suara), `opencode/commands/what-if.md`
- **Rasio**: 16:9 (default) dan 9:16 — re-frame vertikal dari dunia animasi yang sama, per-shot reframe di `episode.json`; render `python scripts/master.py <slug> --aspect 9x16`
- **Pasang**:

```bash
git clone https://github.com/marcoavii/Animated-Video-Styles-Showcase-.git
cp -r Animated-Video-Styles-Showcase-/styles/jkson-what-if-style ~/.config/opencode/skills/basic-jkson-what-if-style   # OpenCode
cp -r Animated-Video-Styles-Showcase-/styles/jkson-what-if-style ~/.claude/skills/basic-jkson-what-if-style            # Claude Code
```

- **Pakai**: tulis "jkson what if style 16:9" (atau 9:16) lalu kirim VO + script-nya, atau "jkson what if style: what if ..." kalau baru punya topik
- **Kebutuhan**: dipasang oleh installer repo (Python + numpy, scipy, Pillow, faster-whisper; Node 18+; ffmpeg). Tidak perlu API key. Jalur lama lewat API ElevenLabs masih ada (`voice.py --tts`, `sfx.py --engine elevenlabs`) kalau memang mau, dan baru itu yang butuh `ELEVENLABS_API_KEY`
- Video MP4, file VO, dan audio SFX tidak disimpan di repo ini; `studio/library/sfx/` diisi otomatis oleh `sfx.py` (disintesis dari prompt dan di-cache).
