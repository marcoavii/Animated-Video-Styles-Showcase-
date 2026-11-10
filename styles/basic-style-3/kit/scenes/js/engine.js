// HDR render pipeline: scene -> AO + ink edges -> DOF -> shot mix -> sub-frame accumulation (true motion blur) -> bloom -> grade.
// Every frame is a pure function of time, so the render is frame-exact and repeatable.
import * as THREE from "three";

const VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;

function pass(fs, uniforms, opts = {}) {
  return new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...opts });
}

const AO_FS = `
precision highp float; varying vec2 vUv;
uniform sampler2D tDepth; uniform mat4 proj; uniform mat4 invProj; uniform vec2 res; uniform float radius; uniform float seed;
vec3 vp(vec2 uv){ float d=texture2D(tDepth,uv).x; vec4 c=vec4(uv*2.-1.,d*2.-1.,1.); vec4 v=invProj*c; return v.xyz/v.w; }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715)))); }
void main(){
  float d=texture2D(tDepth,vUv).x; if(d>=.99999){ gl_FragColor=vec4(1.); return; }
  vec3 P=vp(vUv); vec3 N=normalize(cross(dFdx(P),dFdy(P)));
  float rpx=radius*proj[1][1]*.5/max(.1,-P.z);
  rpx=clamp(rpx,.002,.12);
  float a0=ign(gl_FragCoord.xy)*6.2831; float occ=0.; const int S=18;
  for(int i=0;i<S;i++){
    float f=(float(i)+.5)/float(S); float a=a0+f*6.2831*5.; float r=rpx*sqrt(f);
    vec2 o=vec2(cos(a),sin(a))*r*vec2(res.y/res.x,1.);
    vec3 Q=vp(vUv+o); vec3 v=Q-P; float vv=dot(v,v); float vn=dot(v,N)-.015*-P.z*.05;
    float fall=clamp(1.-vv/(radius*radius*1.6),0.,1.);
    occ+=max(0.,vn)/(vv+.008)*fall;
  }
  occ=clamp(1.-occ*radius*1.15/float(S),0.,1.);
  gl_FragColor=vec4(occ,occ,occ,1.);
}`;

const AOBLUR_FS = `
precision highp float; varying vec2 vUv;
uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 px; uniform float near; uniform float far;
float lz(float d){ return (2.*near*far)/(far+near-(d*2.-1.)*(far-near)); }
void main(){
  float z0=lz(texture2D(tDepth,vUv).x); float s=0.,w=0.;
  for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){
    vec2 uv=vUv+vec2(float(x),float(y))*px;
    float z=lz(texture2D(tDepth,uv).x); float k=exp(-abs(z-z0)*14./max(.5,z0));
    s+=texture2D(tAO,uv).r*k; w+=k;
  }
  gl_FragColor=vec4(vec3(s/w),1.);
}`;

const COMP_FS = `
precision highp float; varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 px; uniform float near; uniform float far;
uniform float aoStrength; uniform float edge; uniform vec3 edgeColor;
float lz(float d){ return (2.*near*far)/(far+near-(d*2.-1.)*(far-near)); }
void main(){
  vec4 c=texture2D(tColor,vUv);
  float ao=mix(1.,texture2D(tAO,vUv).r,aoStrength);
  vec3 col=c.rgb*ao;
  float z=lz(texture2D(tDepth,vUv).x);
  vec2 o=px*1.15;
  float zl=lz(texture2D(tDepth,vUv-vec2(o.x,0.)).x), zr=lz(texture2D(tDepth,vUv+vec2(o.x,0.)).x);
  float zd=lz(texture2D(tDepth,vUv-vec2(0.,o.y)).x), zu=lz(texture2D(tDepth,vUv+vec2(0.,o.y)).x);
  float lap=abs(zl+zr-2.*z)+abs(zu+zd-2.*z);
  float e=smoothstep(.006,.03,lap/max(z,.5));
  e*=smoothstep(far*.45,far*.05,z);
  col=mix(col,col*edgeColor,e*edge);
  gl_FragColor=vec4(col,1.);
}`;

