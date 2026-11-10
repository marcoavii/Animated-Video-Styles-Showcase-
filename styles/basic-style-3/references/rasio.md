# Rasio

Satu `story.js` melayani dua rasio. Yang berbeda hanya framing, jadi kalau user meminta rasio kedua nanti, tambahkan framing lalu render lagi.

| Rasio | Output | Caption |
|---|---|---|
| 16:9 | 1920×1080 | 73,5% dari atas, tinggi font 6,2% |
| 9:16 | 1080×1920 | 68,5% dari atas, tinggi font 3,75% |

## Konversi otomatis

`cam` ditulis dengan fov 16:9. Di 9:16 fov vertikal dikonversi supaya **lebar layar 9:16 kurang lebih sama dengan tinggi layar 16:9**. Jadi subjek yang pas setinggi layar di 16:9 akan pas selebar layar di 9:16, dan dunia ekstra muncul di atas dan bawahnya. Sebagian besar shot satu subjek langsung bagus tanpa diubah.

## Tiga alat penyesuaian

1. **`pk`**: pengali lebar. `pk: 1.2` memperlihatkan 20% lebih lebar. Untuk dua atau tiga tokoh.
   Lebar pandang = `2 × jarak × tan(fov/2) × pk`.
2. **`pcam`**: keyframe kamera khusus 9:16, menggantikan `cam`. Untuk komposisi yang isinya melebar.
3. **`P`**: boolean dari `direct.js`, untuk posisi benda yang berbeda per rasio.

```js
// "+5" di samping tokoh pada 16:9, di atas kepalanya pada 9:16
office.plus.position.set(P ? -0.42 : -1.92, P ? 3.72 : 2.2, -0.7);
```

Jangan membaca `window.__portrait` dari `story.js`, karena modul di-import sebelum `main.js` mengisinya. Pakai `P`.

## Yang perlu ditata ulang di 9:16

| Isi shot | Solusi |
|---|---|
| Teks 3D di samping tokoh | taruh di atas kepala |
| Kerumunan atau 3+ tokoh | `pk` 1,2–1,4, atau rapatkan posisi dengan `P` |
| Deretan benda mendatar | perkecil dan tengahkan dengan `P` |
| Peta atau tampilan atas dengan dua lokasi jauh | dekatkan lokasi dengan `P` |
| Tokoh di sisi frame di 16:9 | `pcam` dengan titik lihat tepat di tokoh |
| Wajah tertimpa caption | turunkan `lookY` di `pcam` supaya tokoh naik di layar |
| Langit-langit kosong besar | pakai untuk teks 3D, atau rapatkan kamera |

Untuk `ending: "loop"`, frame akhir shot terakhir harus sama dengan frame awal shot pertama **di kedua rasio**. Jadi kalau shot pertama punya `pcam`, keyframe akhir `pcam` shot terakhir memakai nilai yang sama.

## Yang perlu diingat di 16:9

Komposisi memakai aturan sepertiga: tokoh di satu sisi, benda atau teks di sisi lain. Lebih banyak set yang terlihat ke samping, jadi pastikan interior tertutup keempat sisinya dan punya isi di kiri dan kanan.
