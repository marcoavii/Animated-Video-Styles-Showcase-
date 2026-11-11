---
name: basic-style-5
description: "Basic style 5: bikin video cerita kartun 3D desa low-poly dengan gaya referensi 'petani dan kolam' (kepala bola krem bergaris tepi hitam tebal dengan wajah digambar, peci atau rambut mangkuk, baju batik atau polos, tangan-kaki lidi hitam; dunia rumput limau, kolam galian, pohon kelapa, rumah anyaman; kamera rendah yang selalu dorong/tarik pelan, shot 2-5 detik, hard cut dan dissolve cepat; caption 1 kata Montserrat ExtraBold putih dengan kata kunci kuning; tanpa musik, ambience desa pelan, SFX kecil), 30 FPS, 9:16 atau 16:9, dari VO ElevenLabs + script + brief visual milik user. Pakai skill ini setiap kali user menulis 'Basic style 5', 'Basic style 5 9:16', 'Basic style 5 16:9', 'style 5', 'gaya petani kolam', atau minta video kartun desa 3D dengan kepala bola krem. Bukan untuk Basic style 1-3 (skill basic-style), Basic style 4, Rick Style, Marc AHO, 2D Vintage Character, jkson what if, atau gaya lain."
---

# Basic style 5

Referensi: video petani yang menebar kotoran ke kolam barunya (63 detik, 720×1280, 30 FPS). Folder ukur, frame, dan salinan video referensi: `<VIDEO_ROOT>/basic-style-5/_reference/` (`reference.mp4`, `report.json`); di PC ini `D:\basic-style-5\_reference`. Folder ini tidak ikut di repo.

Mengubah VO, script, dan brief visual menjadi MP4 30 FPS. Gayanya diukur dari video referensi petani dan kolam (720×1280, 30.0 FPS, 63 detik) oleh Style Cloner pada 2026-11-11.

Komunikasi dengan user dalam bahasa Indonesia. Teks di dalam video mengikuti bahasa VO.

## Perintah user

| User menulis | Rasio | Output |
|---|---|---|
| `Basic style 5 9:16` | 9:16 | 1080×1920, 30 FPS |
| `Basic style 5 16:9` | 16:9 | 1920×1080, 30 FPS |

Kalau rasio tidak disebut, tanya dulu. Kalau user minta keduanya, susun satu kali lalu render dua kali.

## Yang dibawa user

1. **VO ElevenLabs** (MP3/WAV). Jangan pernah membuat VO sendiri atau memakai TTS, termasuk sebagai suara sementara. Kalau VO belum ada, minta dulu dan berhenti.
2. **Script**, sumber ejaan dan tanda baca.
3. **Brief visual** scene per scene.

Jaga tampilannya persis seperti referensi. Variasi datang dari cerita, set, dan gag, bukan dari mengubah gaya. Jangan mencampur kode atau aset dengan skill gaya lain.

## Ringkasan gaya

- **Karakter**: `Villager` (`people.js`), kepala bola krem rata dengan garis tepi hitam yang tebalnya tetap di layar, wajah digambar (mata titik/cincin/senang, pipi merah muda, bibir merah tebal, kumis), peci hitam atau rambut mangkuk, badan bean batik atau polos, tangan-kaki lidi hitam.
- **Dunia**: `buildVillage` (`village.js`), desa low-poly sangat jenuh: rumput limau, kolam galian berbibir hijau, air biru, pohon bulat bersegi, kelapa, rumah anyaman beratap oranye, jemuran. `buildUnderwater` untuk adegan plankton.
- **Kamera**: rendah di atas rumput, setiap shot dorong atau tarik 10-15%, sering sambil mengitari tokoh. Shot 2-5 detik.
- **Sambungan**: hard cut di awal kata; dissolve 0,28 detik saat pindah tempat; tanpa whip dan shake.
- **Warna**: hangat dan jenuh, vignette gelap kuat, bloom lembut, tanpa grain. DOF tipis hanya di close-up.
- **Caption**: 1 kata, Montserrat ExtraBold putih bertepi gelap, kata kunci kuning #f6d54e, pusat 70% tinggi layar.
- **Suara**: tanpa musik (`act("none", 0)`), ambience desa sangat pelan, SFX kecil hanya di aksi, dissolve tanpa bunyi.

## Isi skill

| Lokasi | Isi | Kapan dibaca |
|---|---|---|
| `references/gaya.md` | Hasil ukur referensi: tempo, cut, kamera, karakter, warna, caption, suara | Sebelum menyusun shot |
| `references/katalog.md` | API karakter, set, prop, opsi shot, SFX, musik gaya ini | Saat menulis `story.js` |
| `references/produksi.md` | Masalah yang pernah terjadi dan solusinya | Kalau ada yang tampak salah |
| `references/compare/` | Lembar perbandingan referensi vs hasil | Saat QC |
| `examples/` | Sampel lengkap | Baca bagian yang mirip dengan brief |
| `templates/` | Kerangka video kosong | Disalin otomatis |
| `kit/` | Engine dan tools; jangan diedit untuk satu video | Tidak perlu dibaca utuh |
| `style.json` | fps, rasio, path referensi dan frame referensi | Saat QC |

## Alur kerja

`SKILL` = folder skill ini. Proyek ada di `D:\basic-style-5\<nama>` (tanpa drive D: otomatis `~/Videos/basic-style-5/<nama>`; bisa diganti lewat env `VIDEO_ROOT`). Jalankan perintah dari folder proyek.

1. **Buat proyek**: `sh "$SKILL/scripts/new-video.sh" <nama> <9:16|16:9> "<path-vo>"`.
2. **Tulis `vo/script.json`**: per kalimat atau klausa, teks persis seperti diucapkan, id `A1`, `A2`, ...
3. **Selaraskan VO**: `PYTHONIOENCODING=utf-8 python tools/align_vo.py vo/vo_source.mp3` → `vo/timing.json`, `vo/words.md`.
4. **Shot list** (baca `gaya.md`): panjang shot, jenis sambungan, gerak kamera, dan jenis shot mengikuti angka referensi.
5. **Set dan cast**: pakai modul gaya ini (lihat `katalog.md`); satu `set_*.js` per lokasi.
6. **`scenes/js/story.js`**: `do(t, u, l)` murni fungsi waktu. Kata highlight lewat `timeline(timing, { hi: [...] })`.
7. **QC frame**: `node tools/stills.mjs out/qc/all.png --ratio <rasio>`, baca frame mentah di `out/qc/all_f/`, lalu bandingkan berdampingan dengan referensi: `python "$SKILL/scripts/compare.py" --ref "<VIDEO_ROOT>/basic-style-5/_reference/reference.mp4" --ref-report "<VIDEO_ROOT>/basic-style-5/_reference/report.json" --out-frames out/qc/all_f --dest out/qc/compare`. Ulangi sampai bersih.
8. **Render**: `node tools/build.mjs --ratio <rasio> --name Judul_Video` (di background). Nama file otomatis diberi akhiran `_<rasio>_30fps`.
9. **Bandingkan video jadi**: `python "$SKILL/scripts/compare.py" --ref "<VIDEO_ROOT>/basic-style-5/_reference/reference.mp4" --ref-report "<VIDEO_ROOT>/basic-style-5/_reference/report.json" --out out/<file>.mp4 --dest out/qc/compare_final`. Tunjukkan lembar perbandingan ke user dan sebut bagian yang masih beda.
10. **Serahkan**: lokasi file, spesifikasi, hasil ukur mix (−14 LUFS, true peak < −1 dB), kata yang perlu dicek, bagian audio yang perlu didengar user (Claude tidak bisa mendengar).
