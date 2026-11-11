---
name: rick-style
description: "Rick Style: bikin video cerita twist pendek dengan gaya referensi 'Rick Style' (Ricks Clips, rel kereta di ngarai): karakter 2D bergaris tinta tangan (kepala bulat putih, wajah titik-garis sederhana, badan bean, kaki dan tangan lidi, topi garis-garis/bowler/peci) sebagai billboard di dunia 3D yang sangat jenuh dan hangat (langit biru pekat, awan besar, ngarai oranye-ungu, bloom), kamera yang terbang (FPV dengan motion blur, crane, sudut rendah), sambungan dissolve lembut, emote (uap marah, keringat), caption 1-2 kata Montserrat Black putih bertepi hitam tanpa highlight, musik + SFX sintesis, 60 FPS, 9:16 atau 16:9, dari VO ElevenLabs + script + brief visual milik user. Pakai skill ini setiap kali user menulis 'Rick Style', 'Rick style 9:16', 'Rick style 16:9', 'gaya Rick', 'gaya Ricks Clips', 'gaya rel kereta/ngarai', atau minta karakter kepala putih kaki lidi di dunia 3D berwarna. Bukan untuk Basic style 1-4 atau Marc AHO."
---

# Rick Style

Mengubah VO, script, dan brief visual menjadi MP4 60 FPS. Gayanya diukur dari video referensi "Rick Style" (Ricks Clips, cerita celah rel 39 kaki, 65 detik, 9:16) dan dibuktikan di sampel `examples/smong-sample/` (Smong Simeulue, 9:16).

Komunikasi dengan user dalam bahasa Indonesia. Teks di dalam video mengikuti bahasa VO.

## Perintah user

| User menulis | Rasio | Output |
|---|---|---|
| `Rick Style 9:16` | 9:16 | 1080×1920, 60 FPS |
| `Rick Style 16:9` | 16:9 | 1920×1080, 60 FPS |

Kalau rasio tidak disebut, tanya dulu.

## Yang dibawa user

1. **VO ElevenLabs** (MP3/WAV). User tidak mau suara dari Claude. Jangan membuat VO atau memakai TTS, termasuk sementara, kecuali user sendiri meminta untuk sampel. Kalau VO belum ada, minta dulu dan berhenti.
2. **Script**, sumber ejaan dan tanda baca.
3. **Brief visual** scene per scene.

Sebelum menyusun audio, pastikan VO hanya berisi suara.

Jaga tampilannya persis seperti referensi. Variasi datang dari cerita, set, dan gag. Jangan mencampur kode dengan basic-style, basic-style-4, atau marc-aho.

## Isi skill

| Lokasi | Isi | Kapan dibaca |
|---|---|---|
| `references/gaya.md` | Hasil ukur referensi: tempo, gerak kamera, sambungan, karakter, dunia, caption, suara | Sebelum menyusun shot |
| `references/katalog.md` | API `Toon`, set, prop 3D, opsi shot, SFX, musik | Saat menulis `story.js` |
| `references/produksi.md` | Masalah yang pernah terjadi | Kalau ada yang tampak salah |
| `examples/smong-sample/` | Sampel lengkap: pulau malam ungu, rumah panggung, pantai yang surut, ombak 3D | Baca bagian yang mirip dengan brief |
| `templates/` | Kerangka video kosong | Disalin otomatis |
| `kit/` | Engine dan tools; jangan diedit untuk satu video | Tidak perlu dibaca utuh |

## Alur kerja

- **Cek tool dulu** kalau ini video pertama di komputer ini atau ada error "not found": jalankan `python ~/.claude/skills/basic-style/setup/doctor.py` (kalau `python` tidak ada: Windows `py -3.12`, Mac `python3`). Kalau ada yang MISSING, minta user menjalankan installer repo (`setup/install.ps1` di Windows, `setup/install.sh` di Mac/Linux) atau pasang yang kurang sesuai petunjuk di baris itu.

`SKILL` = folder skill ini. Proyek ada di `D:\rick-style\<nama>` (di PC tanpa drive D: otomatis `~/Videos/rick-style/<nama>`; bisa diganti lewat env `VIDEO_ROOT`). Pakai path yang dicetak `new-video.sh`. Jalankan dari folder proyek.

1. **Buat proyek**: `sh "$SKILL/scripts/new-video.sh" <nama> <9:16|16:9> "<path-vo>"` (tambah `--example` untuk sampel Smong).
2. **Tulis `vo/script.json`** per kalimat atau klausa, id `A1`, `A2`, ...
3. **Selaraskan VO**: `PYTHONIOENCODING=utf-8 python tools/align_vo.py vo/vo_source.mp3` → `vo/timing.json`, `vo/words.md`.
4. **Shot list** (baca `gaya.md`): setiap shot punya gerak kamera yang jelas; pindah tempat dengan dissolve atau satu gerak terbang menerus; buka dengan aksi aneh si tokoh di kalimat pertama.
5. **Set dan cast**: `cast.js` (opsi `Toon`), satu `set_*.js` per lokasi mulai dari `set_vivid.js`. Karakter selalu 2D `Toon` (billboard); benda dan dunia 3D penuh warna.
6. **`story.js`**: `do(t, u, l)` murni fungsi waktu; `trans: diss(0.12–0.25)` default, `push` untuk zoom kejut, `whip` jarang. Tulis `cue` di samping aksinya.
7. **QC frame**: `node tools/stills.mjs out/qc/all.png --ratio 9:16`, baca frame mentah di `out/qc/all_f/`, bandingkan berdampingan dengan referensi.
8. **Render**: `node tools/build.mjs --ratio 9:16 --name Judul_Video` di background. Nama file otomatis diberi `_9x16_60fps`.
9. **Serahkan**: lokasi file, spesifikasi, hasil ukur mix (−14 LUFS, true peak < −1 dB), kata yang perlu dicek, fakta yang belum diverifikasi, dan bagian audio yang paling perlu didengar.
