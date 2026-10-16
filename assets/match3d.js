/* BOOST MANAGER - Partida 3D simulada (3v3, IA a jogar). Three.js r149. */
(function () {
'use strict';
// 1 unidade = 100 uu do jogo original. x = largura, y = altura, z = comprimento.
const HX = 40.96, HZ = 51.2, HY = 10.22, RC = 3.4, GW = 8.93, GH = 6.42, GD = 8.8;
const BR = 0.9125, GRAV = 6.5, CH = 0.34, BALL_MAX = 60, CAR_MAX = 23;
const HB = [1.0, 0.3, 0.72];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
let THREE = null, S = null;
function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return { enabled: false };
  const ctx = new AC();
  const master = ctx.createGain(); master.gain.value = 0.18; master.connect(ctx.destination);
  const noise = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.28)), ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return { enabled: true, ctx, master, noise, lim: {} };
}
function sfx(kind, pwr) {
  if (!S || !S.audio || !S.audio.enabled) return;
  const a = S.audio, ctx = a.ctx;
  if (ctx.state === 'suspended') return;
  const now = ctx.currentTime, lim = a.lim;
  const cool = { boost: 0.06, ballHit: 0.025, ballWall: 0.06, land: 0.08, padSmall: 0.06, padBig: 0.08, demo: 0.2, goal: 0.3 };
  const cd = cool[kind] || 0;
  if ((lim[kind] || 0) > now) return;
  lim[kind] = now + cd;
  const v = clamp(pwr || 1, 0.1, 2.2);
  const tone = (type, f0, f1, dur, vol) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(a.master); o.start(now); o.stop(now + dur + 0.01);
  };
  const burst = (dur, vol, hp) => {
    const n = ctx.createBufferSource(), h = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = a.noise; h.type = 'highpass'; h.frequency.value = hp;
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    n.connect(h); h.connect(g); g.connect(a.master); n.start(now); n.stop(now + dur + 0.01);
  };
  if (kind === 'boost') tone('sawtooth', 180 + 70 * v, 230 + 120 * v, 0.06, 0.018 + 0.01 * v);
  else if (kind === 'padSmall') { tone('square', 420, 620, 0.08, 0.03 * v); tone('triangle', 260, 380, 0.08, 0.02 * v); }
  else if (kind === 'padBig') { tone('square', 320, 700, 0.12, 0.05 * v); tone('sawtooth', 180, 300, 0.14, 0.035 * v); }
  else if (kind === 'ballHit') { tone('triangle', 130 + 80 * v, 80 + 45 * v, 0.09, 0.045 * v); burst(0.03, 0.02 * v, 1400); }
  else if (kind === 'ballWall') { tone('square', 90 + 40 * v, 50 + 20 * v, 0.08, 0.03 * v); burst(0.02, 0.016 * v, 1800); }
  else if (kind === 'land') { tone('triangle', 120, 42, 0.11, 0.035 * v); burst(0.04, 0.022 * v, 900); }
  else if (kind === 'demo') { burst(0.22, 0.11 * v, 120); tone('sawtooth', 170, 48, 0.22, 0.08 * v); }
  else if (kind === 'goal') { burst(0.35, 0.12 * v, 80); tone('sawtooth', 260, 55, 0.42, 0.09 * v); tone('square', 540, 240, 0.2, 0.05 * v); }
}

/* ---------- Arena: distancia assinada + normal (fisica) ---------- */
const SF = { d: 0, nx: 0, ny: 1, nz: 0 };
function surf(x, y, z) {
  const az = Math.abs(z);
  if (Math.abs(x) < GW && y < GH && az > HZ - RC) {
    const sz = z < 0 ? -1 : 1;
    let best = GW - x, nx = -1, ny = 0, nz = 0, d;
    d = x + GW; if (d < best) { best = d; nx = 1; ny = 0; nz = 0; }
    d = GH - y; if (d < best) { best = d; nx = 0; ny = -1; nz = 0; }
    d = y; if (d < best) { best = d; nx = 0; ny = 1; nz = 0; }
    d = HZ + GD - az; if (d < best) { best = d; nx = 0; ny = 0; nz = -sz; }
    SF.d = best; SF.nx = nx; SF.ny = ny; SF.nz = nz; return;
  }
  const ix = HX - RC, iy = HY - RC, iz = HZ - RC, qy = y - HY;
  const dx = x - clamp(x, -ix, ix), dy = qy - clamp(qy, -iy, iy), dz = z - clamp(z, -iz, iz);
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (l > 1e-6) { SF.d = RC - l; SF.nx = -dx / l; SF.ny = -dy / l; SF.nz = -dz / l; return; }
  let best = HX - Math.abs(x), nx = x > 0 ? -1 : 1, ny = 0, nz = 0, d;
  d = HY - Math.abs(qy); if (d < best) { best = d; nx = 0; ny = qy > 0 ? -1 : 1; nz = 0; }
  d = HZ - az; if (d < best) { best = d; nx = 0; ny = 0; nz = z > 0 ? -1 : 1; }
  SF.d = best; SF.nx = nx; SF.ny = ny; SF.nz = nz;
}

/* ---------- Bola ---------- */
function stepBall(b, dt, mute) {
  b.vy -= GRAV * dt;
  const dr = Math.exp(-0.03 * dt);
  b.vx *= dr; b.vy *= dr; b.vz *= dr;
  b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  surf(b.x, b.y, b.z);
  if (SF.d < BR) {
    const pen = BR - SF.d;
    b.x += SF.nx * pen; b.y += SF.ny * pen; b.z += SF.nz * pen;
    const vn = b.vx * SF.nx + b.vy * SF.ny + b.vz * SF.nz;
    if (vn < 0) {
      const e = -vn < 1.5 ? 0 : 0.6, k = -(1 + e) * vn;
      b.vx += SF.nx * k; b.vy += SF.ny * k; b.vz += SF.nz * k;
      if (!mute && -vn > 1.2) sfx('ballWall', (-vn) / 14);
    }
    const f = Math.exp(-0.25 * dt);
    b.vx *= f; b.vz *= f;
  }
  const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
  if (sp > BALL_MAX) { const k = BALL_MAX / sp; b.vx *= k; b.vy *= k; b.vz *= k; }
}
function predictBall() {
  const b = S.ball, t = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz };
  const arr = [{ t: 0, x: t.x, y: t.y, z: t.z }];
  for (let i = 1; i <= 40; i++) {
    for (let k = 0; k < 6; k++) stepBall(t, 1 / 60, true);
    arr.push({ t: i * 0.1, x: t.x, y: t.y, z: t.z });
  }
  S.pred = arr;
}
function ballAt(tm) {
  const a = S.pred, i = clamp(Math.floor(tm / 0.1), 0, 39), f = clamp((tm - i * 0.1) / 0.1, 0, 1);
  return { x: a[i].x + (a[i + 1].x - a[i].x) * f, y: a[i].y + (a[i + 1].y - a[i].y) * f, z: a[i].z + (a[i + 1].z - a[i].z) * f };
}