const DOF_FS = `
precision highp float; varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float near; uniform float far; uniform float focus; uniform float aperture; uniform float maxBlur;
float lz(float d){ return (2.*near*far)/(far+near-(d*2.-1.)*(far-near)); }
float coc(float z){ return clamp(max(0.,abs(z-focus)/max(z,.01)-.1)*aperture,0.,maxBlur); }
void main(){
  float z0=lz(texture2D(tDepth,vUv).x); float c0=coc(z0);
  vec3 s=texture2D(tColor,vUv).rgb; float w=1.;
  const int N=48; const float GA=2.39996;
  vec2 asp=vec2(res.y/res.x,1.);
  for(int i=1;i<N;i++){
    float r=sqrt(float(i)/float(N))*maxBlur; float a=float(i)*GA;
    vec2 uv=vUv+vec2(cos(a),sin(a))*r*asp;
    float z=lz(texture2D(tDepth,uv).x); float c=coc(z);
    float use=z<z0 ? c : min(c,c0*2.);
    float k=smoothstep(r-.0015,r+.0015,use+.0004);
    vec3 v=texture2D(tColor,uv).rgb;
    s+=v*k; w+=k;
  }
  gl_FragColor=vec4(s/w,1.);
}`;

const MIX_FS = `
precision highp float; varying vec2 vUv; uniform sampler2D a; uniform sampler2D b; uniform float m; uniform float w;
void main(){ vec3 c=mix(texture2D(a,vUv).rgb,texture2D(b,vUv).rgb,m); gl_FragColor=vec4(c*w,w); }`;

const DOWN_FS = `
precision highp float; varying vec2 vUv; uniform sampler2D t; uniform vec2 px; uniform float thresh;
vec3 S(vec2 o){ return min(texture2D(t,vUv+o*px).rgb,vec3(40.)); }
void main(){
  vec3 A=S(vec2(-2,2)),B=S(vec2(0,2)),C=S(vec2(2,2)),D=S(vec2(-2,0)),E=S(vec2(0,0)),F=S(vec2(2,0)),G=S(vec2(-2,-2)),H=S(vec2(0,-2)),I=S(vec2(2,-2));
  vec3 J=S(vec2(-1,1)),K=S(vec2(1,1)),L=S(vec2(-1,-1)),M=S(vec2(1,-1));
  vec3 c=E*.125+(A+C+G+I)*.03125+(B+D+F+H)*.0625+(J+K+L+M)*.125;
  if(thresh>0.){ float l=max(c.r,max(c.g,c.b)); float k=smoothstep(thresh*.6,thresh*1.4,l); c*=k; }
  gl_FragColor=vec4(c,1.);
}`;

const UP_FS = `
precision highp float; varying vec2 vUv; uniform sampler2D t; uniform sampler2D prev; uniform vec2 px; uniform float mixv;
void main(){
  vec3 s=vec3(0.);
  s+=texture2D(t,vUv+vec2(-1,1)*px).rgb+texture2D(t,vUv+vec2(1,1)*px).rgb+texture2D(t,vUv+vec2(-1,-1)*px).rgb+texture2D(t,vUv+vec2(1,-1)*px).rgb;
  s+=(texture2D(t,vUv+vec2(0,1)*px).rgb+texture2D(t,vUv+vec2(0,-1)*px).rgb+texture2D(t,vUv+vec2(-1,0)*px).rgb+texture2D(t,vUv+vec2(1,0)*px).rgb)*2.;
  s+=texture2D(t,vUv).rgb*4.;
  gl_FragColor=vec4(texture2D(prev,vUv).rgb+s/16.*mixv,1.);
}`;

const FINAL_FS = `
precision highp float; varying vec2 vUv;
uniform sampler2D tHDR; uniform sampler2D tBloom; uniform float bloom; uniform float exposure; uniform vec3 tint; uniform vec3 lift; uniform float gamma; uniform float sat; uniform float vignette; uniform float grain; uniform float ca; uniform float frame; uniform vec3 fadeColor; uniform float fade; uniform float contrast;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+frame*.73)*43758.5453); }
void main(){
  vec2 d=vUv-.5; float rr=dot(d,d);
  vec2 o=d*rr*ca;
  vec3 c=vec3(texture2D(tHDR,vUv+o).r,texture2D(tHDR,vUv).g,texture2D(tHDR,vUv-o).b);
  vec3 bl=vec3(texture2D(tBloom,vUv+o).r,texture2D(tBloom,vUv).g,texture2D(tBloom,vUv-o).b);
  c+=bl*bloom;
  c*=exposure*tint;
  c=aces(c*.72);
  float l=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(l),c,sat);
  c=(c-.5)*contrast+.5;
  c=max(c,0.)+lift*(1.-clamp(c,0.,1.));
  c=pow(max(c,0.),vec3(1./gamma));
  c*=1.-vignette*smoothstep(.08,.62,rr*1.25);
  c=pow(max(c,0.),vec3(1./2.2));
  float g=rnd(vUv*vec2(1920.,1080.))-.5;
  c+=g*grain*(1.-.5*l);
  c=mix(c,fadeColor,fade);
  c+=(rnd(vUv*917.)-.5)/255.;
  gl_FragColor=vec4(c,1.);
}`;

