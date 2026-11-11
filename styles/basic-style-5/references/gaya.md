# Aturan gaya Basic style 5

Diukur dari video referensi petani dan kolam (63 detik, 720×1280, 30 FPS) dengan `scripts/analyze_ref.py` (laporan lengkap: `<VIDEO_ROOT>/basic-style-5/_reference/report.md`, tidak ikut di repo). Isi cerita, script, dan VO referensi diabaikan; kata-kata hanya dipakai untuk waktu.

Angka dari script, lalu dikoreksi dengan mata dari lembar frame (`sheets/`).

## Format

| | Referensi | Pegangan |
|---|---|---|
| Ukuran | 720×1280 (9:16) | 9:16 → 1080×1920, 16:9 → 1920×1080 |
| FPS | 30.0 | 30 |
| Durasi | 63.0 s | ikut VO |
| Petunjuk alat (metadata) | Google/YouTube pipeline, ffmpeg/libavformat (re-encoded or rendered by code, e.g. Remotion, ffmpeg pipeline, a downloader), generic MP4 brand (no app named) | |

## Tempo dan potongan

| Ukuran | Referensi |
|---|---|
| Shot | 15 shot, 14.3 per menit |
| Panjang shot | rata-rata 4.2 s, median 2.83 s, p10-p90 [1.85, 7.91] s, min-max [1.23, 9.63] s |
| Jenis sambungan | hard 6, morph/slide/other 2, whip/fly-through 6 |
| Cut tepat di awal kata | 0.43 dari cut berada ≤120 ms dari awal kata (median selisih -0.06 s) |
| Shot per 10 detik | [4, 3, 2, 3, 2, 1, 0] |

**Koreksi mata atas angka script:** lembar timeline menunjukkan sekitar 20 shot (script hanya menangkap 15 karena kamera selalu bergerak). Pegangan: **shot 2-5 detik, median ±3 detik**, jauh lebih santai dari Basic style 4. Shot terpanjang 6-9 detik saat kamera terbang pelan melintasi kolam.

- **Hard cut** tepat di kata pertama klausa baru, tanpa flash, tanpa bunyi.
- **Dissolve cepat 0,2-0,3 detik** (`diss(0.28)`) saat pindah tempat atau pindah adegan: dua gambar bertumpuk transparan beberapa frame.
- **Terbang masuk**: kamera maju menembus permukaan kolam lalu dissolve ke adegan bawah air (dan sebaliknya keluar lewat bidang hijau rata).
- Tidak ada whip, zoom punch, atau shake.
- Ending: shot lebar yang naik pelan (crane) di atas set terakhir; tidak ada kartu penutup.

## Kamera

| Ukuran | Referensi |
|---|---|
| Gerak per shot | push-in pan 4, push-in 5, pull-out 2, pull-out pan 3, pan 1 |
| Goyang (jitter median) | 0.132 |

- **Setiap shot bergerak**: dorong masuk atau tarik keluar 10-15% sepanjang shot (sekitar 4-5% per detik), sering sambil berputar sedikit mengitari tokoh. Tidak pernah diam.
- Kamera **sedikit di atas dan menunduk**: horison tinggi, langit paling banyak sepertiga atas layar (kecuali medium sudut rendah), rumput depan memenuhi bagian bawah. Lensa agak lebar (FOV 40-46 untuk 9:16 di `cam`). Video pertama memakai kamera setinggi 1,7-1,9 m yang melihat ke titik 0,5-0,9 m.
- Shot yang berulang: medium samping tokoh di tepi kolam; wide tinggi melihat dua kolam dipisah jalan tanah; close-up frontal setinggi wajah dengan langit dan pohon kelapa di belakang; extreme close-up kepala tiga perempat; medium sudut rendah tokoh merentangkan tangan; set infografis (karung, papan angka, timbangan gantung) dengan dua tokoh di kiri dan kanan; adegan bawah air.
- Depth of field tipis hanya di close-up (`dof: { ap: 0.004, max: 0.004 }` di shot); wide tetap tajam.

## Karakter

