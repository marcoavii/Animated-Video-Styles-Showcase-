---
name: basic-style
description: "Basic style (1, 2, 3 dalam satu skill): bikin video pendek dari VO ElevenLabs + script + brief visual milik user, dengan memilih salah satu dari tiga gaya. Style 1 = peta kuno parchment + karakter chibi peg-doll, caption highlight kuning, 9:16 30 FPS. Style 2 = kartun tinta tebal di malam berbulan dengan gag UI game (kill feed, progress bar, stamp), caption per kata, 60 FPS, 9:16 atau 16:9. Style 3 = cerita kartun 3D sinematik three.js (kepala bulat bermata cincin, whip + motion blur, teks 3D memantul), 60 FPS, 9:16 atau 16:9. Pakai skill ini setiap kali user menulis 'Basic style', 'Basic style 1', 'Basic style 2', 'Basic style 3' (dengan atau tanpa rasio 9:16/16:9), 'style 1/2/3', 'gaya peta chibi', 'gaya Taman Iblis', 'gaya ranjau kemarin', 'gaya mercusuar', 'gaya penjaga mercusuar', 'gaya yang napi/prison kemarin', atau mengirim VO plus brief untuk video explainer sejarah/geografi/cerita. Bukan untuk character-style-1 (persona + dino Claude) atau cartoon-3d-short (kartu 2D di dunia 3D Remotion)."
---

# Basic style (1 / 2 / 3)

Satu skill berisi tiga gaya video. Setiap gaya punya engine, tools, contoh, dan aturannya sendiri di `styles/`. Tugas file ini hanya memilih gaya, lalu menyerahkan semua pekerjaan ke `STYLE.md` gaya itu.

Komunikasi dengan user dalam bahasa Indonesia. Teks di dalam video mengikuti bahasa VO.

## Tiga gaya

| Gaya | Tampilan | Rasio | FPS | Panduan |
|---|---|---|---|---|
| **Basic style 1** | Peta kuno parchment, karakter chibi peg-doll, kamera terbang di atas peta, caption highlight kuning, transisi cepat. Cocok untuk sejarah, negara, peta, perdagangan, "Kenapa...". | 9:16 | 30 | `styles/basic-style-1/STYLE.md` |
| **Basic style 2** | Kartun tinta tebal di malam berbulan, gag UI game (kill feed, progress bar, stamp), caption per kata yang pop, whip pan, transisi garis putih, end card SUBSCRIBE, SFX sintesis. | 9:16 atau 16:9 | 60 | `styles/basic-style-2/STYLE.md` |
| **Basic style 3** | Kartun 3D sinematik three.js: karakter kepala bulat bermata cincin, garis tinta, cahaya amber dan malam biru, whip + motion blur, shot sekitar 1 detik, caption 1-2 kata, teks 3D memantul, ending loop, SFX sintesis. | 9:16 atau 16:9 | 60 | `styles/basic-style-3/STYLE.md` |

## Langkah 1: pilih gaya

1. Kalau user sudah menyebut gayanya ("Basic style 2 16:9", "style 3", "gaya mercusuar", "gaya peta chibi", dan sejenisnya), langsung pakai gaya itu.
2. Kalau belum (misalnya cuma "Basic style", "video selanjutnya", atau langsung kirim VO + brief), **tanya dulu** dengan AskUserQuestion. Satu pertanyaan, tiga pilihan: Basic style 1, Basic style 2, Basic style 3, masing-masing dengan satu kalimat tampilan dari tabel di atas. Jangan menebak dari topik, karena ketiga gaya bisa dipakai untuk topik apa saja.
3. Rasio: Basic style 1 selalu 9:16. Untuk style 2 dan 3, kalau rasio belum disebut, tanyakan di pertanyaan yang sama (pertanyaan kedua: 9:16, 16:9, atau keduanya).

## Langkah 2: jalankan gaya itu

Baca `styles/basic-style-N/STYLE.md` sampai habis, lalu ikuti alur kerjanya persis. Di dalam file itu, `SKILL` berarti folder `styles/basic-style-N`, jadi semua path seperti `$SKILL/scripts/new-video.sh`, `references/...`, `kit/...`, dan `examples/...` dihitung dari folder gaya itu.

Folder proyek tetap sama seperti sebelum digabung:

| Gaya | Folder kerja |
|---|---|
| Basic style 1 | scratchpad sesi (lihat STYLE.md), hasil disalin ke Desktop |
| Basic style 2 | `D:\basic-style-2\<nama>` (tanpa drive D: `~/Videos/basic-style-2/<nama>`) |
| Basic style 3 | `D:\basic-style-3\<nama>` (tanpa drive D: `~/Videos/basic-style-3/<nama>`) |

## Aturan bersama

- **Cek tool dulu** kalau ini video pertama di komputer ini atau ada error "not found": jalankan `python <root skill>/setup/doctor.py` (Windows: `py -3.12` kalau `python` tidak ada). Kalau ada yang MISSING, minta user menjalankan installer repo (`setup/install.ps1` di Windows, `setup/install.sh` di Mac/Linux) atau pasang yang kurang sesuai petunjuk di baris itu.
- **VO selalu dari user** (ElevenLabs). Jangan pernah membuat voice over atau memakai TTS, termasuk sebagai suara sementara. Kalau VO belum ada, minta dulu.
- **Satu video = satu gaya.** Jangan mencampur engine, kode, prop, atau aset antar gaya, supaya hasil tiap gaya tetap sama dengan video-video aslinya. Kalau user minta gaya lain di tengah jalan, mulai proyek baru dengan gaya itu.
- **Jaga tampilan.** User sudah menyukai visual ketiga gaya. Variasi datang dari cerita, set, dan gag sesuai brief, bukan dari mengubah gaya.
- Claude tidak bisa mendengar audio. Laporkan mix sebagai hasil ukur, bukan sebagai sudah didengar.