/* ---------- Boost pads (layout real) ---------- */
function padLayout() {
  const out = [];
  [[30.72, 40.96], [-30.72, 40.96], [30.72, -40.96], [-30.72, -40.96], [35.84, 0], [-35.84, 0]].forEach(p => out.push({ x: p[0], z: p[1], big: true }));
  const half = [[0, -42.4], [17.92, -41.84], [-17.92, -41.84], [9.4, -33.08], [-9.4, -33.08], [0, -28.16], [35.84, -24.84], [-35.84, -24.84],
    [17.88, -23], [-17.88, -23], [20.48, -10.36], [-20.48, -10.36], [0, -10.24]];
  half.forEach(p => { out.push({ x: p[0], z: p[1], big: false }); out.push({ x: p[0], z: -p[1], big: false }); });
  out.push({ x: 10.24, z: 0, big: false }, { x: -10.24, z: 0, big: false });
  return out;
}

/* ---------- Texturas ---------- */
function canvasTex(w, h, fn, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
function hexPath(g, cx, cy, r) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } g.closePath(); }

/* ---------- Construcao da cena ---------- */
function buildShell() {
  const geo = new THREE.BoxGeometry(2 * HX, 2 * HY, 2 * HZ, 120, 40, 150);
  geo.translate(0, HY, 0);
  const pos = geo.attributes.position, n = pos.count;
  const ix = HX - RC, iy = HY - RC, iz = HZ - RC;
  const col = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const qy = y - HY, cx = clamp(x, -ix, ix), cy = clamp(qy, -iy, iy), cz = clamp(z, -iz, iz);
    const dx = x - cx, dy = qy - cy, dz = z - cz, l = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let ux = 0, uy = 1, uz = 0;
    if (l > 1e-6) { ux = -dx / l; uy = -dy / l; uz = -dz / l; x = cx + dx / l * RC; y = cy + HY + dy / l * RC; z = cz + dz / l * RC; }
    pos.setXYZ(i, x, y, z);
    const floor = uy > 0.9, ceil = uy < -0.9;
    if (floor) c.set(z < 0 ? 0x16356e : 0x6e3a12).lerp(new THREE.Color(0x151a26), clamp(Math.abs(z) < 2 ? 1 : 0, 0, 1) * 0.6);
    else if (ceil) c.set(0x10141f);
    else {
      const h = clamp(y / (2 * HY), 0, 1);
      const side = Math.abs(z) > HZ - 1 ? 0x24324f : 0x3d527a;
      c.set(side).lerp(new THREE.Color(z < 0 ? 0x2b66d8 : 0xd87a2b), (1 - h) * 0.28 * clamp(Math.abs(z) / HZ + 0.3, 0, 1));
      c.multiplyScalar(0.75 + 0.5 * Math.abs(ux));
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const idx = geo.index.array, keep = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], d = idx[i + 2];
    const cx = (pos.getX(a) + pos.getX(b) + pos.getX(d)) / 3, cy = (pos.getY(a) + pos.getY(b) + pos.getY(d)) / 3, cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(d)) / 3;
    if (Math.abs(cx) < GW && cy < GH && Math.abs(cz) > HZ - RC) continue;
    keep.push(a, b, d);
  }
  geo.setIndex(keep);
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  return mesh;
}
function buildArena(scene) {
  scene.add(buildShell());
  const lines = canvasTex(1024, 1280, (g, w, h) => {
    const sx = w / (2 * HX), sz = h / (2 * HZ);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 7.9 * sx, 0, 7); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 1 * sx, 0, 7); g.stroke();
    [0, 1].forEach(e => {
      const y0 = e ? h : 0, s = e ? -1 : 1;
      g.strokeStyle = e ? 'rgba(255,150,60,.8)' : 'rgba(80,150,255,.8)'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(w / 2 - GW * sx, y0); g.lineTo(w / 2 - GW * sx, y0 + s * 9 * sz); g.lineTo(w / 2 + GW * sx, y0 + s * 9 * sz); g.lineTo(w / 2 + GW * sx, y0); g.stroke();
    });
  });
  lines.wrapS = lines.wrapT = THREE.ClampToEdgeWrapping;
  const lp = new THREE.Mesh(new THREE.PlaneGeometry(2 * HX, 2 * HZ).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: lines, transparent: true, depthWrite: false }));
  lp.position.y = 0.04; scene.add(lp);
  const grid = canvasTex(64, 64, g => { g.clearRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64); }, [8, 4]);
  [-1, 1].forEach(s => {
    const col = s < 0 ? 0x2d7bff : 0xff8a2a, z0 = s * (HZ - RC), len = GD + RC;
    const netMat = new THREE.MeshBasicMaterial({ map: grid, color: col, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2 * GW, GH, len), netMat);
    box.position.set(0, GH / 2, z0 + s * len / 2); scene.add(box);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * GW, len).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: s < 0 ? 0x16356e : 0x6e3a12 }));
    fl.position.set(0, 0.01, z0 + s * len / 2); scene.add(fl);
    const glow = new THREE.MeshBasicMaterial({ color: col });
    [-1, 1].forEach(sx => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, GH, 0.5), glow); p.position.set(sx * GW, GH / 2, s * HZ); scene.add(p); });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2 * GW + 0.5, 0.5, 0.5), glow); bar.position.set(0, GH, s * HZ); scene.add(bar);
    const gl = new THREE.PointLight(col, 0.6, 30); gl.position.set(0, 4, s * (HZ - 2)); scene.add(gl);
  });
  // bancadas
  const crowd = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = 'hsl(' + (Math.random() < .5 ? 215 : 25) + ',' + (30 + Math.random() * 50) + '%,' + (25 + Math.random() * 40) + '%)'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  }, [6, 1]);
  const cm = new THREE.MeshBasicMaterial({ map: crowd });
  [[0, -HZ - GD - 6, 0, 2 * HX + 30, 0], [0, HZ + GD + 6, Math.PI, 2 * HX + 30, 0]].forEach(a => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(a[3], 26), cm); m.position.set(a[0], 13, a[1]); m.rotation.set(-0.35, a[2], 0); scene.add(m);
  });
  [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * HZ + 40, 26), cm); m.position.set(s * (HX + 12), 13, 0); m.rotation.set(0, -s * Math.PI / 2, 0); m.rotateX(-0.35); scene.add(m); });
  // luzes de tecto
  const lm = new THREE.MeshBasicMaterial({ color: 0xdfe9ff });
  for (let i = -2; i <= 2; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 30), lm); l.position.set(i * 14, 2 * HY - 0.1, 0); scene.add(l); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x05070c }));
  ground.position.y = -0.3; scene.add(ground);
}
function buildPads(scene) {
  S.pads = padLayout().map(p => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(p.big ? 1.5 : 0.6, p.big ? 1.5 : 0.6, 0.06, 6), new THREE.MeshBasicMaterial({ color: 0xffc233 }));
    g.add(base);
    let orb = null;
    if (p.big) { orb = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd56a, transparent: true, opacity: 0.85 })); orb.position.y = 1.2; g.add(orb); }
    g.position.set(p.x, 0.07, p.z); scene.add(g);
    return { x: p.x, z: p.z, big: p.big, amt: p.big ? 100 : 12, cd: p.big ? 10 : 4, t: 0, base, orb };
  });
}
function buildBall(scene) {
  const tex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#e9eef5'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1b2433'; g.lineWidth = 3;
    for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) { hexPath(g, x * 44 + (y % 2 ? 22 : 0), y * 44 + 10, 21); g.stroke(); if ((x + y) % 3 === 0) { g.fillStyle = '#7fb0ff'; g.fill(); } }
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 32, 24), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.1 }));
  scene.add(m); S.ballMesh = m;
}
function nameSprite(name, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(8, 8, 240, 48);
  g.fillStyle = color; g.fillText(name.slice(0, 14), 128, 44);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  s.scale.set(4, 1, 1); s.position.set(0, 1.6, 0); return s;
}
function buildCarMesh(team, name) {
  const col = team === 0 ? 0x1e6bff : 0xff7a1a, g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.5, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c1018, metalness: 0.2, roughness: 0.5 });
  const sh = new THREE.Shape();
  [[-1, -0.1], [1, -0.1], [1, 0.1], [0.65, 0.17], [0.25, 0.2], [-0.3, 0.2], [-0.75, 0.18], [-1, 0.15]].forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }).translate(0, 0, -0.6), mat); g.add(body);
  const cb = new THREE.Shape();
  [[-0.55, 0.2], [-0.15, 0.37], [0.2, 0.36], [0.45, 0.2]].forEach((p, i) => i ? cb.lineTo(p[0], p[1]) : cb.moveTo(p[0], p[1]));
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(cb, { depth: 0.95, bevelEnabled: false }).translate(0, 0, -0.475), dark));
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 1.2), mat); wing.position.set(-0.95, 0.3, 0); g.add(wing);
  [-0.4, 0.4].forEach(z => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), dark); s.position.set(-0.95, 0.23, z); g.add(s); });
  [[0.65, 0.7], [0.65, -0.7], [-0.65, 0.7], [-0.65, -0.7]].forEach(p => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 16).rotateX(Math.PI / 2), dark); w.position.set(p[0], -0.12, p[1]); g.add(w);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.21, 10).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc9d2e0, metalness: 0.9, roughness: 0.2 })); r.position.copy(w.position); g.add(r);
  });
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6c0 }), tl = new THREE.MeshBasicMaterial({ color: 0xff2030 });
  [-0.4, 0.4].forEach(z => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.2), hl); a.position.set(1.0, 0.04, z); g.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.25), tl); b.position.set(-1.0, 0.1, z); g.add(b); });
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 10).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.85 }));
  fl.position.set(-1.8, 0, 0); fl.visible = false; g.add(fl);
  g.add(nameSprite(name, team === 0 ? '#8fb8ff' : '#ffc08a'));
  g.userData.flame = fl;
  return g;
}

