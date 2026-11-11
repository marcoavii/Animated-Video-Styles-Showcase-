# Basic style 3

> Bagian dari skill `basic-style`. Di file ini, `SKILL` = folder `styles/basic-style-3` (folder tempat file ini berada), bukan root skill.

Mengubah VO, script, dan brief visual menjadi MP4 60 FPS dengan scene HTML/JS (three.js) dan audio sintesis. Terbukti di video "Penjaga Mercusuar" (`examples/penjaga-mercusuar/`).

Komunikasi dengan user dalam bahasa Indonesia. Teks di dalam video mengikuti bahasa VO.

## Perintah user

| User menulis | Rasio | Output |
|---|---|---|
| `Basic style 3 9:16` | 9:16 | 1080×1920, 60 FPS |
| `Basic style 3 16:9` | 16:9 | 1920×1080, 60 FPS |

Kalau rasio tidak disebut, tanya dulu. Kalau user minta keduanya, susun satu kali dengan framing untuk kedua rasio, lalu render dua kali.

## Yang dibawa user

1. **VO ElevenLabs** (MP3/WAV). User sudah menegaskan tidak mau memakai suara dari Claude, jadi jangan membuat voice over atau memakai TTS, termasuk sebagai suara sementara. Kalau VO belum ada, minta dulu dan berhenti.
2. **Script**, sumber ejaan dan tanda baca.
3. **Brief visual** scene per scene.

Kalau salah satu tidak ada, tanyakan. Sebelum menyusun audio, pastikan VO hanya berisi suara tanpa musik atau SFX.

User sudah menyukai visual dan seluruh gaya ini. Jaga tampilannya; variasi datang dari cerita, set, dan gag, bukan dari mengubah gaya.

## Isi skill

| Lokasi | Isi | Kapan dibaca |
|---|---|---|
| `references/gaya.md` | Tempo, transisi, struktur cerita, ending, tampilan, caption | Sebelum menyusun shot |
| `references/katalog.md` | Opsi shot, karakter, ekspresi, alat bangun set, ambience, musik, semua SFX | Saat menulis `story.js` dan set |
| `references/rasio.md` | Cara kerja 9:16 dan 16:9, framing per shot | Saat menulis `story.js` |
| `references/produksi.md` | Masalah yang pernah terjadi dan solusinya | Kalau ada yang tampak salah |
| `examples/penjaga-mercusuar/` | Film lengkap: story, cast, enam set | Baca bagian yang mirip dengan brief, jangan seluruhnya |
| `templates/` | Kerangka video kosong | Disalin otomatis |
| `kit/` | Engine dan tools; jangan diedit untuk satu video | Tidak perlu dibaca utuh |

## Alur kerja

`SKILL` = folder skill ini. Semua proyek ada di `D:\basic-style-3\<nama>`, di luar OneDrive (di PC tanpa drive D: otomatis `~/Videos/basic-style-3/<nama>`; bisa diganti lewat env `VIDEO_ROOT`). Pakai path yang dicetak `new-video.sh`. Jalankan dari folder proyek.

### 1. Buat proyek
```bash
sh "$SKILL/scripts/new-video.sh" <nama-video> <9:16|16:9> "<path-vo>"
```

Tambahkan `--example` untuk memuat film Penjaga Mercusuar lengkap sebagai bahan rujukan yang bisa langsung dijalankan.

### 2. Tulis `vo/script.json`
Dari script user, bagi per kalimat atau klausa. Teksnya persis seperti yang diucapkan, dengan tanda baca. Beri id berbabak supaya shot mudah dibaca (`A1`, `A2`, `B1`...).

### 3. Selaraskan VO
```bash
PYTHONIOENCODING=utf-8 python tools/align_vo.py vo/vo_source.mp3
```
Menghasilkan `vo/timing.json` dan `vo/words.md`. Ejaan selalu dari script, waktu dari ucapan. Baca kata yang ditandai. Kalau VO berbeda dari script, ikuti VO, perbaiki `script.json`, jalankan lagi, dan laporkan ke user.

