# Katalog engine

Semua tersedia global di `story.js`. Koordinat layar 1080×1920. `sc` = skala animasi (0 = hilang), biasanya `env(t, mulai, selesai)`. Karakter/prop berporos di tengah-bawah.

## Animasi
`pr(t,a,b)` progres 0–1 · `io` ease in-out · `outC` ease out · `back(p)` overshoot · `env(t,a,b,din,dout)` skala pop in/out · `win(t,a,b,din,dout)` alpha fade · `lerp` · `clamp` · `rng(seed)` acak tetap · `cv(w,h)` canvas baru · `shade(hex,f)`.

## Peta
- `drawMap(c,w,h,cam,st,t)` mengembalikan `P(lon,lat)→[x,y]`. Kamera `{lon,lat,k}`: k≈330 dunia, 650 benua, 1150 Indonesia, 2500 pulau besar, 5000+ kota.
- Field `st`: `labels:[[teks,lon,lat,alpha,opsi]]`, `fills:[{rs atau g,col,a,wipe:[lon,lat,radiusPx],outline}]`, `shelf`, `flood`, `ghost`, `ice`, `iceShrink`, `deep`, `wallace`, `wallaceA`, `plates`, `plateA`, `merge`, `sundaHi`, `sahulHi`.
- `gid('iso')` ring negara mana pun dengan kode ISO numerik (360 Indonesia, 458 Malaysia, 702 Singapura, 840 AS, 250 Prancis, 528 Belanda, 826 Inggris, 124 Kanada, 484 Meksiko, 392 Jepang, 156 Tiongkok, 356 India).
- `GROUP.<nama>` pulau Indonesia: `indo sumatra jawa kalimantan sulawesi nusra maluku papua wallacea australia`.
- `toRing([[lon,lat],...],'id')` wilayah custom. Gambar di `mapExtra` dengan clip daratan seperti di template, supaya garis pantainya rapi.
- `pathRings(c,rings,cam,w,h)` · `polyline(c,P,pts,prog)` menggambar sebagian rute dan mengembalikan titik-titiknya (`.at(-1)` = kepala rute) · `miniMap(c,x,y,w,h,cam,st)` peta kecil untuk gelembung/poster.
- Data siap pakai: `SUNDA SAHUL WALLACE PLATES VOLC BANDA MAKASSAR` (Nusantara), `SG` Singapura, `NOLA MISS RG.{louis,usa,spain,florida,brit,orleans,sd}` (Amerika Utara 1803), `iceRings(e)`.

## Karakter
`drawChar(c,x,y,h,opsi,sc)`
- Wajib: `skin`, `shirt`. Opsional: `expr flip rot noShadow pattern buttons`.
- `hair`: `fringe curly long wig` (+`hairCol`). `beard`: `goatee full`.
- `hat`: `beanie akubra peci hijab puritan tricorn turban bandana destar tophat skullcap beret capotain morion bicorne shako headwrap` (warna lewat `turban bandana hijab destar beretCol wrap`).
- Pakaian: `ruff belts sash stripes tie cravat epaulette cloak scarf`.
- Kostum baru: definisikan `function bodyWearCustom(c,o,lw)` / `function extraWearCustom(c,o,hy,lw)` di `story.js` (unit relatif tinggi karakter, kepala di `hy=-.70`).

Contoh siap salin: pelaut `{skin:'#f0c6a6',hair:'fringe',hat:'beanie',shirt:'#2f4f7a',stripes:'#e8e2d6'}`, pedagang Belanda `{skin:'#f3ccaf',hair:'fringe',hairCol:'#7a4a22',hat:'puritan',shirt:'#2a2622',ruff:true}`, tentara VOC `{skin:'#f0c6a6',hair:'fringe',hat:'tricorn',shirt:'#3b5a8f',belts:true}`, diplomat `{skin:'#f3ccaf',hair:'wig',shirt:'#2b3a5a',cravat:true,buttons:true}`, Napoleon `{skin:'#f3ccaf',hair:'fringe',hairCol:'#3a2a1c',hat:'bicorne',shirt:'#2b3a6a',epaulette:true,buttons:true}`, investor `{skin:'#f3ccaf',hair:'fringe',shirt:'#2b3346',tie:'#c8302a'}`.

`drawGlove(c,x,y,s,rot,sc)` · `outlinedBlobs(c,[[x,y,r]],col,lw)`.

## Teks dan FX
`txt(c,s,x,y,{size,font,weight,col,a,rot,align,stroke,sw,shadow,sc,italic})` · `bigText` · `morphText(c,dari,ke,x,y,p,{size,colA,colB})` · `questionMark(c,x,y,s,sc)` · `arrow(c,x0,y0,x1,y1,w,col,sc)` · `yellowEllipse(c,x,y,rx,ry,rot,p)` · `bolt(c,x0,y0,x1,y1,a,t)` · `redX(c,x,y,s,p)` · `chevrons(c,arah,a,t)` · `bubble(c,cx,cy,rx,ry,tx,ty,sc,inner)` gelembung pikiran · `bubbleSay(c,x,y,s,teks,sc)` · `ripple` · `waves` · `snow` · `embers` · `flame` · `smoke` · `sun`.