/* ---------- Carros ---------- */
const V = () => new THREE.Vector3();
function makeCar(team, idx, name, skill) {
  const c = {
    team, idx, name, skill, atk: team === 0 ? 1 : -1, p: V(), v: V(), f: V(), u: V(), r: V(), boost: 33,
    ctl: { thr: 0, steer: 0, boost: false, jump: false, dodge: null, aim: null }, flipT: 0, flipAxis: V(), flipRate: 0, usedFlip: false, sinceJump: 9,
    dodgeAt: -1, dodgeDir: null, dead: false, respT: 0, touchCd: 0, hitFlip: false, boosting: false, role: 'support', roleT: 0,
    stuckT: 0, unstick: 0, aer: false, aerT: 0, wallDragT: 0, wallX: 0, wallZ: 0, speedFlipCd: 0, flipResetCd: 0, mechMsgCd: 0,
    wasGround: true, boostSfxT: 0,
    noise: 0, noiseT: 0, mesh: buildCarMesh(team, name),
    st: { goals: 0, shots: 0, touches: 0, demos: 0, pads: 0, speedflips: 0, resets: 0, walldrags: 0 }
  };
  S.scene.add(c.mesh);
  return c;
}
function placeCar(c, x, z) {
  c.p.set(x, CH, z); c.v.set(0, 0, 0); c.f.set(0, 0, c.atk); c.u.set(0, 1, 0); c.r.crossVectors(c.f, c.u);
  c.flipT = 0; c.usedFlip = false; c.sinceJump = 9; c.aer = false; c.aerT = 0; c.wallDragT = 0; c.dodgeAt = -1; c.dead = false; c.mesh.visible = true; c.boost = 33; c.unstick = 0;
  c.speedFlipCd = 0; c.flipResetCd = 0; c.mechMsgCd = 0; c.wasGround = true; c.boostSfxT = 0;
  c.ctl.thr = 0; c.ctl.steer = 0; c.ctl.boost = false; c.ctl.jump = false; c.ctl.dodge = null; c.ctl.aim = null;
}
let _mat, _ax, _t, _d, _n;
function initTemps() { _mat = new THREE.Matrix4(); _ax = V(); _t = V(); _d = V(); _n = V(); }
function rotAll(c, axis, ang) { _ax.copy(axis); c.f.applyAxisAngle(_ax, ang); c.u.applyAxisAngle(_ax, ang); }
function orthoCar(c) { c.f.normalize(); c.u.addScaledVector(c.f, -c.u.dot(c.f)).normalize(); c.r.crossVectors(c.f, c.u); }
function airOrient(c, aim, dt) {
  const maxA = 5.5 * dt;
  if (aim) {
    const ang = Math.acos(clamp(c.f.dot(aim), -1, 1));
    if (ang > 1e-3) { _t.crossVectors(c.f, aim); if (_t.lengthSq() < 1e-8) _t.copy(c.u); else _t.normalize(); rotAll(c, _t, Math.min(ang, maxA)); }
  }
  _t.set(0, 1, 0); _t.addScaledVector(c.f, -c.f.dot(_t));
  if (_t.lengthSq() > 1e-4) {
    _t.normalize(); const a = Math.acos(clamp(c.u.dot(_t), -1, 1)); _d.crossVectors(c.u, _t);
    rotAll(c, c.f.clone(), (_d.dot(c.f) >= 0 ? 1 : -1) * Math.min(a, maxA));
  }
  orthoCar(c);
}
function startFlip(c, fwd, side) {
  _d.set(0, 0, 0).addScaledVector(c.f, fwd).addScaledVector(c.r, side); _d.y = 0;
  if (_d.lengthSq() > 1e-4) { _d.normalize(); c.v.addScaledVector(_d, 5.0); }
  c.flipT = 0.45; c.usedFlip = true; c.hitFlip = false;
  if (Math.abs(fwd) >= Math.abs(side)) { c.flipAxis.copy(c.r); c.flipRate = (fwd > 0 ? -1 : 1) * Math.PI * 2 / 0.45; }
  else { c.flipAxis.copy(c.f); c.flipRate = (side > 0 ? 1 : -1) * Math.PI * 2 / 0.45; }
}
function stepCar(c, dt) {
  if (c.dead) { c.respT -= dt; if (c.respT <= 0) respawnCar(c); return; }
  const k = c.ctl;
  c.touchCd -= dt; c.sinceJump += dt;
  c.speedFlipCd -= dt; c.flipResetCd -= dt; c.mechMsgCd -= dt;
  if (c.wallDragT > 0) c.wallDragT -= dt;
  if (c.flipT > 0) { c.flipT -= dt; rotAll(c, c.flipAxis.clone(), c.flipRate * dt); orthoCar(c); }
  if (c.dodgeAt >= 0) { c.dodgeAt -= dt; if (c.dodgeAt < 0 && !c.usedFlip && c.sinceJump < 1.25) { startFlip(c, c.dodgeDir[0], c.dodgeDir[1]); c.dodgeDir = null; } }
  surf(c.p.x, c.p.y, c.p.z);
  const nx = SF.nx, ny = SF.ny, nz = SF.nz, d = SF.d;
  const vn = c.v.x * nx + c.v.y * ny + c.v.z * nz;
  const grounded = d < CH + 0.12 && ny > -0.35 && vn < 2 && c.flipT <= 0;
  const wasGround = c.wasGround;
  const boosting = k.boost && c.boost > 0;
  c.boosting = boosting;
  if (grounded) {
    c.usedFlip = false; c.aer = false;
    _n.set(nx, ny, nz);
    const a = c.u.angleTo(_n);
    if (a > 1e-4) { c.u.lerp(_n, Math.min(1, 16 * dt)).normalize(); }
    c.f.addScaledVector(c.u, -c.f.dot(c.u)).normalize(); c.r.crossVectors(c.f, c.u);
    let vf = c.v.dot(c.f), vl = c.v.dot(c.r);
    const gx = -c.u.y * 0 , gTf = -GRAV * c.f.y, gTr = -GRAV * c.r.y;
    vf += gTf * dt; vl += gTr * dt;
    let acc = 0;
    if (k.thr > 0) { acc = vf < 0 ? 35 : 16 * (1 - clamp(vf / 14.1, 0, 1)); }
    else if (k.thr < 0) { acc = vf > 0 ? -35 : -16 * (1 - clamp(-vf / 14.1, 0, 1)); }
    else { const dr = 5.25 * dt; vf = Math.abs(vf) < dr ? 0 : vf - Math.sign(vf) * dr; }
    vf += acc * dt;
    if (boosting) { vf += 9.91 * dt; c.boost -= 33.3 * dt; }
    vf = clamp(vf, -14.1, CAR_MAX);
    const rad = 1.1 + 11 * Math.pow(Math.abs(vf) / CAR_MAX, 0.8);
    rotAll(c, c.u.clone(), -k.steer * (vf / rad) * dt);
    c.f.addScaledVector(c.u, -c.f.dot(c.u)).normalize(); c.r.crossVectors(c.f, c.u);
    const vf2 = c.v.dot(c.f) * 0 + vf, nvl = vl * Math.exp(-11 * dt);
    c.v.set(0, 0, 0).addScaledVector(c.f, vf2).addScaledVector(c.r, nvl);
    if (ny < 0.6 && c.v.length() < 4) { c.v.addScaledVector(_n, 2.2); }
    if (k.jump) { c.v.addScaledVector(c.u, 3.0); c.sinceJump = 0; c.p.addScaledVector(c.u, 0.05); }
  } else {
    c.v.y -= GRAV * dt;
    if (k.jump && !c.usedFlip && c.sinceJump < 1.25 && !k.dodge) { c.v.addScaledVector(c.u, 2.0); c.usedFlip = true; }
    if (k.dodge && !c.usedFlip && c.sinceJump < 1.25) startFlip(c, k.dodge[0], k.dodge[1]);
    if (c.flipT <= 0) {
      if (c.wallDragT > 0) {
        _t.set(c.wallX - c.p.x, 2.3 - c.p.y, c.wallZ - c.p.z);
        if (_t.lengthSq() > 1e-4) { _t.normalize(); airOrient(c, _t, dt); }
      } else airOrient(c, k.aim, dt);
    }
    if (boosting) { c.v.addScaledVector(c.f, 10 * dt); c.boost -= 33.3 * dt; }
  }
  if (boosting) {
    c.boostSfxT -= dt;
    if (c.boostSfxT <= 0) { sfx('boost', 0.75 + c.v.length() / 24); c.boostSfxT = 0.11; }
  } else c.boostSfxT = 0;
  k.jump = false; k.dodge = null;
  if (c.boost < 0) c.boost = 0;
  const sp = c.v.length(); if (sp > 28) c.v.multiplyScalar(28 / sp);
  c.p.addScaledVector(c.v, dt);
  surf(c.p.x, c.p.y, c.p.z);
  if (SF.d < CH) {
    const pen = CH - SF.d; c.p.x += SF.nx * pen; c.p.y += SF.ny * pen; c.p.z += SF.nz * pen;
    const v2 = c.v.x * SF.nx + c.v.y * SF.ny + c.v.z * SF.nz;
    if (v2 < 0) { c.v.x -= SF.nx * v2; c.v.y -= SF.ny * v2; c.v.z -= SF.nz * v2; }
  } else if (grounded && SF.d < CH + 0.12) {
    const pen = CH - SF.d; c.p.x += SF.nx * pen; c.p.y += SF.ny * pen; c.p.z += SF.nz * pen;
  }
  c.wasGround = SF.d < CH + 0.15 && SF.ny > -0.35;
  if (!wasGround && c.wasGround && c.v.length() > 4) sfx('land', c.v.length() / 18);
  if (!grounded && c.usedFlip && c.flipResetCd <= 0) {
    const b = S.ball;
    _t.set(b.x - c.p.x, b.y - c.p.y, b.z - c.p.z);
    const dl = _t.length();
    if (dl < BR + 1.35 && b.y > c.p.y + 0.04) {
      _t.normalize();
      if (c.u.dot(_t) > 0.38) {
        c.usedFlip = false;
        c.sinceJump = Math.min(c.sinceJump, 0.45);
        c.flipResetCd = 1.0;
        c.st.resets++;
        if (c.mechMsgCd <= 0) { S.msg(c.name + ' fez flip reset!', 1.1); c.mechMsgCd = 1.0; }
      }
    }
  }
}
function respawnCar(c) {
  placeCar(c, (Math.random() - 0.5) * 30, -c.atk * (HZ - 8));
  c.boost = 33;
}
function carBall(c) {
  if (c.dead || c.touchCd > 0) return;
  const b = S.ball;
  _d.set(b.x - c.p.x, b.y - c.p.y, b.z - c.p.z);
  const lx = _d.dot(c.f), ly = _d.dot(c.u), lz = _d.dot(c.r);
  const dx = lx - clamp(lx, -HB[0], HB[0]), dy = ly - clamp(ly, -HB[1], HB[1]), dz = lz - clamp(lz, -HB[2], HB[2]);
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist >= BR) return;
  _n.set(b.x - c.p.x, (b.y - c.p.y) * 0.35, b.z - c.p.z).normalize();
  const pen = BR - dist; b.x += _n.x * pen; b.y += _n.y * pen; b.z += _n.z * pen;
  const vn = (b.vx - c.v.x) * _n.x + (b.vy - c.v.y) * _n.y + (b.vz - c.v.z) * _n.z;
  if (vn < 0) {
    const sp = c.v.length();
    let j = -vn * 1.15 + 0.18 * sp;
    if (c.flipT > 0 && !c.hitFlip) { j += 0.25 * sp + 2; c.hitFlip = true; }
    b.vx += _n.x * j; b.vy += _n.y * j; b.vz += _n.z * j;
    sfx('ballHit', (j + sp * 0.15) / 8);
    c.v.multiplyScalar(0.97);
    c.touchCd = 0.08; c.st.touches++;
    S.lastTouch = c; S.kickoff = false;
    const bs = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
    if (bs > 14 && b.vz * c.atk > 8) {
      const t = (c.atk * HZ - b.z) / b.vz, ex = b.x + b.vx * t;
      if (Math.abs(ex) < GW * 1.3) c.st.shots++;
    }
  }
}
function carCar(a, b) {
  if (a.dead || b.dead) return;
  _d.subVectors(b.p, a.p); const dist = _d.length();
  if (dist > 1.5 || dist < 1e-4) return;
  _d.divideScalar(dist);
  if (a.team !== b.team) {
    const rel = (a.v.x - b.v.x) * _d.x + (a.v.y - b.v.y) * _d.y + (a.v.z - b.v.z) * _d.z;
    const aB = a.boosting, bB = b.boosting;
    if (aB && !bB && rel > 15) { demo(a, b); return; }
    if (bB && !aB && -((b.v.x - a.v.x) * _d.x + (b.v.y - a.v.y) * _d.y + (b.v.z - a.v.z) * _d.z) > 15) { demo(b, a); return; }
  }
  const pen = (1.5 - dist) / 2;
  a.p.addScaledVector(_d, -pen); b.p.addScaledVector(_d, pen);
  const rv = (a.v.x - b.v.x) * _d.x + (a.v.y - b.v.y) * _d.y + (a.v.z - b.v.z) * _d.z;
  if (rv > 0) { a.v.addScaledVector(_d, -rv * 0.6); b.v.addScaledVector(_d, rv * 0.6); }
}
function demo(att, vic) {
  vic.dead = true; vic.respT = 3; vic.mesh.visible = false; att.st.demos++;
  sfx('demo', 1.1);
  S.msg(att.name + ' demoliu ' + vic.name + '!', 1.6);
}
function padsStep(dt) {
  S.pads.forEach(p => {
    if (p.t > 0) { p.t -= dt; if (p.t <= 0) { p.base.material.color.set(0xffc233); if (p.orb) p.orb.visible = true; } return; }
    for (const c of S.cars) {
      if (c.dead || c.boost >= 100) continue;
      const dx = c.p.x - p.x, dz = c.p.z - p.z;
      if (dx * dx + dz * dz < (p.big ? 2.8 : 1.5) * (p.big ? 2.8 : 1.5) && c.p.y < 2.2) {
        c.boost = Math.min(100, c.boost + p.amt); p.t = p.cd; c.st.pads++; p.base.material.color.set(0x3a3320); if (p.orb) p.orb.visible = false;
        sfx(p.big ? 'padBig' : 'padSmall', p.big ? 1.15 : 0.85);
        break;
      }
    }
  });
}

