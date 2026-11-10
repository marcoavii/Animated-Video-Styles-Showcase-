# Rasio: stage dan framing

Semua shot menggambar di **stage tetap 1920×1080**. Engine lalu membingkai stage itu ke kanvas output. Jadi satu `scenes.js` bisa melayani dua rasio.

| Rasio | Output | Stage yang terlihat di zoom terkecil |
|---|---|---|
| 16:9 | 1920×1080 | seluruh stage (zoom 1) |
| 9:16 | 1080×1920 | sekitar 945×1680 (zoom 1.143) |

Latar melukis melewati tepi stage sejauh `OVER` (480 di 9:16, 170 di 16:9). Karena itu 9:16 mendapat langit dan tanah ekstra, bukan pita hitam. Di 9:16, area stage yang aman adalah y −480 sampai 1560.

Jangan memakai zoom di bawah 1.143 di 9:16, karena tepi kanvas terlihat.

## Framing per shot
Di akhir `scenes.js`:
```js
framing: {
  '9:16': {
    garden: [[0, 470, 640, 1.25], [Q.signSlam - .24, 1150, 650, 1.143, .24]],
  },
  '16:9': {},
}
```
Tiap keyframe: `[waktu, stageX, stageY, zoom, detikPindah]`. Keyframe pertama berlaku dari awal shot. Tanpa entri, shot memakai tengah stage.

## Posisi caption
Baris caption terakhir ada di layar y=1290 (9:16) atau y=862 (16:9). Saat membingkai 9:16, caption jatuh di stage:

`stageY_caption = y_framing + 330 / zoom`

Pilih `y_framing` supaya kaki atau subjek berada di atas angka itu. Caption dua baris naik sekitar 75 piksel layar. Hindari area bawah layar 9:16 (di bawah y≈1560) untuk hal penting, karena tertutup UI Shorts/TikTok.

## Menulis shot untuk dua rasio
Variabel `PORTRAIT` bernilai true di 9:16. Pakai cabang hanya di tempat yang perlu.

| Situasi di 9:16 | Solusi | Contoh di Taman Iblis |
|---|---|---|
| Dua subjek berjauhan | Pan cepat antar subjek pada kejadiannya | `garden`, `kosacki`, `bangalore` |
| Subjek lebar | Kecilkan atau geser | `FLAIL`, `general` |
| Tata letak melebar | Susun ulang jadi tumpuk | `paintPosterTall` |
| Karakter polos di latar gelap | Perbesar sampai kaki keluar frame, supaya tidak melayang | `german`, `general` |
| Elemen lepas seperti label dan tengkorak | Geser ke area terlihat | `tape`, `betty` |

Di 9:16 karakter bisa jauh lebih besar di frame. Manfaatkan itu: video vertikal paling kuat saat dekat dengan wajah.

## UI selalu lewat HUD
Elemen layar harus digambar dengan piksel output, bukan stage, supaya tidak ikut terpotong atau bergeser:
- `killFeed(c, t, t0, kiri, kanan)` sudah otomatis.
- `hudStrip(c, k, teks, x16, y16, opsi)`: label hitam; di 9:16 otomatis di tengah atas.
- `hud(c, g => {...})`: gambar bebas memakai `OW`, `OH`. Mulai dari y≈130 di 9:16, karena bagian paling atas tertutup UI aplikasi.

## Satu video, dua rasio
Di `project.json` ada rasio default. Render rasio lain dengan flag, dan hasilnya tidak saling menimpa:
```bash
node tools/render.js --video --workers 5 --ratio 16:9
```