### 4. Tulis shot list
Baca `references/gaya.md`. Dari `vo/words.md` dan brief, tentukan untuk tiap shot: mulai di kata apa, lokasi, siapa, aksi, transisi, dan bunyi. Waktu di brief biasanya perkiraan, jadi pertahankan urutan visualnya dan tempelkan ke kata yang diucapkan. Kalau urutan brief bertentangan dengan VO, ikuti VO dan laporkan.

### 5. Bangun set dan cast
Baca `references/katalog.md`. Di `scenes/js/`: `cast.js`, dan satu `set_*.js` per lokasi, dimulai dari `set_room.js` atau `set_outdoor.js`. Salin prop dari contoh kalau cocok. Elemen baru ditulis di proyek; `kit` hanya diubah untuk perbaikan yang berlaku bagi semua video.

### 6. Tulis `scenes/js/story.js`
Baca `references/rasio.md`. Setiap `do(t, u, l)` harus murni fungsi waktu dan memose semua yang dibutuhkan shot itu. Tulis `cue` di samping aksinya, supaya suara dan gambar tidak terpisah. Whoosh transisi muncul otomatis.

Tiga pola yang membuat gaya ini hidup: ganti ekspresi tepat pada kata pemicunya, satu `cue` untuk setiap kejadian di gambar, dan `drop_silence` + `sub_drop_big` tepat sebelum twist.

### 7. QC frame
```bash
node tools/stills.mjs out/qc/all.png --ratio 9:16
node tools/stills.mjs out/qc/x.png --ratio 9:16 --t 3.2,5.1 --w 540 --cols 4
node tools/strip.mjs out/qc/whip.png 12.3 12 3
```
Lihat hasilnya dengan Read. Periksa tiap shot: subjek di dalam frame, wajah terbaca, kamera tidak di dalam benda, caption tidak menimpa wajah atau teks, cahaya tidak menyilaukan, dan ekspresi sesuai kata. Ulangi sampai bersih; biasanya butuh beberapa putaran. Jangan lanjut render dengan frame yang belum diperiksa, karena render penuh makan puluhan menit.

### 8. Render dan mix
Minta keep-awake lalu jalankan di background:
```bash
node tools/build.mjs --ratio 9:16 --name Judul_Video
```
Satu perintah ini mengekspor cue, membuat mix, merender (sekitar 30 menit untuk 74 detik, mengulang sendiri kalau browser crash), menyambung, mengecek, lalu menyalin ke Desktop hanya kalau jumlah frame cocok. Segmen lama dihapus otomatis kalau kode scene berubah. Untuk revisi kecil, hapus hanya `out/seg_*/seg_NNNNN.mkv` yang terdampak (480 frame = 8 detik) dan tambahkan `--keep`.

### 9. Verifikasi dan serahkan
Baca output build dan `out/qc/final_*.png`. Ambil juga beberapa frame langsung dari MP4 pada resolusi penuh. Target: frame lengkap, −14 LUFS, true peak di bawah −1 dB, dan untuk loop selisih frame awal-akhir di bawah sekitar 5.

Sampaikan ke user: lokasi file, spesifikasi, hasil ukur mix, kata yang perlu dicek, jenis ending, dan fakta yang belum diverifikasi ke sumber. Claude tidak bisa mendengar audio, jadi laporkan mix sebagai hasil ukur dan sebutkan bagian yang paling perlu didengar user.

## Prinsip

- **Tiru gaya, bukan isi.** Setiap video punya gag dan komposisi sendiri mengikuti brief. Jangan memakai ulang lelucon mercusuar kecuali diminta.
- **Gaya ini terpisah.** Jangan mencampur kode dengan `basic-style-1`, `basic-style-2`, atau `cartoon-3d-short`.
