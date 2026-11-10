# Basic style 1

> Bagian dari skill `basic-style`. Di file ini, `SKILL` = folder `styles/basic-style-1` (folder tempat file ini berada), bukan root skill.

Mengubah VO + brief menjadi MP4 1080×1920 30fps. Semua digambar dengan kode Canvas lalu di-encode di browser, jadi tidak butuh generator gambar/video atau software editing. Sudah terbukti di 6 video (lihat `examples/`).

Sapa dan laporkan progres dalam bahasa Indonesia gaya Gen Z, sesuai permintaan user. Teks di dalam video mengikuti bahasa VO.

## Isi skill

| Lokasi | Isi | Kapan dibaca |
|---|---|---|
| `references/gaya.md` | Aturan visual, kamera, caption, audio | Sebelum menyusun storyboard |
| `references/katalog.md` | Semua prop, kostum, warna, data peta di engine | Saat menulis `story.js` |
| `references/produksi.md` | Masalah yang pernah kejadian dan solusinya | Kalau render/browser/QC bermasalah |
| `templates/story-template.js` | Kerangka `story.js` yang siap jalan | Disalin otomatis oleh `new-video.sh` |
| `examples/` | Bagian story dari 6 video lama | Saat butuh scene sejenis, baca satu file yang relevan saja |
| `engine/engine.js` | Engine; jangan diedit untuk satu video | Tidak perlu dibaca utuh (100 KB) |

## Alur kerja

### 1. Siapkan folder kerja
Pakai folder kerja di scratchpad sesi (atau folder lain kalau tidak ada). Jalankan lewat Bash, `SKILL` = folder skill ini:

```bash
sh "$SKILL/scripts/new-video.sh" "<folder-kerja>" "<vo.mp3>"
```

Kalau user tidak menyebut aspect ratio, pakai 9:16. Engine memang dibuat untuk 9:16.

### 2. Transkrip VO
```powershell
& "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" "<SKILL>\scripts\transcribe.py" "<folder-kerja>\vo.mp3" "<folder-kerja>\words.json"
```
Hasilnya durasi, segmen, timing per kata, dan daftar jeda. Kalau Python/faster-whisper tidak ada, pakai fallback browser (`tr.html`, lihat `references/produksi.md`).

Bandingkan transkrip dengan script di brief. Whisper sering salah di nama diri dan istilah (contoh nyata: "Jan Peterson Kuhn" untuk Jan Pieterszoon Coen, "zaman S" untuk zaman es). Pakai ejaan script brief kalau suaranya sama. Kalau suara VO benar-benar beda dari script, ikuti suara VO dan beri tahu user. Kalau tidak ada script, koreksi dari konteks dan sebutkan koreksinya ke user, terutama yang masih tebakan.

### 3. Petakan brief ke timing asli
Timing di brief biasanya perkiraan dan sering meleset dari durasi VO. Pertahankan urutan visual brief, tapi tempel setiap beat ke kata yang diucapkan di `words.json`. Visual kunci harus jatuh tepat di katanya. Kalau urutan brief tidak cocok dengan urutan ucapan VO, ikuti VO dan laporkan.

### 4. Tulis `story.js`
Edit `<folder-kerja>/story.js`: `DUR`, `PHRASES`, `CAM`, `mapState`, `mapScene`, scene plate, `SCENES`, `SHAKES`, `sfx`. Cek `references/katalog.md` dulu sebelum menggambar prop baru, karena kapal, benteng, peta, dll sudah ada. Prop dan kostum baru ditulis di `story.js`, dan namanya tidak boleh sama dengan yang ada di engine (SyntaxError).

Aturan yang gampang terlewat:
- Caption memakai kata persis seperti VO. Highlight maksimal 3 kata per kemunculan dan hanya kata yang memang diucapkan. Kalau daftar highlight brief menyimpang dari ucapan, sesuaikan dan laporkan.
- Waktu kunci dibaca dari caption dengan `capStart()`, bukan angka yang diketik manual, supaya tetap sinkron kalau caption digeser.
- Setiap scene peta baru diawali keyframe `'h'`. Kalau kamera melompat jauh di tengah, pisahkan jadi dua entri `SCENES` dengan transisi.

### 5. Jalankan server + preview
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<SKILL>\scripts\server.ps1" -Root "<folder-kerja>" -Port 8767
```
Jalankan di background, lalu buka `http://localhost:8767/render.html` di browser bawaan. Setelah `story.js` diedit: jalankan `build.sh <folder-kerja>`, lalu navigate ulang.

### 6. QC frame
```js
await window.ready; await sheet('q1.jpg',[0.9,2.3,5.3,9.8,12.6,16.6,18.8,21.5],4,360);
```
Baca `<folder-kerja>/frames/q1.jpg`. Kerjakan per 8 frame sampai seluruh durasi tercakup, dan sertakan frame sekitar transisi. Satu pemanggilan JS dibatasi 45 detik, jadi jangan render terlalu banyak sekaligus. Yang dicek: teks tumpang tindih, elemen terpotong tepi, subjek tertutup, label menimpa caption, warna negara konsisten, dan cocok dengan brief.

Perbaiki sampai beres sebelum render final, karena render penuh makan beberapa menit.

### 7. Render final
```js
await window.ready; window.encP = encode('Judul-Video.mp4').then(n => window.encDone = n).catch(e => window.encDone = 'ERR ' + e.message); await new Promise(r => setTimeout(r, 35000)); ({prog: window.prog, err: window.encErr, done: window.encDone, peak: window.mixPeak})
```
Lalu pantau tiap ±40 detik sampai `encDone` terisi. `mixPeak` idealnya di bawah 0,9. Di atas itu limiter mulai bekerja, jadi turunkan amplitudo SFX.

### 8. Cek file MP4 asli
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<SKILL>\scripts\check_video.ps1" -Video "<folder-kerja>\frames\Judul-Video.mp4"
```
Pastikan resolusi, durasi, dan stream audio benar, lalu baca `contact_sheet.jpg` yang dihasilkan.

### 9. Serahkan
Salin ke `Desktop\<Judul>\` beserta `source\` (`story.js`, `film.js`). Matikan server, kirim file ke user.

Tutup dengan laporan jujur:
- Yang sudah dicek dan yang belum. Claude tidak bisa mendengar audio, jadi mix dan sync suara harus dicek user.
- Teks di layar yang tidak ada di VO (angka, tahun, label), karena user bertanggung jawab atas akurasinya.
- Anakronisme atau perkiraan, misalnya bendera modern dan batas wilayah gambar tangan.
- Penyimpangan dari brief beserta alasannya.
- Bagian yang belum ada, misalnya logo channel kalau belum dikirim.

## Yang tidak bisa dilakukan
Tidak bisa membuat foto realistis atau musik sungguhan. Lapisan foto diganti ilustrasi, musiknya pad sintetis sederhana. Kalau user butuh aslinya, minta filenya dan tempel ke scene atau mix.
