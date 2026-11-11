---
name: basic-style-4
description: "Basic style 4: bikin video cerita twist pendek dengan gaya referensi 'Ref 5' (lap kuning kos putra): karakter kartun 2D vektor seperti stiker (kepala besar, outline hitam tebal + glow krem, wajah digambar, badan balok, tangan tabung) yang ditaruh di set 3D bersih dan kalem, hard cut tiap klausa sekitar 1-2 detik, shot frontal setinggi mata dengan dorongan pelan, insert besar tangan + benda, caption 1-2 kata Montserrat ExtraBold putih dengan kata kunci kuning, musik tipis + SFX sintesis, 60 FPS, 9:16 atau 16:9, dari VO ElevenLabs + script + brief visual milik user. Pakai skill ini setiap kali user menulis 'Basic style 4', 'Basic style 4 9:16', 'Basic style 4 16:9', 'style 4', 'gaya Ref 5', 'gaya lap kuning/kos', atau minta video dengan karakter stiker 2D di ruangan 3D. Bukan untuk Basic style 1/2/3 (skill basic-style), Marc AHO, atau Rick Style (skill rick-style)."
---

# Basic style 4

Mengubah VO, script, dan brief visual menjadi MP4 60 FPS. Gayanya diukur dari video referensi "Ref 5" (cerita lap kuning di kos putra, 79 detik, 9:16) dan dibuktikan di sampel `examples/smong-sample/` (Smong Simeulue, 9:16).

Komunikasi dengan user dalam bahasa Indonesia. Teks di dalam video mengikuti bahasa VO.

## Perintah user

| User menulis | Rasio | Output |
|---|---|---|
| `Basic style 4 9:16` | 9:16 | 1080×1920, 60 FPS |
| `Basic style 4 16:9` | 16:9 | 1920×1080, 60 FPS |

Kalau rasio tidak disebut, tanya dulu. Kalau user minta keduanya, susun satu kali lalu render dua kali.

## Yang dibawa user

1. **VO ElevenLabs** (MP3/WAV). User tidak mau suara dari Claude. Jangan membuat VO atau memakai TTS, termasuk sebagai suara sementara, kecuali user sendiri yang meminta untuk sampel. Kalau VO belum ada, minta dulu dan berhenti.
2. **Script**, sumber ejaan dan tanda baca.
3. **Brief visual** scene per scene.

Sebelum menyusun audio, pastikan VO hanya berisi suara.

Jaga tampilannya persis seperti referensi. Variasi datang dari cerita, set, dan gag, bukan dari mengubah gaya. Jangan mencampur kode dengan basic-style, rick-style, atau marc-aho.

## Isi skill

| Lokasi | Isi | Kapan dibaca |
|---|---|---|
| `references/gaya.md` | Hasil ukur referensi: tempo, cut, kamera, karakter, warna, caption, suara | Sebelum menyusun shot |
| `references/katalog.md` | API `Puppet`, `Cutout`, prop 2D, set, opsi shot, SFX, musik | Saat menulis `story.js` |
| `references/produksi.md` | Masalah yang pernah terjadi dan solusinya | Kalau ada yang tampak salah |
| `examples/smong-sample/` | Sampel lengkap: rumah malam, pantai, ombak 2D, insert tangan | Baca bagian yang mirip dengan brief |
| `templates/` | Kerangka video kosong | Disalin otomatis |
| `kit/` | Engine dan tools; jangan diedit untuk satu video | Tidak perlu dibaca utuh |

## Alur kerja

- **Cek tool dulu** kalau ini video pertama di komputer ini atau ada error "not found": jalankan `python ~/.claude/skills/basic-style/setup/doctor.py` (kalau `python` tidak ada: Windows `py -3.12`, Mac `python3`). Kalau ada yang MISSING, minta user menjalankan installer repo (`setup/install.ps1` di Windows, `setup/install.sh` di Mac/Linux) atau pasang yang kurang sesuai petunjuk di baris itu.

`SKILL` = folder skill ini. Proyek ada di `D:\basic-style-4\<nama>`, di luar OneDrive (di PC tanpa drive D: otomatis `~/Videos/basic-style-4/<nama>`; bisa diganti lewat env `VIDEO_ROOT`). Pakai path yang dicetak `new-video.sh`. Jalankan dari folder proyek.

1. **Buat proyek**: `sh "$SKILL/scripts/new-video.sh" <nama> <9:16|16:9> "<path-vo>"` (tambah `--example` untuk memuat sampel Smong).
2. **Tulis `vo/script.json`**: per kalimat atau klausa, teks persis seperti diucapkan, id `A1`, `A2`, ...
3. **Selaraskan VO**: `PYTHONIOENCODING=utf-8 python tools/align_vo.py vo/vo_source.mp3` → `vo/timing.json`, `vo/words.md`. Ejaan dari script, waktu dari ucapan.
4. **Shot list** (baca `gaya.md`): satu shot per klausa, cut tepat di kata pertama klausa. Tentukan lokasi, siapa, ekspresi per kata pemicu, dan insert benda.
5. **Set dan cast**: `scenes/js/cast.js` (opsi `Puppet`), satu `set_*.js` per lokasi mulai dari `set_room4.js`. Karakter dan benda yang dipegang selalu 2D (`Puppet`, `Cutout`); ruangan dan alam boleh 3D tapi bersih dan kalem.
6. **`scenes/js/story.js`**: `do(t, u, l)` murni fungsi waktu. Tanpa `trans` = hard cut (default gaya ini). Tulis `cue` di samping aksinya. Kata kunci kuning lewat `timeline(timing, { hi: [...] })`.
7. **QC frame**: `node tools/stills.mjs out/qc/all.png --ratio 9:16`, lalu baca frame mentah di `out/qc/all_f/`. Bandingkan berdampingan dengan frame referensi. Ulangi sampai bersih.
8. **Render**: `node tools/build.mjs --ratio 9:16 --name Judul_Video` (jalankan di background). Membuat mix, render, join, cek frame, lalu menyalin ke Desktop. Nama file otomatis diberi akhiran `_9x16_60fps`, jadi jangan menulis akhiran itu di `--name`.
9. **Serahkan**: lokasi file, spesifikasi, hasil ukur mix (target −14 LUFS, true peak < −1 dB), kata yang perlu dicek, dan fakta yang belum diverifikasi. Claude tidak bisa mendengar; sebut bagian audio yang paling perlu didengar user.
