# Masalah yang pernah terjadi

Semuanya terjadi sungguhan saat membuat "Penjaga Mercusuar".

## Tools di PC ini

Dicek 2026-11-10: Node.js 24.18.0, npm 11.16, git 2.55, ffmpeg/ffprobe 9.0.2 (build gyan, di PATH), Chrome/Edge sebagai browser render, GTX 1650 GPU. Python 3.12.10 (`%LOCALAPPDATA%\Programs\Python\Python312`): numpy 2.5.4, scipy 1.18.1, Pillow 13.0.0, faster-whisper 1.2.1 dengan `av` 14.2.0 (av 19 merusak faster-whisper). `three@0.170.0` dan `puppeteer-core` di `D:\basic-style-3\node_modules`, dipakai bersama semua proyek.

## Gambar

| Gejala | Sebab | Solusi |
|---|---|---|
| Render lambat, GPU Intel | Chrome memilih GPU terintegrasi | `--force_high_performance_gpu`, sudah ada di `serve.mjs` |
| Contact sheet terlihat bergaris warna | hanya tampilan sheet | baca PNG mentah di folder `_f` sebelum mengubah warna |
| Wajah hitam legam, sisi lain terang | wajah membelakangi lampu, ACES menekan gelap | `camFill` di set, atau `fill` per shot |
| Kepala atau layar putih menyilaukan saat kamera dekat lampu | `halo` dan `lampLight` dekat kamera | sembunyikan halo di shot itu, turunkan intensitas lampu |
| Kapal atau tokoh jadi siluet malam | bulan ada di belakang subjek | lampu arah pengisi dari sisi kamera, naikkan `exposure` shot |
| Sinar lampu seperti garis tipis | kerucut terbalik | `shaft` berputar `rotation.x = -PI/2`, ujung sempit di sumber |
| Garis putih di cakrawala laut | pantulan sinar di air pada sudut landai | turunkan kekuatan `beam` di air |
| Laut berpola kotak-kotak | gelombang sinus saling tegak lurus | shader sudah memakai domain warp |
| Titik putih menempel di laut dari atas | debu melayang di shot udara | `noMotes` di shot tampilan atas |
| Pantulan bulan besar di shot udara | glint laut | `sea.u.glint.value = 0.2` di shot itu, kembalikan di `reset` |
| Benda menembus tangga atau tembok | posisi hanya dicek di satu shot | hitung radius dan tinggi tiap benda terhadap jalur tangga |
| Pintu tertutup tangga | sudut pintu sama dengan anak tangga rendah | pilih sudut yang anak tangganya tinggi |
| Tokoh menghadap membelakangi kamera | `ry` salah | depan = +z saat `ry: 0` |
| Kamera di dalam benda, layar gelap atau polos | kamera melewati geometri | cek radius ruang dan bentuk bangunan sebelum menulis keyframe |
| Dua tangan rendah terlihat mengganggu | tangan berdempet setinggi perut | `ARM.clasp` di depan dada |
| Ekspresi tidak berubah walau `expr` diganti | fitur wajah tertutup | jaga janggut atau kumis di bawah garis mulut |
| Pose bocor antar shot | set dipakai bersama | kembalikan semua di `set.reset()`; shot dievaluasi berurutan untuk motion blur dan dissolve |
| Dissolve menunjukkan pose aneh | `do` menyimpan state | `do` harus murni fungsi waktu |

## Caption

- Kalimat tersambung ke kalimat berikutnya (`utara Dua`) terjadi kalau token tanpa tanda baca. `align_vo.py` memakai token script, jadi jaga tanda baca di `script.json`.
- Jumlah kata per baris di `timing.json` harus sama dengan token script. Tool ini menjamin itu.

## Audio

- Claude tidak bisa mendengar. Periksa dengan `audio_qa.py`, spektrogram, dan ebur128, lalu laporkan sebagai hasil ukur.
- K-weighting harus memakai koefisien BS.1770 yang resmi; pendekatan kasar pernah salah 3,3 LU.
- True peak bisa jauh di atas sample peak pada suara saw dan klik, sehingga limiter memakai detektor 4× oversample.
- Target yang terbukti: −14 LUFS, true peak di bawah −1 dB, VO sekitar −18 sampai −20 LUFS, SFX −21 sampai −25, ambience −32 sampai −40, musik −33 setelah merunduk.
- Sebelum menyusun audio, pastikan VO hanya berisi suara. Musik atau SFX di VO akan bertumpuk dengan mix ini.

## Render

- Browser bisa crash di tengah. `build.mjs` mengulang otomatis dan melanjutkan dari segmen terakhir.
- Concat demuxer ffmpeg menjatuhkan frame di sambungan segmen kalau durasinya tidak ditulis, jadi `build.mjs` menulis durasi tiap segmen.
- Jangan menyambung lewat file `.h264` mentah. Timestamp tampilan B-frame hilang, dua frame pertama tersembunyi, dan urutan timestamp kacau, tapi jumlah paket tetap terlihat benar.
- `build.mjs` menghitung frame hasil decode dan memeriksa tiap langkah timestamp tepat satu frame.
- AAC menaikkan true peak sekitar 0,5 dB, jadi ceiling limiter di `design.py` sengaja diberi ruang. Ukur peak dari MP4, bukan dari `mix.wav`.
- Salinan ke Desktop baru dibuat setelah pengecekan frame lolos. Satu kali salinan rusak 39 detik sempat lolos sebelum pengecekan ini ada.
- Render 1080p60 sekitar 0,35 detik per frame di GTX 1650, sekitar 30 menit untuk film 74 detik.
- Laptop tidak boleh tidur selama render. Minta keep-awake dan ingatkan user jangan menutup layar.

## Menyunting kode

Saat menulis patch, jangan pakai penggantian teks PowerShell tanpa pengecekan: satu perbaikan janggut pernah gagal diam-diam karena beda CRLF dan baru ketahuan jauh kemudian. Pakai alat Edit, atau skrip yang berhenti kalau teks lama tidak ditemukan.
