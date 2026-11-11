# Masalah yang pernah terjadi (Basic style 4)

| Gejala | Sebab | Solusi |
|---|---|---|
| Lingkaran hitam aneh di telapak tangan; highlight rambut jadi garis hitam | fungsi isi `sticker` membuat path baru sehingga outline menempel ke path itu | sudah diperbaiki di `toon.js` (path dibangun ulang sebelum outline). Jangan dihapus |
| Render gagal `Cannot read properties of undefined (reading 's')` | kode fade caption membaca caption saat belum ada kata (detik 0) | sudah dijaga di `main.js`; pertahankan cek `if (c)` |
| Caption berkedip di tengah frasa | fade-out dipasang di setiap akhir caption | fade hanya di jeda (>30 ms), sudah di `main.js` |
| Gambar buram di rumah padahal `dof: null` di shot | `null ?? set.dof` jatuh ke DOF set | matikan DOF di set (`dof: null`) |
| Tokoh terlihat kecil, kepala kurang besar | proporsi awal terlalu ramping | kepala R=208, torso 330 lebar; jangan dikecilkan |
| Glow terlalu tebal seperti stiker murahan | blur besar | glow +6 unit, blur 5; cukup sebagai garis krem tipis |
| Ombak 2D terlihat seperti pita datar | satu gulungan di ujung kanan saja | `drawWave` memakai tiga gulungan; dekatkan (z −50) dan tinggi 30–40 m |
| Bantal melayang saat tokoh bangun | bantal tetap tampil | sembunyikan benda yang tidak lagi ditopang |
| Render crash sesekali di tengah stills | browser | jalankan ulang; `build.mjs` mengulang otomatis |

Render 1080×1920 sekitar 0,25–0,3 detik per frame (subframe 2). Laptop jangan tidur selama render.