Karakter 3D seperti mainan (`Villager` di `people.js`):
- **Kepala bola besar krem** (#f9e7c2) yang hampir rata warnanya, garis tepi hitam tebal **dengan lebar layar tetap** (garis sama tebal dari wide sampai extreme close-up).
- Wajah digambar di kepala: mata titik hitam lonjong berkilau, atau mata cincin besar (kaget), atau lengkung ∩ (senang); alis cokelat tua tebal; pipi merah muda transparan; mulut bibir merah tebal (bicara/tersenyum) atau garis; kumis hitam tebal melengkung untuk tokoh tua.
- **Peci hitam** mengilap yang duduk rendah di kepala (bagian atasnya terlihat saat kamera di atas), atau **rambut mangkuk** cokelat tua.
- **Badan bean** sedikit lebih sempit dari kepala: batik cokelat tua dengan bunga emas empat kelopak dan kancing emas, atau baju polos (teal #0d9a86) dengan deret kancing putih.
- Tangan dan kaki **lidi hitam** dengan ujung bulat, kaki panjang dan kaki kecil gelap.
- Emote: tetes keringat biru, garis bau kuning transparan. Akting sederhana: ganti ekspresi tepat di kata, tangan menunjuk/merentang, jalan dengan ayunan kaki.

## Dunia, warna, cahaya, tekstur

| Ukuran (tanpa pita caption) | median | p10 | p90 |
|---|---|---|---|
| luma | 137.58 | 72.75 | 152.94 |
| contrast | 49.49 | 30.46 | 67.03 |
| sat | 0.6296 | 0.481 | 0.7132 |
| warm | 33.83 | 10.85 | 59.69 |
| black | 25.69 | 2.13 | 48.49 |
| white | 237.55 | 160.41 | 250.47 |
| grain | 1.26 | 0.44 | 1.72 |
| sharp | 540.5 | 23.64 | 993.15 |
| vignette | 0.68 | 0.45 | 0.84 |
| ink | 0.008 | 0.002 | 0.0266 |

Palet: #69a82a 17%, #92d133 14%, #7b5529 13%, #437029 12%, #351f0b 9%, #1a4218 8%, #eeecd5 7%, #6eabd1 7%, #a8c290 7%, #578480 6%

- Desa low-poly yang sangat jenuh: rumput limau dengan guratan bilah, pohon bulat bersegi, pohon kelapa berdaun gerigi, semak, pagar bambu, rumah dinding anyaman dengan atap genteng oranye dan jemuran warna-warni, ayam.
- **Kolam galian**: lubang di tanah dengan dinding tanah cokelat, bibir hijau limau terang, air biru muda beriak (atau kosong, atau hijau lumut).
- Matahari hangat dari samping atas, bayangan lembut, langit biru pekat dengan awan putih besar, kabut tipis di kejauhan.
- **Vignette gelap yang kuat** di semua sudut, bloom lembut di langit, tanpa grain dan tanpa aberasi.
- Adegan bawah air: hijau gelap dengan pita cahaya miring lebar, bola plankton hijau bercahaya dengan halo, batu low-poly cokelat.

## Caption

```
{
 "count": 145,
 "center_y_pct": 70.1,
 "center_x_pct": 50.0,
 "glyph_block_height_pct_of_H": 5.16,
 "width_pct_of_W_median": 43.6,
 "width_pct_max": 83.9,
 "fill_colours": [
  {
   "hex": "#fbfbfa",
   "share": 0.475
  },
  {
   "hex": "#f6d54e",
   "share": 0.215
  },
  {
   "hex": "#96d634",
   "share": 0.214
  },
  {
   "hex": "#e1a21e",
   "share": 0.095
  }
 ],
 "outline_colour": "#231900",
 "caption_colour_families": {
  "white": 82,
  "yellow/orange": 48,
  "other": 15
 },
 "duration_median_s": 0.25,
 "duration_p10_p90": [
  0.25,
  0.75
 ],
 "on_screen_share": 0.91,
 "static_text_rows_pct": [],
 "example_frame": "captions\\full_072.png",
 "start_offset_to_nearest_word_median_s": -0.02,
 "words_per_caption_median": 1.0,
 "words_per_caption_dist": {
  "0": 28,
  "1": 74,
  "2": 36,
  "3": 7
 }
}
```

Font: **Montserrat ExtraBold (800)**, menang di 4 dari 4 crop (`fonts.py match`, IoU 0,87-0,91).
- Huruf kecil seperti di script (kapital hanya di awal kalimat dan nama), 1 kata per caption (kadang 2), tanda baca ikut tampil.
- Putih dengan tepi cokelat-hitam tipis dan bayangan lembut; **kata kunci kuning** (#f6d54e) sekitar sepertiga caption.
- Pusat di 70% tinggi layar (9:16). Ukuran font **3,87% tinggi layar** (diukur dari crop: kata yang sama dirender lalu dibandingkan; angka awal 4,9% ternyata 1,27× terlalu besar). Berganti tiap kata, tanpa animasi pop.
- Satu kata per caption; kata pendek (≤4 huruf: ke, di, dan, itu, Tapi) digabung dengan kata berikutnya (`joinShort: 4`).
- Teks lain ada di dunia 3D, bukan overlay: papan angka ("1 KARUNG", "9 KARUNG", "="), label merah di karung.

## Suara

```
{
 "has_audio": true,
 "lufs_i": -17.0,
 "lra": 2.9,
 "true_peak": -3.0,
 "stereo_width_side_mid_db": -58.3,
 "speech_lang": "id",
 "speech_share": 0.84,
 "words": 152,
 "words_per_s": 2.51,
 "pauses_over_0.35s": 18,
 "longest_pause": 0.78,
 "music": {
  "gap_level_db_below_speech": 23.8,
  "gap_spectral_flatness": 0.335,
  "bed_guess": "noise/room tone only",
  "low_band_db_in_gaps": -59.3,
  "tempo_bpm_guess": 150.0,
  "tempo_confidence": 0.049
 },
 "strong_onsets_per_min": 86.7,
 "strong_onsets_in_pauses": 0,
 "cuts_with_hit_80ms": 0.07
}
```

- **Tanpa musik.** Spektrogram hanya berisi blok suara, hening di antara frasa, dan beberapa nada pendek. Pakai `act("none", 0)`.
- Ambience udara desa sangat pelan (`amb: "desa"`, bawah air `amb: "bawahair"`).
- SFX kecil dan jarang, hanya di aksi (pelet jatuh ke air, karung ditaruh, ayam). Hanya 7% cut yang berbunyi; dissolve tidak berbunyi.
- Referensi −17 LUFS; skill ini memaster ke −14 LUFS seperti gaya lain (platform menormalkan keduanya).
- Claude tidak bisa mendengar: deskripsi ini dari angka dan spektrogram. Minta user mengoreksi kalau perlu.

## Yang masih beda dengan referensi

Video pertama `abu-dapur-sawah` (2026-11-11, `references/compare/abu-dapur-sawah/`): ukuran caption, warna, vignette, dan horison sudah disesuaikan. Sisa beda: gambar kita lebih tajam (referensi 720p hasil unduhan, lebih lembut), saturasi sedikit lebih tinggi saat rumput memenuhi layar, master −14 LUFS vs −17 di referensi.

Perbandingan stills sebelumnya 2026-11-11 (`references/compare/final/`, 8 pasangan stills dari adegan kalibrasi; belum ada video sampel dengan VO):

- Angka warna (luma, kontras, saturasi, kehangatan, titik hitam/putih) sudah dalam toleransi; tidak ada tanda BEDA di `metrics.md`.
- Garis tepi kepala di close-up sedikit lebih tipis dari referensi; bagian bawah kepala masih sedikit abu-abu, referensi lebih rata krem.
- Rambut mangkuk lebih bulat dan mengilap; referensi punya garis poni yang jelas di dahi.
- Bawah air: pita cahaya referensi lebih tegas (terang/gelap bergantian), plankton referensi punya titik kilau putih; batu kita sedikit lebih gelap kemerahan.
- Karung kita lebih besar dan anyamannya lebih kasar; label merah referensi bergambar ikon kecil.
- Set referensi lebih padat: pohon lebih besar dan rapat, bukit jauh, lebih banyak ayam dan barang; rumah lebih detail.
- Belum diuji di video: tempo shot, gerak dorong/tarik, dissolve, ketepatan cut di kata, dan suara (Claude tidak bisa mendengar; tanpa musik diambil dari spektrogram).