## Latar plate
`plateSky(c,atas,bawah,yHorizon,t)` · `plateSea(c,y0,y1,t)` · `hills(c,y,warna,amp,f,ph)` · `woodFloor(c,y0,w1,w2)` · `woodTable(c,y0)` · `canal(c,y0,y1,t)` · `caneField(c,y0,t)`.

## Kapal
`galleon(c,x,y,s,t,{flag:'nl|pt|en|fr',sc,ph,roll,crew,cargo})` · `ship` (Belanda) · `junk` · `boat(c,x,y,s,karakter,sc)` · `bumboat` · `keelboat` · `containerShip(c,x,y,s,t,{sc,ph,seed,flip})` · `crane(c,x,y,s,t,ph)` · `boxStack`.

## Bangunan
`fort` · `cannon(c,x,y,s,t,waktuTembak,sc)` · `govBuilding` · `stadhuis(c,x,y,s,t,sc,flag,flagY)` · `stiltHouse(c,x,y,s,burn,sc)` · `dutchHouse(c,x,y,s,k,sc)` · `shophouses(c,x0,y,s,n,seed,tint)` · `tower(c,x,y,w,h,col,sc)` · `mbs` · `monas` · `factory(c,x,y,s,t,cerobong,sc)` · `windmill` · `palm` · `volcano` · `coffeeShrub`.

## Benda dan ikon
`nutmeg clove sack coin paper waxSeal crown jar shield briefcase caneBundle mosquito thermometer dropIcon treeIcon oreIcon chart(c,x,y,w,h,p,naik,sc) vocLogo(c,x,y,s,{a,crack,split,ink}) spiceHero(c,t,{glow,rays,aroma,zoom})`.

## Bumi 3D, letusan, kalender
- `spaceBg(c,t)` langit malam berbintang, jadi latar bumi.
- `globe(c,cx,cy,R,lon0,lat0,t,{cold,haze,hazeFrom})` bumi 3D dari data peta. `cold` 0–1 mengubah daratan jadi bersalju. `haze` 0–1 menyebarkan partikel dari titik `hazeFrom:[lon,lat]`.
- `globePt(cx,cy,R,lon0,lat0,lon,lat)` mengembalikan `[x,y,z]` di layar untuk menempel prop di bola bumi (`z<0` berarti di sisi belakang). `droplet(c,x,y,r,a)` satu partikel.
- `stratoVolcano(c,x,y,s,lava,t)` gunung besar untuk plate, `lava` 0–1, puncaknya di `y-.85*s`. Beda dengan `volcano`, yang kecil untuk peta.
- `eruptionPlume(c,x,y,S,p,t,wk)` kolom abu setinggi `S` dari titik `x,y`. `p` 0–1 tumbuhnya (payung abu mulai melebar di atas .55), `wk` lebar kolom. Gambar sebelum `stratoVolcano` supaya pangkalnya tertutup gunung.
- `calendar(c,x,y,w,h,head,big,sc,rot,{bigSize,grid,fold})` kalender dengan pita merah. `fold` 0–1 melipat halaman untuk animasi balik, `grid` menambah titik tanggal.
- `mixCol(a,b,p)` mencampur dua warna (hex atau `rgb()`).

## Bendera
`flagOf(c,'nl|pt|en|fr',x,y,w,h,t)` · `dutchFlag` · `mpFlag` (Merah Putih berkibar) · `hinomaru` · `flagFR flagUS15 flagHT` · `flagPole(c,x,y,s,'fr|us|ht',t,sc)` · `flagBadge(c,jenis,x,y,label,t,sc)`.

## Scene jadi
`stormScene(c,t)` badai (waktu zoom & petir tetap di 0–6,6 detik) dan `spiceHook(c,t)` (6,6–11,7). Kalau waktunya beda, geser `t` saat memanggil atau salin dari `examples/4-rempah-maluku.js`.

## Contoh per kebutuhan
Perubahan wilayah bertahap + penghitung tahun: `2-belanda-menjajah` · banjir/es/penampang: `1-ribuan-pulau` · kota terbakar, tulisan tangan, stempel reveal: `3-batavia` · rute panjang, kontrak: `4-rempah-maluku` · pipa air, pelabuhan, slider dulu vs sekarang: `5-singapura` · wilayah custom, negosiasi, sebelum/sesudah: `6-louisiana`.

File `examples/` ditulis sebelum skill ini ada, jadi tiap file membawa `projector`, kadang `DUR`, dari versi lamanya. Salin scene-nya saja, bukan seluruh file.
