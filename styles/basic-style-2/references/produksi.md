# Catatan produksi

Masalah yang benar-benar terjadi saat membangun skill ini.

## Lingkungan

Dicek 2026-11-10: Node.js 24.18.0, npm 11.16, git 2.55. Python 3.12.10: numpy 2.5.4, scipy 1.18.1, Pillow 13.0.0, faster-whisper 1.2.1. `av` harus 14.2.0 (`--only-binary=:all:`), karena av 19 merusak faster-whisper.
- ffmpeg/ffprobe 9.0.2 ada di PATH. Kalau tidak terbaca, segarkan PATH dari registry atau mulai shell baru.
- Chrome atau Edge dipakai `puppeteer-core`. Driver dipasang sekali di `D:\basic-style-2\node_modules` dan dipakai semua proyek.
- Whisper model `small` terunduh saat pertama dipakai. Koneksi lambat, jadi siapkan waktu.

## Visual
| Gejala | Penyebab | Solusi |
|---|---|---|
| Langit jadi lavender datar di layer foreground | `multiply` mengisi area transparan | Beri nama kunci berakhiran `Fg`, grade jadi `source-atop` |
| Lengan atau tangan di posisi aneh | Elemen ketiga array dianggap panjang lengan | Sudah ditangani di `soldier`; ingat formatnya `[sudut, sudut, tangan]` |
| Blur whip berpola sisir | Sampel terlalu sedikit | Sudah dua tahap; jangan diturunkan |
| Bulan kusam | Grade multiply menimpa bulan | Grade lewat `BG_GRADE`, bukan `VIDEO.grade` yang pekat |
| Frame blur saat QC | Tertangkap saat whip pan | Cek `cuts` dulu sebelum menganggapnya bug |
| Hasil beda antar worker | Memakai state atau `Math.random` | Semua harus murni dari `t`; pakai `hash` atau `RNG(seed)` |
| Label terpotong di 9:16 | Digambar di koordinat stage | Pakai `hud` atau `hudStrip` |
| File terlalu besar | Grain tebal dan CRF kecil | Grain alfa 6 dan CRF 17 menghasilkan sekitar 200 MB per 95 detik |

Pemanggilan `--stills` berulang relatif cepat, tapi `ready()` melukis semua latar di awal. Di 9:16 latar lebih besar, jadi kurangi `--workers` kalau memori sempit.

## Alignment VO
- Whisper sering salah mendengar nama diri dan angka ("1942" untuk "sembilan belas empat puluh dua"). Waktunya tetap dipakai, dan kata-katanya didaftar untuk dicek.
- Awal kalimat dari Whisper bisa melenceng sampai 0,6 detik. `align_vo.py` menempelkannya ke onset suara sebenarnya, tetapi hanya untuk kata pertama frasa; kalau diterapkan ke semua kata, kata terakhir kalimat bisa terseret ke kalimat berikutnya.
- Hasil uji terhadap waktu kata sebenarnya: median selisih per kata 0,04 detik, 5 dari 210 kata meleset di atas 0,25 detik, dan awal kalimat stabil.
- Kalau satu cue penting terasa meleset, geser offset di `cues.json` atau perbaiki waktu di `build/words.json`, lalu jalankan `build_timeline.py` lagi. `align_vo.py` akan menimpa `words.json`.

## Mix
- Ledakan tepat sebelum kalimat menutupi narasi. Beri `hold` pada frasa sebelumnya, minimal sekitar 1,5 detik untuk rantai ledakan besar.
- Ekor reverb adalah sumber utama kekeruhan, sehingga wet di-duck −12 dB saat narasi, jauh lebih dalam dari efek langsung.
- Limiter memakai deteksi 4× oversampling. Detektor biasa sempat menghasilkan true peak +0,3 dBFS.
- `process_vo` menyetel level suara berdasarkan RMS, sehingga ekspor ElevenLabs apa pun masuk di balance yang sudah teruji.
