# Gaya Basic style 1

Formulanya: karakter 2D chibi berdiri di atas peta kertas tua seperti bidak board game, kamera terus bergerak, dan setiap ±1 detik ada hal baru di layar. Humornya deadpan: topik serius disampaikan lugas lalu diselingi gag visual kecil.

Style bible lengkap: https://claude.ai/artifact/F5SViWNU5b4LcjDnzwaFDz

## Tiga dunia background
| Dunia | Dipakai untuk | Cara di engine |
|---|---|---|
| Peta parchment | Default: lokasi, perjalanan, wilayah, jalur dagang | `drawMap` lewat `mapScene` |
| Plate ilustrasi | Momen manusia, emosi, proses, benda | `plateSky`, `plateSea`, `hills`, `woodFloor` + prop |
| Close-up | Beat emosi atau punchline | Karakter besar naik dari bawah frame |

Gunakan peta saat menjelaskan lokasi dan jalur, karakter saat menjelaskan kondisi manusia, dan animasi untuk menjelaskan proses. Ganti dunia setiap ±10–15 detik.

## Karakter
- Satu template peg-doll tanpa kaki: kepala ±50%, mata titik, outline hitam tebal. Tokoh dibedakan lewat kostum, rambut, topi, warna kulit.
- Tangan hanya sarung tangan putih melayang (`drawGlove`).
- Ekspresi: `neutral`, `smug`, `happy`, `worried`, `shock` (mulut menganga panjang, gag utama), `angry`.
- Di peta: token kecil h≈150–300. Dialog: h≈400–600. Close-up: h≈800–1100 dengan anchor y≈1960.
- Narator seri adalah `PROT` berbaju batik cokelat. Muncul di hook/ending, jangan diganti tampilannya.
- Topik sensitif (perbudakan, perang, wabah): tanpa kekerasan grafis, ekspresi kalem, bermartabat.

## Warna
- Satu pihak = satu warna sepanjang video. Yang baru menang/merdeka dapat warna baru.
- Prancis/pihak utama biru `#244ca0`, Inggris merah `#be3c30`, USA teal `#3f959d`, Spanyol oranye `#c57322`, Indonesia merah, Belanda/VOC oranye `#e07a1f`, wilayah hijau baru `#35791c`, highlight periwinkle `#798eb9`.
- Kuning `#f5e50a` hanya untuk penekanan: caption highlight, lingkaran, angka kunci. Jangan dipakai sebagai warna negara, kecuali highlight sesaat.

## Kamera dan transisi
- Kamera tidak pernah diam: keyframe `'l'` memberi drift pelan. Fly antar lokasi 0,3–1 detik pakai `'io'`.
- Transisi: `whip` geser cepat (ganti topik), `zoom` fast zoom (masuk/keluar lokasi), `cut` potong langsung (quick cut dramatis atau latar yang sama).
- Rewind: `chevrons(c,-1,a,t)` + sepia/blur untuk mundur waktu, lihat `examples/1-ribuan-pulau.js`.
- Camera shake lewat `SHAKES`, hanya untuk momen impact.

## Komposisi 9:16
- y 0–20%: konteks, judul. y 20–65%: subjek utama. y≈1385: caption. y>76%: ruang bernapas, aman dari UI platform.
- Angka/tahun besar di y≈300–520.
- Satu hal baru per beat. Pihak berlawanan ditaruh kiri vs kanan.

## Teks
- Caption: Roboto tebal, putih + outline hitam, di y=1385, potong per 1–4 kata mengikuti frasa VO. Highlight kuning dengan efek pop.
- Dunia peta: EB Garamond serif untuk label negara dan tahun besar.
- Angka punchline: sans tebal kuning + outline.
- Boleh ada angka besar yang sama dengan caption saat itu, ini memang bagian dari gaya.

## Struktur cerita yang umum
Hook paradoks ±10 detik → rewind/"jadi gini" → setup bertanggal → faktor tersembunyi → konflik → twist → payoff dengan satu angka gampang diingat → CTA Follow.

## Audio
- Narasi tetap jadi yang utama: musik `gain≈.045` dengan ducking, SFX amplitudo .05–.3.
- Impact hanya di 1–4 momen besar. Whoosh otomatis di transisi.
- Jangan tambah musik kalau brief menolaknya (`MUSIC=false`).

## Hindari
Anime, 3D realistis, flat vector korporat, outline tipis, karakter berkaki panjang, gambar statis lebih dari 2 detik, efek dekorasi yang tidak menjelaskan apa-apa.