/* ---------- IA ---------- */
function driveTo(c, tx, tz, spd, boostOK) {
  const k = c.ctl, dx = tx - c.p.x, dz = tz - c.p.z;
  _d.set(dx, c.p.y > 1 ? -c.p.y + CH : 0, dz);
  _d.addScaledVector(c.u, -_d.dot(c.u));
  const dist = Math.hypot(dx, dz);
  const fwd = _d.dot(c.f), side = _d.dot(c.r);
  let ang = Math.atan2(side, fwd) + c.noise;
  k.steer = clamp(ang * 2.6, -1, 1);
  const vf = c.v.dot(c.f);
  const want = dist < 2 ? 0 : spd;
  k.thr = want > vf + 0.5 ? 1 : (vf > want + 3 ? -0.6 : 0);
  if (Math.abs(ang) > 2.4 && vf > 5 && dist < 12) k.thr = -1;
  k.boost = !!boostOK && Math.abs(ang) < 0.3 && c.boost > 4 && dist > 9 && (vf > 12 || c.boost > 60);
  return { dist, ang };
}
function trySpeedFlip(c, r, grounded) {
  const k = c.ctl;
  if (!grounded || c.speedFlipCd > 0 || c.sinceJump < 1.2 || c.boost < 6) return false;
  if (r.dist < 11 || r.dist > 34 || Math.abs(r.ang) > 0.26) return false;
  k.jump = true;
  c.dodgeAt = 0.085 + Math.random() * 0.03;
  c.dodgeDir = [1, c.p.x > 0 ? -0.48 : 0.48];
  c.speedFlipCd = 1.1;
  c.st.speedflips++;
  if (c.mechMsgCd <= 0) { S.msg(c.name + ' executou speedflip!', 0.9); c.mechMsgCd = 1.0; }
  return true;
}
function nearestPad(c, ownOnly) {
  let best = null, bs = 1e9;
  S.pads.forEach(p => {
    if (p.t > 0) return;
    if (ownOnly && p.z * c.atk > 6) return;
    const s = Math.hypot(p.x - c.p.x, p.z - c.p.z) - (p.big ? 14 : 0);
    if (s < bs) { bs = s; best = p; }
  });
  return best;
}
function interceptPoint(c) {
  const sp = c.boost > 10 ? 18 : 13;
  for (let i = 1; i <= 40; i++) {
    const p = S.pred[i], dist = Math.hypot(p.x - c.p.x, p.z - c.p.z);
    if (dist / sp + (p.y > 3 ? 0.4 : 0) <= p.t) return p;
  }
  return S.pred[40];
}
function aiCar(c, dt) {
  const k = c.ctl, b = S.ball;
  if (c.dead) return;
  c.noiseT -= dt; if (c.noiseT <= 0) { c.noiseT = 0.5; c.noise = (Math.random() - 0.5) * (1.2 - c.skill) * 0.25; }
  const grounded = c.p.y < 1 || c.u.y < 0.9;
  if (S.state === 'count') { k.thr = 0; k.steer = 0; k.boost = false; return; }
  const ownZ = -c.atk * HZ;
  // desatolar
  if (c.unstick > 0) { c.unstick -= dt; k.thr = -1; k.steer = 1; k.boost = false; if (c.unstick < 0.3) k.jump = true; return; }
  if (c.p.distanceTo(c.stuckP || c.p) < 0.3 && c.v.length() < 2 && S.state === 'play') { c.stuckT += dt; if (c.stuckT > 1.4) { c.unstick = 0.7; c.stuckT = 0; } } else { c.stuckT = 0; }
  c.stuckP = c.stuckP || c.p.clone(); if (c.stuckT === 0) c.stuckP.copy(c.p);
  // ameaca ao nosso golo
  let threat = null;
  for (let i = 1; i <= 25; i++) { const p = S.pred[i]; if (p.z * c.atk < -(HZ - 1.5) && Math.abs(p.x) < GW + 1.5 && p.y < GH + 1.5) { threat = p; break; } }
  const dBall = Math.hypot(b.x - c.p.x, b.z - c.p.z), dBall3 = Math.hypot(b.x - c.p.x, b.y - c.p.y, b.z - c.p.z);
  const wallBall = Math.abs(b.x) > HX - 6.2 && b.y > 1.4 && b.y < GH + 2.4;
  // em voo
  if (!grounded && c.p.y > 1.2) {
    k.aim = null; k.boost = false;
    if (c.wallDragT > 0) {
      _t.set(c.wallX - c.p.x, 2.2 - c.p.y, c.wallZ - c.p.z);
      if (_t.lengthSq() > 1e-4) {
        _t.normalize();
        k.aim = _t.clone();
        k.boost = c.boost > 0 && c.f.dot(_t) > 0.45;
      }
      if (c.wallDragT <= 0.02) c.wallDragT = 0;
      return;
    }
    if (c.aer) {
      const tI = Math.max(0.05, c.aerT); const tg = ballAt(tI);
      _t.set(tg.x - c.p.x, tg.y - c.p.y, tg.z - c.p.z);
      const dd = _t.length(); _t.normalize(); k.aim = _t.clone();
      const al = c.f.dot(_t);
      k.boost = al > 0.85 && c.boost > 0;
      c.aerT -= dt;
      if (dd < 3.2 && c.flipT <= 0 && !c.usedFlip && c.sinceJump < 1.2 && Math.random() < 0.4) k.dodge = [1, 0];
      if (c.aerT < -1) c.aer = false;
    } else if (b.y < 3) {
      _t.set(b.x - c.p.x, 0, b.z - c.p.z).normalize(); k.aim = _t.clone();
    }
    return;
  }
  // papeis
  c.roleT -= dt;
  if (c.idx === 0 && S.roleTick) assignRoles(c.team);
  const role = c.role;
  if (S.kickoff && role === 'attack') {
    const r = driveTo(c, b.x, b.z, CAR_MAX, true);
    k.boost = c.boost > 0 && Math.abs(r.ang) < 0.35;
    if (trySpeedFlip(c, r, grounded)) return;
    if (r.dist < 8.5 && c.sinceJump > 1.5 && grounded) { k.jump = true; c.dodgeAt = 0.1; c.dodgeDir = [1, 0]; }
    return;
  }
  if (role === 'keeper' && !threat) {
    if (c.boost < 30) { const p = nearestPad(c, true); if (p) { driveTo(c, p.x, p.z, 17, false); return; } }
    const tx = clamp(b.x * 0.4, -GW + 2, GW - 2), tz = ownZ * 0.88;
    const r = driveTo(c, tx, tz, 12, false);
    if (r.dist < 3) { k.steer = clamp(c.f.x * 0 + (c.f.z * c.atk > 0 ? 0.3 : 0.3), -1, 1); }
    return;
  }
  if (role === 'support') {
    if (c.boost < 40) { const p = nearestPad(c, false); if (p) { driveTo(c, p.x, p.z, 17, false); return; } }
    if (wallBall && c.boost > 18) {
      const sx = Math.sign(b.x), wx = sx * (HX - 0.7), wz = clamp(b.z + (c.team === 0 ? 1 : -1) * 4, -HZ + 8, HZ - 8);
      const wr = driveTo(c, wx, wz, 19, true);
      if (wr.dist < 5.8 && c.sinceJump > 1.4 && grounded) {
        c.wallDragT = 1.1 + Math.random() * 0.4; c.wallX = sx * (HX - 0.25); c.wallZ = b.z + c.atk * 3.5;
        k.jump = true; k.boost = false; c.st.walldrags++;
      }
      return;
    }
    const tx = clamp(b.x * 0.6, -26, 26), tz = clamp(b.z - c.atk * 17, -HZ + 10, HZ - 10);
    const rr = driveTo(c, tx, tz, 14, true);
    trySpeedFlip(c, rr, grounded);
    return;
  }
  // atacante / defesa urgente
  const p = threat || interceptPoint(c);
  let gx = 0, gz = c.atk * HZ;
  if (threat || (p.z * c.atk < -HZ * 0.45)) { gx = (p.x > 0 ? -1 : 1) * 30; gz = p.z + c.atk * 30; }
  let dx = gx - p.x, dz = gz - p.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  const rel = (c.p.x - p.x) * dx + (c.p.z - p.z) * dz;
  const distP = Math.hypot(p.x - c.p.x, p.z - c.p.z);
  // aerea
  if (grounded && p.y > 3.8 && c.boost > 25 && c.skill > 0.62 && distP > 6 && distP < 24 && c.sinceJump > 1.5 && c.p.y < 1) {
    const tI = Math.max(0.3, p.t);
    const r = driveTo(c, p.x, p.z, 20, true);
    if (distP < 4 + p.y * 2.0 && Math.abs(r.ang) < 0.5) { k.jump = true; c.aer = true; c.aerT = Math.max(0.5, p.t); k.boost = false; }
    return;
  }
  let tx, tz;
  if (rel > -2 && distP > 4) { const sg = ((c.p.x - p.x) * -dz + (c.p.z - p.z) * dx) >= 0 ? 1 : -1; tx = p.x - dx * 9 + (-dz) * sg * 6; tz = p.z - dz * 9 + dx * sg * 6; }
  else { tx = p.x - dx * (BR + 0.9); tz = p.z - dz * (BR + 0.9); }
  tx = clamp(tx, -HX + 4, HX - 4); tz = clamp(tz, -HZ + 3, HZ - 3);
  const r = driveTo(c, tx, tz, CAR_MAX, true);
  if (trySpeedFlip(c, r, grounded)) return;
  if (wallBall && c.boost > 24 && distP < 13) {
    const sx = Math.sign(b.x), wx = sx * (HX - 0.55), wz = clamp(b.z + c.atk * 2.8, -HZ + 8, HZ - 8);
    const wr = driveTo(c, wx, wz, CAR_MAX, true);
    if (wr.dist < 5.4 && c.sinceJump > 1.4 && grounded) {
      c.wallDragT = 1.35; c.wallX = sx * (HX - 0.2); c.wallZ = b.z + c.atk * 4.5;
      k.jump = true; c.st.walldrags++; return;
    }
  }
  if (dBall3 < 4.6 && b.y - c.p.y < 2.6 && Math.abs(r.ang) < 0.6 && c.v.length() > 6 && c.sinceJump > 1.5 && grounded && Math.random() < 0.15 + 0.3 * c.skill) {
    k.jump = true; c.dodgeAt = 0.08 + Math.random() * 0.06; c.dodgeDir = [1, 0];
  }
}
function assignRoles(team) {
  const cs = S.cars.filter(c => c.team === team && !c.dead);
  if (!cs.length) return;
  const b = S.ball, atk = cs[0].atk;
  cs.forEach(c => { c.eta = Math.hypot(b.x - c.p.x, b.z - c.p.z) / 18 + ((c.p.z - b.z) * atk > 1 ? 1.4 : 0); });
  cs.sort((x, y) => x.eta - y.eta);
  cs[0].role = 'attack';
  if (cs[1]) cs[1].role = 'support';
  if (cs[2]) { cs[2].role = 'keeper'; if (cs[1].p.z * atk < cs[2].p.z * atk) { cs[1].role = 'keeper'; cs[2].role = 'support'; } }
}

