# Basic style 2

> Bagian dari skill `basic-style`. Di file ini, `SKILL` = folder `styles/basic-style-2` (folder tempat file ini berada), bukan root skill.

Mengubah VO, script, dan brief visual menjadi MP4 60 FPS dengan pipeline HTML/JS Canvas + audio sintesis. Terbukti di video "Taman Iblis" (`examples/taman-iblis/`), dalam 16:9 dan 9:16.

Komunikasi dengan user dalam bahasa Indonesia. Teks di dalam video mengikuti bahasa VO.

## Perintah user

| User menulis | Rasio | Output |
|---|---|---|
| `Basic style 2 9:16` | 9:16 | 1080×1920, 60 FPS |
| `Basic style 2 16:9` | 16:9 | 1920×1080, 60 FPS |

Kalau rasio tidak disebut, tanya dulu. Kalau user minta keduanya, susun satu kali lalu tambahkan framing untuk tiap rasio dan render dua kali.

## Yang dibawa user

1. **VO ElevenLabs** (MP3/WAV). Jangan pernah membuat voice over sendiri atau memakai TTS. Kalau VO belum ada, minta dulu dan berhenti.
2. **Script**, sebagai sumber ejaan nama dan istilah.
3. **Brief visual** scene per scene.

Kalau salah satu tidak ada, tanyakan. Sebelum menyusun audio, pastikan VO hanya berisi suara tanpa musik atau SFX.

## Isi skill

| Lokasi | Isi | Kapan dibaca |
|---|---|---|
| `references/gaya.md` | Aturan gaya: visual, tempo, caption, transisi, gag | Sebelum menyusun storyboard |
| `references/katalog.md` | Semua karakter, prop, efek, HUD, dan synth yang sudah ada | Saat menulis `scenes.js` dan `sound.py` |
| `references/rasio.md` | Cara kerja stage, framing, dan komposisi 9:16 vs 16:9 | Saat menulis `scenes.js` |
| `references/produksi.md` | Masalah yang pernah terjadi dan solusinya | Kalau render, alignment, atau mix bermasalah |
| `examples/taman-iblis/` | Video lengkap sebagai contoh | Baca bagian yang mirip dengan brief, jangan seluruhnya |
| `templates/` | Kerangka video kosong | Disalin otomatis oleh `new-video.sh` |
| `kit/` | Engine dan tools; jangan diedit untuk satu video | Tidak perlu dibaca utuh |

## Alur kerja

Jalankan perintah lewat Bash. `SKILL` = folder skill ini. Semua proyek ada di `D:\basic-style-2\<nama>`, di luar OneDrive (di PC tanpa drive D: otomatis `~/Videos/basic-style-2/<nama>`; bisa diganti lewat env `VIDEO_ROOT`). Pakai path yang dicetak `new-video.sh`.

### 1. Buat proyek
```bash
sh "$SKILL/scripts/new-video.sh" <nama-video> <9:16|16:9> "<path-vo>"
```

### 2. Tulis `script.json`
Satu entri `phrases` = satu kemunculan caption, biasanya satu klausa pendek.

- `say`: kata persis seperti yang diucapkan VO.
- `show`: opsional, kalau caption beda dari ucapan (`"say":"Tahun sembilan belas empat puluh dua,"`, `"show":"TAHUN 1942,"`).
- `*kata*`: kata merah, hanya untuk tekanan besar.
- `hold`: opsional, detik hening yang disisipkan setelah frasa. Pakai saat ledakan besar butuh ruang sebelum kalimat berikutnya.

### 3. Selaraskan VO
```bash
cd <folder-proyek> && PYTHONIOENCODING=utf-8 python tools/align_vo.py audio/vo_source.mp3
```
Tool ini menempelkan waktu Whisper ke kata-kata di `script.json`, jadi ejaan selalu dari script. Baca daftar kata yang ditandai, terutama nama diri dan angka. Kalau muncul peringatan VO berbeda dari script, ikuti ucapan VO, perbaiki `script.json`, jalankan lagi, dan laporkan ke user.

### 4. Petakan brief ke kata
Tulis `cues.json`, yang dipakai bersama oleh visual dan suara sehingga keduanya selalu sinkron:
- `cuts`: urutan shot dan transisinya (`open`, `cut`, `whip` + `dir`, `flash`, `punch`, `whiteline`). Waktunya menempel ke kata: `["b1",0,-0.1]` = 0,1 detik sebelum kata pertama frasa `b1`.
- `cues`: waktu bernama untuk setiap kejadian. `bigBoom`, `pill`, dan `end` menjalankan end card.

Waktu di brief biasanya perkiraan, jadi pertahankan urutan visualnya dan tempelkan ke kata yang diucapkan. Kalau urutan brief bertentangan dengan VO, ikuti VO dan laporkan.

```bash
python tools/build_timeline.py
```
Perintah ini mencetak panjang tiap shot. Shot di atas sekitar 6 detik biasanya butuh kejadian tambahan atau dipecah.

### 5. Tulis `src/scenes.js`
Baca `references/gaya.md`, `references/rasio.md`, dan `references/katalog.md`. Pakai kit sebelum menggambar sesuatu yang baru. Elemen baru ditulis di `scenes.js`; `kit/` hanya diubah untuk perbaikan yang berlaku bagi semua video.

Setiap shot adalah fungsi murni dari waktu: `SC.nama = (c, t, lt, d) => {...}`. Jangan menyimpan state antar frame, karena render dibagi ke beberapa worker yang melompat ke waktu mana pun.

### 6. QC frame
```bash
node tools/render.js --stills 2,5.5,9 --out build/s1 && python tools/montage.py build/s1 build/m1.jpg 6 320
```
Lihat contact sheet dengan Read. Cek minimal satu frame per shot, plus frame tepat setelah setiap kejadian penting. Periksa: subjek di dalam frame, caption tidak menimpa hal penting, label tidak terpotong, dan bug warna. Ulangi sampai bersih. Render uji transisi dengan `--video --from A --to B`.

### 7. Tulis `sound.py`, lalu mix
Tempatkan suara di setiap cue, plus lapisan ambience dan musik. Lihat bagian suara di `references/katalog.md`.
```bash
python tools/mix.py && python tools/check_mix.py && python tools/check_cues.py
```
Target hasil ukur: −13 LUFS, true peak di bawah −1 dBFS, suara saat narasi sekitar −14,7 dB, bed di sela kalimat sekitar −21 dB. `check_cues` bisa keliru menandai `weak` kalau ada ekor efek sebelumnya, jadi pahami sebabnya sebelum mengubah level.

Claude tidak bisa mendengar audio. Laporkan mix sebagai hasil ukur, bukan sebagai sudah didengar.

### 8. Render final
```bash
node tools/render.js --video --workers 5
```
Jalankan di background. Sekitar 5–10 menit, hasil ada di `out/<nama>-<rasio>.mp4`.

### 9. Verifikasi dan serahkan
Cek dengan ffprobe (resolusi, 60 FPS, ada audio), decode seluruh file dengan `ffmpeg -v error -f null`, dan lihat contact sheet dari file final. Salin hasilnya ke Desktop, kirim dengan `SendUserFile`, dan sampaikan: spesifikasi, hasil ukur mix, kata yang perlu dicek, dan fakta sejarah yang belum diverifikasi ke sumber.

## Prinsip

- **Tiru gaya, bukan isi.** Setiap video punya gag dan komposisi sendiri mengikuti brief. Jangan memakai ulang lelucon Taman Iblis kecuali diminta.
- **Gaya ini terpisah.** Jangan mencampur kode dengan `basic-style-1` atau `basic-style-3`.
