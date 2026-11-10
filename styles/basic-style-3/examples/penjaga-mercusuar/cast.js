// Character sheet.
import * as THREE from "three";
import { M, sph, box, cyl, group, mesh, ink } from "./kit.js";

const buttons = (col = 0xd8ae4c) => (a) => {
  for (let i = 0; i < 3; i++) { const b = sph(0.03, M(col, { r: 0.3, m: 0.8 }), 0, a.torsoTop - 0.34 - i * 0.2, 0.405 - i * 0.002, a.body, { cast: false }); b.scale.z = 0.5; }
};
const raincoat = (a) => {
  // yellow slicker: dark button strip + pockets
  box(0.05, 0.75, 0.02, M(0x9b7b18, { r: 0.6 }), 0, a.torsoTop - 0.6, 0.405, a.body, { cast: false });
  for (let i = 0; i < 3; i++) { const b = sph(0.028, M(0x222018, { r: 0.4 }), 0, a.torsoTop - 0.34 - i * 0.2, 0.42, a.body, { cast: false }); b.scale.z = 0.5; }
};
const police = (a) => {
  buttons(0xe0be62)(a);
  const b = box(0.1, 0.1, 0.012, M(0xe0be62, { r: 0.28, m: 0.8 }), 0.2, a.torsoTop - 0.44, 0.355, a.body, { cast: false }); b.rotation.y = 0.5;
  const belt = mesh(new THREE.TorusGeometry(0.405, 0.03, 8, 40), M(0x15120e, { r: 0.4 }), 0, a.hip + 0.32, 0, a.body, { cast: false }); belt.rotation.x = Math.PI / 2;
};

export const CAST = {
  keeper: { seed: 3, skin: 0xe2ad80, top: 0xe8b91e, sleeve: 0xe8b91e, bottom: 0x253349, hair: 0xb9b3a8, hairStyle: "none", hat: "beanie", hatColor: 0xb7362b, beard: true, moustache: true, moustacheColor: 0xe9e4d8, shoe: 0x20160e, collar: 0xe8b91e, details: [raincoat], browColor: 0x8f897e },
  boss: { seed: 7, skin: 0xd59a68, top: 0x262b33, sleeve: 0x262b33, bottom: 0x1a1d22, hair: 0x1c1512, moustache: true, tie: 0xb8241c, seed2: 1, collar: 0xf6f1e4 },
  staff: [
    { seed: 11, skin: 0x9e6a43, top: 0x3e7a58, bottom: 0x2b2a33, hair: 0x1b1310, hairStyle: "bob", collar: 0xf6f1e4 },
    { seed: 13, skin: 0xedc8a0, top: 0x2f5b8c, bottom: 0x2c2a2a, hair: 0x54321c, glasses: true, tie: 0x8c6d1f },
    { seed: 17, skin: 0xc48a58, top: 0xb84e30, bottom: 0x2f2a28, hair: 0x18120f, hairStyle: "bob", collar: 0xf0e6cf },
    { seed: 19, skin: 0xe3b48a, top: 0x6b4e8a, bottom: 0x252326, hair: null, hairStyle: "bald", tie: 0x1e2a44 },
  ],
  fisher1: { seed: 23, skin: 0xa8703f, top: 0x35607a, bottom: 0x2d2a26, hair: 0x18120f, hat: "fisher", hatColor: 0xcc9b3d, collar: null },
  fisher2: { seed: 29, skin: 0xc48a58, top: 0x8c3b2c, bottom: 0x2a2a30, hair: 0x241813, hat: "beanie", hatColor: 0x2f4a60, moustache: true, collar: null },
  officer1: { seed: 31, skin: 0x9c6438, top: 0x557d5f, sleeve: 0x557d5f, bottom: 0x3c5a44, hair: 0x14100d, hat: "officer", collar: 0x263a2c, details: [police] },
  officer2: { seed: 37, skin: 0xe0ae80, top: 0x557d5f, sleeve: 0x557d5f, bottom: 0x3c5a44, hair: 0x3a2415, hat: "officer", moustache: true, collar: 0x263a2c, details: [police] },
  customs: { seed: 41, skin: 0xd8a578, top: 0xe9e4d6, sleeve: 0xe9e4d6, bottom: 0x1f2a3e, hair: 0x241813, hat: "harbor", tie: 0x1c2a44, glasses: true, collar: 0xe9e4d6, details: [buttons(0xc9a94a)] },
  harbormaster: { seed: 43, skin: 0xc9905e, top: 0x20304a, sleeve: 0x20304a, bottom: 0x18233a, hair: 0x332016, hat: "harbor", hatColor: 0xeee7d6, moustache: true, tie: 0xc29a3a, collar: 0xf6f1e4, details: [buttons(0xd8ae4c)] },
  police1: { seed: 47, skin: 0xb07a4a, top: 0x34507a, sleeve: 0x34507a, bottom: 0x24375a, hair: 0x14100d, hat: "officer", hatColor: 0x18202e, collar: 0x151c28, details: [police] },
  police2: { seed: 53, skin: 0xe4b48c, top: 0x34507a, sleeve: 0x34507a, bottom: 0x24375a, hair: 0x2c1c12, hat: "officer", hatColor: 0x18202e, collar: 0x151c28, details: [police] },
  sailor: { seed: 59, skin: 0xbf8552, top: 0xf0ece0, sleeve: 0x2a3e60, bottom: 0x22304a, hair: 0x2c1c12, hat: "beanie", hatColor: 0x223552, collar: 0x2a3e60 },
};
