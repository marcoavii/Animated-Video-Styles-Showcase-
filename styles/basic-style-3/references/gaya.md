# Aturan gaya

Diukur dari video referensi ("He Begged to Stay in Prison for 5 More Years!", 1080×1920, 70 detik, 218 kata), lalu dibuktikan di "Penjaga Mercusuar".

## Tempo

| Ukuran | Referensi | Penjaga Mercusuar | Pegangan |
|---|---|---|---|
| Panjang shot | median 0,9 detik | median 1,25 detik | 0,9–1,5 detik. Di atas 3 detik butuh alasan |
| Kecepatan narasi | 3,1 kata/detik | 2,9 kata/detik | mengikuti VO |
| Durasi | 70 detik | 73,6 detik | mengikuti VO |

Kamera tidak pernah diam. Setiap shot punya gerak pelan (dorong, geser, atau naik), ditambah goyangan operator otomatis. Beat komedi dan reveal boleh lebih lama dari ritme lain.

## Transisi: tidak ada hard cut

| Jenis | Kode | Dipakai untuk |
|---|---|---|
| Whip | `whip(dir, 0.28)` | pindah subjek atau ganti tempat dengan energi. Paling sering |
| Dissolve pendek | `diss(0.12)` | sambungan kalimat, detail ke detail |
| Dissolve panjang | `diss(0.3)` | lompatan waktu: siang ke malam, malam ke fajar |
| Push | `push(8, 0.3)` | "menembus" masuk ke lokasi baru atau beat besar |
| Gerak menerus | satu shot, banyak keyframe | menyusuri papan, naik menara |

Motion blur berasal dari sub-frame sungguhan, jadi whip tidak perlu blur buatan.

## Struktur cerita

Paling kuat kalau script punya pola ini, tetapi script user selalu menang:

1. **Paradoks pembuka**: sesuatu yang terdengar salah dalam satu kalimat.
2. **Reaksi dunia**: orang-orang tertawa atau bingung, tokoh malah senang.
3. **Rutinitas ganjil**: tokoh bahagia, ada satu detail yang mengganjal.
4. **Misteri**: gejala aneh, diselidiki, hasilnya nihil.
5. **Benang samping**: "sementara itu", masalah lain di tempat lain, orang salah disalahkan.
6. **Twist**: audio turun hampir hening, lalu kebenaran dijelaskan secara visual.
7. **Punchline**: satu kalimat yang mengikat semuanya.
8. **Ending**: lihat di bawah.

## Ending

Ikuti akhir script:
- **Kalimat menggantung** (seperti "Itulah sebabnya,") → `ending: "loop"`. Shot terakhir mendarat tepat di frame pembuka. Di 9:16 ini cocok untuk Shorts. Sampaikan ke user bahwa berhenti mendadak itu disengaja, karena user pernah membacanya sebagai video yang belum selesai.
- **Kalimat tuntas** → `ending: "fade"`. Beat penutup, lalu fade ke hitam, dan pakai babak musik `resolve`.

## Tampilan

- **Dunia 3D dengan garis tinta tipis**: material Standard biasa, tekstur lukis prosedural, AO, tepi tinta dari kedalaman. Warna kalem, bukan neon.
- **Karakter**: kepala bulat besar, mata cincin yang bisa melirik dan kelopak yang turun, badan bean, tangan dan kaki tongkat dengan bola di ujung, outline tinta tebal.
- **Cahaya sinematik**: selalu ada sumber yang terlihat (lampu, jendela, bulan), halo lembut, god ray, debu melayang, depth of field tipis pada close-up.
- **Grade per lokasi**: tiap set punya warna sendiri supaya penonton tahu pindah tempat. Contoh: amber kantor, biru laut malam, hijau kantor neon, emas senja.
- **Teks di dalam dunia** mengikuti bahasa VO, ditaruh di papan, poster, surat. Lelucon kecil di poster sangat disarankan.
- **Teks 3D ekstrusi** untuk beat besar, muncul memantul dengan `popIn`. Maksimal 2–3 kali per video.
- **Gag visual kecil**: kilau, garis gelombang suara, Z saat tidur, keringat, lingkaran alarm. Satu gag untuk satu kata.

Akting ada di wajah dan badan. Ganti ekspresi tepat pada kata yang memicunya, dan beri overshoot (`popIn`, `squash`, `hop`) pada momen kaget atau senang. Ekspresi yang tidak berubah sepanjang shot lebih dari 2 detik terasa mati.

## Caption

1–2 kata, putih tebal Plus Jakarta Sans 800, outline gelap, tengah. Tanpa animasi masuk. Tanda baca ikut tampil dan memutus potongan. Posisi diatur `index.html` per rasio, jadi jangan menaruh wajah atau teks penting persis di bandnya.

## Suara

Lihat `katalog.md`. Prinsipnya: setiap kejadian di gambar punya bunyi, setiap transisi punya whoosh, setiap lokasi punya ambience sendiri, musik sangat tipis di bawah VO, dan satu momen hening menjelang twist.
