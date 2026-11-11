# Masalah yang pernah terjadi (Rick Style)

| Gejala | Sebab | Solusi |
|---|---|---|
| Tokoh tertutup selimut atau benda 3D besar | benda 3D di depan billboard | skala benda dikecilkan (`blanket.scale.y 0.5`) dan kamera dinaikkan |
| Tokoh tidak terlihat di shot tracking | titik lihat terlalu jauh di depan tokoh | arahkan `look` ke posisi tokoh di tengah shot |
| Ombak 3D bergeser jauh ke belakang | lengkungan ujung dihitung dari ekstrusi satu segmen | `steps: 80` di `makeWave`, sudah diperbaiki |
| Kamera di bawah tanah di bukit | tinggi kamera dari `groundY` titik lain | hitung `groundY` di posisi kamera sendiri |
| Wajah tokoh berbaring tidak terbaca | bidang rata dengan lantai | `lie: true` memakai `lieTilt` 0,35 rad supaya bidang condong ke kamera |
| Render crash sesekali | browser | `build.mjs` mengulang otomatis |

Render 1080×1920 sekitar 0,4 detik per frame (subframe lebih banyak karena kamera terbang). Laptop jangan tidur selama render.
