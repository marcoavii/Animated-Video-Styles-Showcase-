# Catatan produksi Basic style 5

- Lembar kontak yang dipadatkan bisa tampak belang warnanya; untuk warna, baca frame mentah di `out/qc/all_f/`.
- Ganti kode di skill, bukan di proyek, kalau masalahnya berlaku untuk semua video.
- Garis tepi karakter memakai `outline()` di `people.js` (lebar tetap di layar), bukan `ink()` dari kit: `ink()` menipis di close-up.
- Kepala diberi emissive supaya tetap krem rata seperti referensi; tanpa itu pantulan hijau rumput membuatnya abu-abu.
- Jangan pasang DOF di set desa; referensi tajam. Hanya close-up yang diberi DOF tipis per shot.
- Mixer suara butuh VO berisi suara; VO hening total membuat mix gagal (percentile dari array kosong).
- `compare.py` membaca caption dari piksel terang bertepi gelap; padi emas dan bibir sawah hijau limau ikut terbaca sebagai caption, jadi angka caption di video sawah tidak bisa dipercaya. Cek ukuran caption dengan crop (`fonts.py size`).
- "Cut dengan bunyi" di metrics ikut menghitung awal kata VO; itu bukan SFX.
- Tag ElevenLabs seperti `[chuckles]` menghasilkan tawa yang tidak ada di script; align_vo akan melaporkan kata asing ("Haha"). Cari waktunya dari energi VO di jeda antar kalimat.