/* ---------- Fluxo da partida ---------- */
function kickoffReset() {
  const b = S.ball; b.x = 0; b.y = BR; b.z = 0; b.vx = b.vy = b.vz = 0;
  const spots = [[-20.48, 25.6], [20.48, 25.6], [0, 46.08]];
  S.cars.forEach(c => { const s = spots[c.idx]; placeCar(c, s[0], -c.atk * s[1]); });
  S.pads.forEach(p => { p.t = 0; p.base.material.color.set(0xffc233); if (p.orb) p.orb.visible = true; });
  S.state = 'count'; S.stT = 3.2; S.kickoff = true; S.lastTouch = null;
  assignRoles(0); assignRoles(1);
}
function endMatch() { S.state = 'end'; showEnd(); }
function simStep(dt) {
  if (S.state === 'end') return;
  if (S.state === 'count') { S.stT -= dt; S.big(Math.ceil(S.stT) > 0 ? String(Math.ceil(S.stT)) : 'GO!'); if (S.stT <= 0) { S.state = 'play'; S.big(''); } return aiPhysics(dt, true); }
  if (S.state === 'goal') { S.stT -= dt; if (S.stT <= 0) { S.big(''); if (S.ot && false) endMatch(); else kickoffReset(); } return aiPhysics(dt, false, true); }
  S.clock -= dt;
  if (S.clock <= 0 && !S.ot) { if (S.score[0] !== S.score[1]) { S.clock = 0; return endMatch(); } S.ot = true; S.clock = 0; S.msg('PROLONGAMENTO - golo de ouro!', 2.5); }
  if (S.ot) S.clock += dt * 2 * 0.5;
  aiPhysics(dt, false);
  const b = S.ball;
  if (Math.abs(b.z) > HZ + BR && Math.abs(b.x) < GW && b.y < GH) {
    const team = b.z > 0 ? 0 : 1;
    S.score[team]++;
    sfx('goal', 1.2);
    const sc = S.lastTouch && S.lastTouch.team === team ? S.lastTouch : S.cars.find(c => c.team === team);
    sc.st.goals++;
    S.state = 'goal'; S.stT = 3.2;
    S.big('GOLO! ' + (team === 0 ? S.cfg.home : S.cfg.away));
    if (S.ot) { setTimeout(() => { if (S) endMatch(); }, 2200); }
  }
}
function aiPhysics(dt, frozen, noAI) {
  S.aiT -= dt; const doAI = S.aiT <= 0 && !noAI; if (doAI) S.aiT = 1 / 30;
  S.predT -= dt; if (S.predT <= 0) { predictBall(); S.predT = 0.12; }
  S.roleT -= dt; S.roleTick = false; if (S.roleT <= 0) { S.roleT = 0.35; S.roleTick = true; }
  if (doAI) S.cars.forEach(c => aiCar(c, 1 / 30));
  if (!frozen) {
    S.cars.forEach(c => { if (!doAI && S.state === 'goal') { c.ctl.thr = 0; c.ctl.steer = 0; c.ctl.boost = false; } stepCar(c, dt); });
    stepBall(S.ball, dt);
    S.cars.forEach(c => carBall(c));
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) carCar(S.cars[i], S.cars[j]);
    padsStep(dt);
  }
}