export const DEFAULT_GRADE = { exposure: 1, tint: [1, 1, 1], lift: [0, 0, 0], gamma: 1, sat: 1.06, vignette: 0.42, bloom: 0.55, thresh: 0.9, contrast: 1.05, ao: 0.85, edge: 0.75, edgeColor: [0.12, 0.09, 0.08], grain: 0.022, ca: 0.016 };

function mixGrade(a, b, m) {
  const o = {};
  for (const k in a) {
    const x = a[k], y = b[k];
    o[k] = Array.isArray(x) ? x.map((v, i) => v + (y[i] - v) * m) : x + (y - x) * m;
  }
  return o;
}

export class Engine {
  constructor(canvas, w, h) {
    this.w = w; this.h = h;
    const r = (this.r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true, alpha: false }));
    r.setPixelRatio(1); r.setSize(w, h, false);
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = true;
    const hdr = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    const depth = new THREE.DepthTexture(w, h, THREE.FloatType); depth.format = THREE.DepthFormat; depth.internalFormat = "DEPTH_COMPONENT32F";
    depth.minFilter = depth.magFilter = THREE.NearestFilter;
    this.sceneRT = new THREE.WebGLRenderTarget(w, h, { ...hdr, depthBuffer: true, depthTexture: depth, samples: 4 });
    const hw = w >> 1, hh = h >> 1;
    this.aoRT = new THREE.WebGLRenderTarget(hw, hh, { ...hdr, type: THREE.UnsignedByteType });
    this.aoBlurRT = new THREE.WebGLRenderTarget(hw, hh, { ...hdr, type: THREE.UnsignedByteType });
    this.compRT = new THREE.WebGLRenderTarget(w, h, hdr);
    this.shotA = new THREE.WebGLRenderTarget(w, h, hdr);
    this.shotB = new THREE.WebGLRenderTarget(w, h, hdr);
    this.accum = new THREE.WebGLRenderTarget(w, h, hdr);
    this.mips = [];
    let mw = hw, mh = hh;
    for (let i = 0; i < 6; i++) {
      this.mips.push({ down: new THREE.WebGLRenderTarget(mw, mh, hdr), up: new THREE.WebGLRenderTarget(mw, mh, hdr), w: mw, h: mh });
      mw = Math.max(2, mw >> 1); mh = Math.max(2, mh >> 1);
    }
    this.black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); this.black.needsUpdate = true;

    this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.tri = new THREE.Mesh(g); this.tri.frustumCulled = false;
    this.fsScene = new THREE.Scene(); this.fsScene.add(this.tri);

    const v2 = (x, y) => new THREE.Vector2(x, y);
    this.mAO = pass(AO_FS, { tDepth: { value: depth }, proj: { value: new THREE.Matrix4() }, invProj: { value: new THREE.Matrix4() }, res: { value: v2(w, h) }, radius: { value: 0.7 }, seed: { value: 0 } });
    this.mAOB = pass(AOBLUR_FS, { tAO: { value: null }, tDepth: { value: depth }, px: { value: v2(1 / hw, 1 / hh) }, near: { value: 0.1 }, far: { value: 100 } });
    this.mComp = pass(COMP_FS, { tColor: { value: null }, tAO: { value: null }, tDepth: { value: depth }, px: { value: v2(1 / w, 1 / h) }, near: { value: 0.1 }, far: { value: 100 }, aoStrength: { value: 1 }, edge: { value: 1 }, edgeColor: { value: new THREE.Color() } });
    this.mDOF = pass(DOF_FS, { tColor: { value: null }, tDepth: { value: depth }, res: { value: v2(w, h) }, near: { value: 0.1 }, far: { value: 100 }, focus: { value: 5 }, aperture: { value: 0.02 }, maxBlur: { value: 0.012 } });
    this.mCopy = pass(`precision highp float; varying vec2 vUv; uniform sampler2D t; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb,1.);} `, { t: { value: null } });
    this.mAdd = pass(MIX_FS, { a: { value: null }, b: { value: null }, m: { value: 0 }, w: { value: 1 } }, { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, transparent: true });
    this.mDown = pass(DOWN_FS, { t: { value: null }, px: { value: v2(1, 1) }, thresh: { value: 0 } });
    this.mUp = pass(UP_FS, { t: { value: null }, prev: { value: null }, px: { value: v2(1, 1) }, mixv: { value: 1 } });
    this.mFinal = pass(FINAL_FS, {
      tHDR: { value: this.accum.texture }, tBloom: { value: null }, bloom: { value: 0.5 }, exposure: { value: 1 }, tint: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3() }, gamma: { value: 1 }, sat: { value: 1 }, vignette: { value: 0.4 }, grain: { value: 0.02 }, ca: { value: 0.02 }, frame: { value: 0 }, fadeColor: { value: new THREE.Vector3() }, fade: { value: 0 }, contrast: { value: 1 },
    });
    this.clearC = new THREE.Color(0, 0, 0);
  }

  _fs(mat, target) {
    this.tri.material = mat;
    this.r.setRenderTarget(target);
    this.r.render(this.fsScene, this.fsCam);
  }

  // Render one camera view of one set, in HDR, into `out`.
  renderView(scene, cam, look, out) {
    const r = this.r, u = this.mAO.uniforms;
    r.setRenderTarget(this.sceneRT); r.clear(); r.render(scene, cam);
    u.proj.value.copy(cam.projectionMatrix); u.invProj.value.copy(cam.projectionMatrixInverse);
    u.radius.value = look.aoRadius ?? 0.7;
    this._fs(this.mAO, this.aoRT);
    const ub = this.mAOB.uniforms; ub.tAO.value = this.aoRT.texture; ub.near.value = cam.near; ub.far.value = cam.far;
    this._fs(this.mAOB, this.aoBlurRT);
    const uc = this.mComp.uniforms;
    uc.tColor.value = this.sceneRT.texture; uc.tAO.value = this.aoBlurRT.texture; uc.near.value = cam.near; uc.far.value = cam.far;
    uc.aoStrength.value = look.ao; uc.edge.value = look.edge; uc.edgeColor.value.setRGB(...look.edgeColor);
    const dof = look.dof;
    if (dof && dof.aperture > 0) {
      this._fs(this.mComp, this.compRT);
      const ud = this.mDOF.uniforms;
      ud.tColor.value = this.compRT.texture; ud.near.value = cam.near; ud.far.value = cam.far;
      ud.focus.value = dof.focus; ud.aperture.value = dof.aperture; ud.maxBlur.value = dof.maxBlur ?? 0.012;
      this._fs(this.mDOF, out);
    } else {
      this._fs(this.mComp, out);
    }
  }

  clearAccum() {
    this.r.setRenderTarget(this.accum);
    this.r.setClearColor(0x000000, 1); this.r.clear();
  }

  addSample(rtA, rtB, m, weight) {
    const u = this.mAdd.uniforms;
    u.a.value = rtA.texture; u.b.value = (rtB || rtA).texture; u.m.value = m; u.w.value = weight;
    this.r.autoClear = false;
    this._fs(this.mAdd, this.accum);
    this.r.autoClear = true;
  }

  finish(grade, frame, fade = 0, fadeColor = [0, 0, 0]) {
    let src = this.accum.texture;
    const mips = this.mips;
    mips.forEach((m, i) => {
      const u = this.mDown.uniforms;
      const prevW = i === 0 ? this.w : mips[i - 1].w, prevH = i === 0 ? this.h : mips[i - 1].h;
      u.t.value = src; u.px.value.set(1 / prevW, 1 / prevH); u.thresh.value = i === 0 ? grade.thresh : 0;
      this._fs(this.mDown, m.down);
      src = m.down.texture;
    });
    let up = this.black;
    for (let i = mips.length - 1; i >= 0; i--) {
      const u = this.mUp.uniforms;
      const srcT = i === mips.length - 1 ? mips[i].down.texture : mips[i + 1].up.texture;
      const w = i === mips.length - 1 ? mips[i].w : mips[i + 1].w, h = i === mips.length - 1 ? mips[i].h : mips[i + 1].h;
      u.t.value = srcT; u.prev.value = mips[i].down.texture; u.px.value.set(1 / w, 1 / h); u.mixv.value = i === mips.length - 1 ? 0 : 0.9;
      this._fs(this.mUp, mips[i].up);
    }
    const f = this.mFinal.uniforms;
    f.tBloom.value = mips[0].up.texture;
    f.bloom.value = grade.bloom * 0.28; f.exposure.value = grade.exposure; f.tint.value.set(...grade.tint); f.lift.value.set(...grade.lift);
    f.gamma.value = grade.gamma; f.sat.value = grade.sat; f.vignette.value = grade.vignette; f.grain.value = grade.grain; f.ca.value = grade.ca; f.frame.value = frame % 997; f.contrast.value = grade.contrast;
    f.fade.value = fade; f.fadeColor.value.set(...fadeColor);
    this.tri.material = this.mFinal;
    this.r.setRenderTarget(null);
    this.r.render(this.fsScene, this.fsCam);
  }
}

export { mixGrade };
