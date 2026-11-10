# Catatan produksi

## Browser
- Pane browser sering tersembunyi: timer melambat dan `video.play()`/seek bisa macet. Encode tetap jalan karena tidak bergantung timer real-time. Jangan pakai `<video>` di browser untuk QC, pakai `check_video.ps1`.
- `javascript_tool` timeout 45 detik. Jalankan pekerjaan panjang sebagai promise di `window`, lalu polling. Timeout bukan berarti gagal, cek `frames/` atau state-nya dulu. Jangan menjalankan ulang sebelum dicek.
- Halaman `file://` tidak bisa dipakai, harus lewat `server.ps1`.
- Library (`topojson-client`, `mp4-muxer`, `world-atlas`, Google Fonts) diambil dari CDN, jadi perlu internet.
- Setelah `build.sh`, navigate ulang ke `render.html`. Kalau tab sudah tertutup, pakai `navigate` tanpa `tabId`.
- Notifikasi "failed exit code 255" dari server setelah `Stop-Process` itu normal, karena memang dimatikan.

## Mematikan server
```powershell
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*server.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false }
```

## Transkrip fallback (tanpa Python)
Buka `http://localhost:8767/tr.html`, lalu:
```js
await decode(); window.loadP = loadW('onnx-community/whisper-small').then(r => { window.loaded = r; run({language:'indonesian',task:'transcribe',chunk_length_s:30,stride_length_s:5,return_timestamps:true}).then(() => window.trDone = 1).catch(e => window.trDone = 'ERR ' + e.message); });
```
Model ±250 MB dan di-cache per origin, jadi tetap pakai port 8767. Saat inferensi main thread terblokir dan polling timeout, itu wajar. Cek `window.res.chunks` beberapa saat kemudian. Fallback ini hanya memberi timing per segmen, jadi jeda dihitung dari RMS audio.

## Python

Dicek 2026-11-10: Python 3.12.10 ada di `%LOCALAPPDATA%\Programs\Python\Python312\python.exe`, ffmpeg/ffprobe 9.0.2 di PATH user. Shell lama perlu refresh PATH (`check_video.ps1` sudah melakukannya). faster-whisper 1.2.1 dengan `av` 14.2.0 (av 19 merusak faster-whisper); kalau error `metadata_errors`, jangan naikkan `av`. Unduhan pertama model `small` butuh waktu karena koneksi lambat. Node.js 24.18.0 juga ada untuk tool Node dan ffmpeg.

## Masalah render
| Gejala | Penyebab | Solusi |
|---|---|---|
| Garis horizontal melintang di peta | Ring melewati garis 180° | Sudah ditangani `toRing`; cek polygon custom |
| Daratan Eropa/Amerika hilang | Data regional hanya 60–175°E | Engine otomatis pakai data dunia kalau `cam.lon<88` atau `k<700`; `mapExtra` harus mengikuti aturan yang sama |
| Garis tepi raksasa, layar hitam | Prop digambar di dalam prop yang sudah di-scale | Pakai `__lw(c,f,minPx)` setelah `c.scale` |
| Motion blur aneh saat lompat kamera | Lompatan di dalam satu scene | Pisahkan jadi dua entri `SCENES` |
| `SyntaxError: already declared` | Nama sama dengan engine | Ganti nama di `story.js` |
| Prop hilang saat `sc=0` | Fungsi prop return kalau `sc≈0` | Cek argumen `env` |
| Peak mix di atas 0,9 | SFX terlalu keras | Turunkan amplitudo; impact maks ±.3 |

## Logo channel
Simpan logo di folder kerja, lalu di `story.js` ganti `const LOGO = null;` dengan:
```js
const LOGO = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'logo.png'; });
```
Top-level await aman karena `film.js` adalah module. Logo dipotong lingkaran di kartu Follow, jadi pakai gambar persegi.

## Lokasi hasil
`encode()` dan `sheet()` menyimpan ke `<folder-kerja>/frames/`. Hasil akhir salin ke Desktop.