/* ---------- Visual / camara ---------- */
function syncVisual(dt) {
  const b = S.ball; S.ballMesh.position.set(b.x, b.y, b.z);
  const sp = Math.hypot(b.vx, b.vy, b.vz);
  if (sp > 0.1) { _ax.set(b.vz, 0, -b.vx).normalize(); if (_ax.lengthSq() > 0) S.ballMesh.rotateOnWorldAxis(_ax, sp / BR * dt * 0.6); }
  S.cars.forEach(c => {
    if (c.dead) return;
    _mat.makeBasis(c.f, c.u, c.r); c.mesh.quaternion.setFromRotationMatrix(_mat); c.mesh.position.copy(c.p);
    c.mesh.userData.flame.visible = c.boosting; if (c.boosting) c.mesh.userData.flame.scale.x = 0.8 + Math.random() * 0.5;
  });
  S.pads.forEach(p => { if (p.orb) p.orb.position.y = 1.2 + Math.sin(S.time * 3) * 0.15; });
  const cam = S.cam, b3 = S.ballMesh.position;
  const tp = _t, look = _d;
  cam.up.set(0, 1, 0);
  if (S.camMode === 0) { tp.set(-HX - 26, 30, b.z * 0.55); look.set(0, 2, b.z * 0.6).lerp(b3, 0.4); }
  else if (S.camMode === 1) { tp.set(b.x * 0.3, 17, -S.camSide * (HZ + 26)); look.copy(b3); }
  else if (S.camMode === 2) {
    const c = S.cars[S.camCar]; const dir = new THREE.Vector3(b.x - c.p.x, 0, b.z - c.p.z); if (dir.lengthSq() < 1) dir.copy(c.f); dir.normalize();
    tp.set(c.p.x - dir.x * 9, c.p.y + 3.6, c.p.z - dir.z * 9); look.copy(b3).lerp(c.p, 0.25);
  } else { tp.set(0, 118, 0.01); look.set(0, 0, 0); cam.up.set(1, 0, 0); }
  const k = S.camMode === 3 ? 1 : Math.min(1, dt * (S.camMode === 2 ? 6 : 3));
  cam.position.lerp(tp, k); S.look.lerp(look, k); cam.lookAt(S.look);
}

/* ---------- HUD ---------- */
function mkUI(cfg) {
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;font-family:system-ui,sans-serif;color:#fff;user-select:none';
  root.innerHTML = '<div id="m3-sb" style="position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;align-items:stretch;font-weight:800;font-size:22px;text-shadow:0 1px 3px #000">' +
    '<div style="background:#1e6bffcc;padding:4px 14px;min-width:120px;text-align:right" id="m3-hn"></div><div id="m3-hs" style="background:#0b2a66;padding:4px 12px;font-size:30px">0</div>' +
    '<div id="m3-ck" style="background:#0009;padding:4px 14px;font-size:28px;min-width:80px;text-align:center">5:00</div>' +
    '<div id="m3-as" style="background:#6b2c05;padding:4px 12px;font-size:30px">0</div><div style="background:#ff7a1acc;padding:4px 14px;min-width:120px" id="m3-an"></div></div>' +
    '<div id="m3-bars" style="position:absolute;right:12px;bottom:12px;font-size:12px"></div>' +
    '<div id="m3-msg" style="position:absolute;top:70px;left:50%;transform:translateX(-50%);font-size:18px;font-weight:700;text-shadow:0 1px 4px #000"></div>' +
    '<div id="m3-big" style="position:absolute;top:36%;left:50%;transform:translate(-50%,-50%);font-size:64px;font-weight:900;text-shadow:0 3px 10px #000;white-space:nowrap"></div>' +
    '<div style="position:absolute;top:10px;right:12px;display:flex;gap:6px"><button id="m3-sp" style="padding:6px 10px">x1</button><button id="m3-x" style="padding:6px 10px">✕</button></div>' +
    '<div style="position:absolute;left:12px;bottom:10px;font-size:12px;opacity:.75">1 TV · 2 Baliza · 3 Carro (Tab muda) · 4 Topo · +/- velocidade · Esc sair</div>' +
    '<div id="m3-end" style="display:none;position:absolute;inset:0;background:#000c;align-items:center;justify-content:center"></div>';
  document.body.appendChild(root);
  const q = id => root.querySelector('#' + id);
  q('m3-hn').textContent = cfg.home; q('m3-an').textContent = cfg.away;
  S.ui = { root, q, hs: q('m3-hs'), as: q('m3-as'), ck: q('m3-ck'), bars: q('m3-bars'), msgEl: q('m3-msg'), bigEl: q('m3-big') };
  S.msg = (t, s) => { S.ui.msgEl.textContent = t; S.msgT = s || 2; };
  S.big = t => { if (S.ui.bigEl.textContent !== t) S.ui.bigEl.textContent = t; };
  q('m3-x').onclick = closeMatch3D;
  q('m3-sp').onclick = () => cycleSpeed(1);
}
function cycleSpeed(dir) {
  const L = [1, 2, 4, 8]; let i = L.indexOf(S.speed); i = clamp(i + dir, 0, L.length - 1); if (dir === 1 && S.speed === 8) i = 0;
  S.speed = L[i]; S.ui.q('m3-sp').textContent = 'x' + S.speed;
}
function updateHUD() {
  const u = S.ui; u.hs.textContent = S.score[0]; u.as.textContent = S.score[1];
  const t = Math.max(0, Math.ceil(S.clock)); u.ck.textContent = S.ot ? 'OT' : Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  if (S.msgT > 0) { S.msgT -= 0.016; if (S.msgT <= 0) u.msgEl.textContent = ''; }
  let h = '';
  S.cars.forEach(c => {
    const col = c.team === 0 ? '#3b82ff' : '#ff8a2a';
    h += '<div style="display:flex;align-items:center;gap:6px;margin-top:3px;opacity:' + (c.dead ? .4 : 1) + '"><span style="width:90px;text-align:right">' + c.name.slice(0, 12) + '</span><div style="width:90px;height:8px;background:#0008"><div style="width:' + c.boost + '%;height:100%;background:' + col + '"></div></div><b style="width:24px">' + Math.round(c.boost) + '</b></div>';
  });
  u.bars.innerHTML = h;
}
function showEnd() {
  const e = S.ui.q('m3-end'); e.style.display = 'flex';
  const row = (l, a, b) => '<tr><td style="text-align:right;padding:3px 10px">' + a + '</td><td style="padding:3px 14px;opacity:.7">' + l + '</td><td style="padding:3px 10px">' + b + '</td></tr>';
  const sum = (t, k) => S.cars.filter(c => c.team === t).reduce((a, c) => a + c.st[k], 0);
  const tt = sum(0, 'touches') + sum(1, 'touches') || 1;
  const me0 = sum(0, 'speedflips') + sum(0, 'walldrags') + sum(0, 'resets');
  const me1 = sum(1, 'speedflips') + sum(1, 'walldrags') + sum(1, 'resets');
  const w = S.score[0] > S.score[1] ? S.cfg.home : S.cfg.away;
  e.innerHTML = '<div style="background:#101828;border-radius:12px;padding:22px 34px;text-align:center"><h2 style="margin:0 0 6px">Fim da partida</h2><div style="font-size:34px;font-weight:800">' + S.score[0] + ' - ' + S.score[1] + '</div><div style="opacity:.8;margin-bottom:10px">Vencedor: ' + w + '</div><table style="margin:auto">' +
    row('Remates', sum(0, 'shots'), sum(1, 'shots')) + row('Posse (toques)', Math.round(sum(0, 'touches') / tt * 100) + '%', Math.round(sum(1, 'touches') / tt * 100) + '%') + row('Demolições', sum(0, 'demos'), sum(1, 'demos')) + row('Mecânicas avançadas', me0, me1) + row('Boost apanhado', sum(0, 'pads'), sum(1, 'pads')) +
    '</table><button id="m3-close" style="margin-top:14px;padding:8px 22px;font-size:16px">Fechar</button></div>';
  e.querySelector('#m3-close').onclick = closeMatch3D;
}

/* ---------- Ciclo principal ---------- */
function onKey(ev) {
  if (!S) return;
  if (ev.key === 'Escape') return closeMatch3D();
  if (ev.key >= '1' && ev.key <= '4') S.camMode = +ev.key - 1;
  else if (ev.key === 'Tab') { ev.preventDefault(); S.camCar = (S.camCar + 1) % 6; S.camMode = 2; }
  else if (ev.key === '+' || ev.key === '=') cycleSpeed(1);
  else if (ev.key === '-') cycleSpeed(-1);
}
function loop(now) {
  if (!S) return;
  S.raf = requestAnimationFrame(loop);
  const rdt = Math.min(0.05, (now - S.last) / 1000); S.last = now;
  S.acc += rdt * S.speed;
  let n = 0;
  while (S.acc >= 1 / 120 && n < 40) { simStep(1 / 120); S.acc -= 1 / 120; n++; S.time += 1 / 120; }
  if (n >= 40) S.acc = 0;
  syncVisual(rdt); updateHUD();
  S.renderer.render(S.scene, S.cam);
}
function resize() { if (!S) return; const w = innerWidth, h = innerHeight; S.renderer.setSize(w, h); S.cam.aspect = w / h; S.cam.updateProjectionMatrix(); }
function start(cfg) {
  THREE = window.THREE; initTemps();
  S = { cfg, scene: new THREE.Scene(), ball: { x: 0, y: BR, z: 0, vx: 0, vy: 0, vz: 0 }, cars: [], pads: [], pred: [], score: [0, 0], clock: 300, ot: false, speed: 1,
    camMode: 0, camCar: 0, camSide: 1, look: new THREE.Vector3(), aiT: 0, predT: 0, roleT: 0, time: 0, acc: 0, last: performance.now(), msgT: 0, state: 'count', stT: 3.2, kickoff: true, audio: initAudio() };
  if (S.audio && S.audio.enabled && S.audio.ctx.state === 'suspended') S.audio.ctx.resume().catch(() => { });
  S.scene.background = new THREE.Color(0x070a12);
  S.cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.3, 600); S.cam.position.set(-HX - 26, 30, 0);
  S.renderer = new THREE.WebGLRenderer({ antialias: true }); S.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  mkUI(cfg); S.ui.root.insertBefore(S.renderer.domElement, S.ui.root.firstChild);
  S.scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x30384a, 1.0));
  const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(20, 40, 10); S.scene.add(dl);
  buildArena(S.scene); buildPads(S.scene); buildBall(S.scene);
  const sk = o => clamp(0.55 + (o - 55) / 55, 0.45, 1.1);
  const hn = cfg.homeNames || ['Jogador 1', 'Jogador 2', 'Jogador 3'], an = cfg.awayNames || ['Rival 1', 'Rival 2', 'Rival 3'];
  for (let i = 0; i < 3; i++) S.cars.push(makeCar(0, i, hn[i] || 'Jogador ' + (i + 1), sk(cfg.homeOvr || 70)));
  for (let i = 0; i < 3; i++) S.cars.push(makeCar(1, i, an[i] || 'Rival ' + (i + 1), sk(cfg.awayOvr || 70)));
  kickoffReset(); predictBall(); resize();
  addEventListener('keydown', onKey); addEventListener('resize', resize);
  S.raf = requestAnimationFrame(loop);
  window.__m3 = S;
}
function openMatch3D(cfg) {
  if (S) return;
  cfg = Object.assign({ home: 'Casa', away: 'Fora', homeOvr: 70, awayOvr: 70 }, cfg || {});
  if (window.THREE) return start(cfg);
  const s = document.createElement('script'); s.src = 'assets/three.min.js'; s.onload = () => start(cfg);
  s.onerror = () => alert('Não foi possível carregar o motor 3D.'); document.head.appendChild(s);
}
function closeMatch3D() {
  if (!S) return;
  cancelAnimationFrame(S.raf); removeEventListener('keydown', onKey); removeEventListener('resize', resize);
  if (S.audio && S.audio.enabled) S.audio.ctx.close().catch(() => { });
  S.renderer.dispose(); S.ui.root.remove(); S = null; window.__m3 = null;
}
window.openMatch3D = openMatch3D; window.closeMatch3D = closeMatch3D;
})();
