// Ramo de flores 3D hecho de partículas (canvas 2D + z-buffer, sin librerías).
// Rosas, margaritas y tulipanes con tallos, hojas, papel de envolver y lazo.

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let W, H, image, pix, zbuf, bg, SCALE = 1, petals = [];

// ---------- utilidades ----------
let seed = 5;
function rand() { seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const uni = (a, b) => a + (b - a) * rand();
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const pop = (x) => { x = clamp(x); const k = 1.5, c = k + 1; return 1 + c * (x - 1) ** 3 + k * (x - 1) ** 2; };
const pick = (a) => a[Math.floor(rand() * a.length)];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a) => mul3(a, 1 / (len3(a) || 1));
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function basis(a) {
  const h = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm3(cross(h, a)), v = cross(a, u);
  return [u, v, a];
}
const toWorld = (B, c, x, y, z) => [c[0] + B[0][0]*x + B[1][0]*y + B[2][0]*z, c[1] + B[0][1]*x + B[1][1]*y + B[2][1]*z, c[2] + B[0][2]*x + B[1][2]*y + B[2][2]*z];
const dirWorld = (B, x, y, z) => norm3([B[0][0]*x + B[1][0]*y + B[2][0]*z, B[0][1]*x + B[1][1]*y + B[2][1]*z, B[0][2]*x + B[1][2]*y + B[2][2]*z]);

// ---------- nube de puntos ----------
const P = { x: [], y: [], z: [], r: [], g: [], b: [], nx: [], ny: [], nz: [], t0: [], dur: [], ax: [], ay: [], az: [], mode: [] };
/** mode 0: crece desde el ancla con rebote · mode 1: solo aparece */
function push(p, c, n, t0, dur, anchor, mode) {
  P.x.push(p[0]); P.y.push(p[1]); P.z.push(p[2]);
  P.r.push(c[0]); P.g.push(c[1]); P.b.push(c[2]);
  P.nx.push(n[0]); P.ny.push(n[1]); P.nz.push(n[2]);
  P.t0.push(t0); P.dur.push(dur); P.ax.push(anchor[0]); P.ay.push(anchor[1]); P.az.push(anchor[2]); P.mode.push(mode);
}

// ---------- flores ----------
const ROSES = [[0.86, 0.10, 0.16], [0.97, 0.45, 0.58], [1.0, 0.62, 0.50], [0.98, 0.90, 0.85], [0.70, 0.06, 0.20]];
function rose(c, a, R, base, t0) {
  const B = basis(a), N = 4200;
  for (let i = 0; i < N; i++) {
    const f = (i + 0.5) / N, phi = Math.acos(1 - 1.85 * f), th = i * 2.39996;   // espiral áurea sobre un capullo
    const rr = R * (1 + 0.05 * Math.sin(phi * 9 + th * 0.5));
    const x = rr * Math.sin(phi) * Math.cos(th), y = rr * Math.sin(phi) * Math.sin(th), z = rr * 0.9 * Math.cos(phi);
    const ripple = 0.78 + 0.22 * Math.sin(phi * 11 + th * 0.45);
    const col = mul3(base, (0.42 + 0.62 * Math.sin(phi * 0.9 + 0.2)) * ripple);
    push(toWorld(B, c, x, y, z), col, dirWorld(B, x, y, z), t0, 0.9, c, 0);
  }
}
function daisy(c, a, R, t0) {
  const B = basis(a), petals = 14;
  for (let k = 0; k < petals; k++) {
    const pa = (k / petals) * 6.2832 + uni(-0.05, 0.05);
    for (let i = 0; i < 150; i++) {
      const s = uni(0.2, 1), w = uni(-1, 1);
      const hw = 0.17 * R * Math.sin(Math.PI * clamp((s - 0.1) / 0.95));
      const rr = s * R, x = rr * Math.cos(pa) - w * hw * Math.sin(pa), y = rr * Math.sin(pa) + w * hw * Math.cos(pa);
      const z = 0.07 * R * Math.sin(s * 2.6) + 0.03 * R;
      const col = mix([1, 1, 0.98], [0.98, 0.82, 0.9], s * s);
      const v = 0.85 + 0.15 * (1 - Math.abs(w));
      push(toWorld(B, c, x, y, z), mul3(col, v), dirWorld(B, 0, 0, 1), t0, 0.9, c, 0);
    }
  }
  for (let i = 0; i < 420; i++) {
    const r = 0.24 * R * Math.sqrt(rand()), th = rand() * 6.2832, x = r * Math.cos(th), y = r * Math.sin(th);
    const z = 0.12 * R + 0.12 * Math.sqrt(Math.max(0, 0.0576 * R * R - r * r)) / 0.24;
    const col = rand() < 0.15 ? [0.75, 0.45, 0.05] : [1, 0.78, 0.12];
    push(toWorld(B, c, x, y, z), mul3(col, uni(0.85, 1.05)), dirWorld(B, x, y, z * 2), t0, 0.9, c, 0);
  }
}
function tulip(c, a, R, base, t0) {
  const B = basis(a);
  for (let i = 0; i < 2200; i++) {
    const h = Math.pow(rand(), 0.8), th = rand() * 6.2832;
    const pet = Math.abs(Math.cos(1.5 * th));                 // 3 pétalos exteriores + 3 interiores
    const r = R * (0.55 + 0.55 * Math.sin(h * 2.3)) * (1 - 0.35 * Math.pow(h, 2.5) * (1 - pet));
    const x = r * Math.cos(th), y = r * Math.sin(th), z = h * R * 1.7 - 0.2 * R;
    const col = mul3(mix(base, [1, 0.92, 0.95], h * h * 0.8), 0.7 + 0.35 * pet * h + 0.15);
    push(toWorld(B, c, x, y, z), col, dirWorld(B, Math.cos(th), Math.sin(th), 0.25), t0, 0.9, c, 0);
  }
}

// ---------- hojas, tallos, relleno ----------
function leaf(root, dir, side, length, width, droop, t0, tone = 1) {
  const n = Math.round(500 * length * (width / 0.18)), nrm = norm3(cross(dir, side));
  for (let i = 0; i < n; i++) {
    const s = rand(), w = uni(-1, 1), hw = width * Math.pow(Math.sin(Math.PI * s), 0.8);
    let p = add3(root, mul3(dir, length * s));
    p = add3(p, mul3(side, w * hw));
    p = add3(p, [0, -droop * s * s, 0]);
    p = add3(p, mul3(nrm, 0.04 * width * Math.abs(w)));                // pliegue central
    const rib = Math.abs(w) < 0.07 ? 1.35 : 1;
    const col = mul3(mix([0.08, 0.35, 0.10], [0.28, 0.65, 0.22], s * 0.6 + uni(0, 0.4)), rib * tone);
    push(p, col, nrm, t0, 0.8, root, 0);
  }
}
function stem(p0, p1, p2, t0) {
  const n = 520;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), u = 1 - s;
    const c = [u*u*p0[0] + 2*u*s*p1[0] + s*s*p2[0], u*u*p0[1] + 2*u*s*p1[1] + s*s*p2[1], u*u*p0[2] + 2*u*s*p1[2] + s*s*p2[2]];
    const th = rand() * 6.2832, r = 0.022, tg = norm3(sub3(p2, p0)), B = basis(tg);
    const q = toWorld(B, c, r * Math.cos(th), r * Math.sin(th), 0);
    push(q, mul3([0.18, 0.5, 0.16], uni(0.75, 1.1)), norm3(sub3(q, c)), t0 + s * 1.3, 0.2, c, 1);
  }
}
function filler(root, tip, t0) {
  for (let b = 0; b < 7; b++) {
    const s = uni(0.45, 1), mid = add3(root, mul3(sub3(tip, root), s));
    const c = add3(mid, [uni(-0.12, 0.12), uni(-0.08, 0.1), uni(-0.12, 0.12)]);
    for (let i = 0; i < 26; i++) {
      const v = norm3([rand() - 0.5, rand() - 0.5, rand() - 0.5]), r = uni(0.02, 0.05);
      push(add3(c, mul3(v, r)), mul3([1, 0.97, 1], uni(0.85, 1)), v, t0 + rand() * 1.5, 0.6, c, 0);
    }
  }
}

// ---------- papel y lazo ----------
const WRAP_H = 1.55, WRAP_R = 1.3;
const wrapRadius = (y) => WRAP_R * Math.pow(y / WRAP_H, 0.95) + 0.05;
function wrapper() {
  for (let i = 0; i < 42000; i++) {
    const ang = rand() * 6.2832, ymax = WRAP_H + 0.1 * Math.sin(ang * 5) + 0.05 * Math.sin(ang * 11);
    const y = Math.sqrt(rand()) * ymax;
    const r = wrapRadius(y) * (1 + 0.05 * Math.sin(ang * 7 + y * 2));
    const stripe = Math.sin(ang * 9 + y * 3) > 0.15;
    const edge = clamp((ymax - y) / 0.12);
    let col = stripe ? [0.99, 0.80, 0.84] : [0.96, 0.86, 0.70];
    col = mul3(col, 0.78 + 0.22 * edge);
    const n = norm3([Math.cos(ang), -0.35, Math.sin(ang)]);
    push([r * Math.cos(ang), y, r * Math.sin(ang)], mul3(col, uni(0.92, 1.04)), n, 0.2 + (y / WRAP_H) * 1.4, 0.2, [0, 0, 0], 1);
  }
}
function ribbon() {
  const y0 = 0.66, r0 = wrapRadius(y0) + 0.012;
  for (let i = 0; i < 4500; i++) {
    const ang = rand() * 6.2832, y = y0 + uni(-0.06, 0.06), r = wrapRadius(y) + 0.012;
    push([r * Math.cos(ang), y, r * Math.sin(ang)], mul3([1, 0.32, 0.58], uni(0.85, 1.1)), [Math.cos(ang), 0, Math.sin(ang)], 5.0 + ang / 6.2832 * 1.2, 0.2, [0, 0, 0], 1);
  }
  const root = [0, y0, r0 + 0.01], front = [0, 0, 1];
  const loopTone = (d, side, len, w, dr, t) => leafColored(root, d, side, len, w, dr, t);
  loopTone(norm3([ 1, 0.35, 0.25]), [0, 0, 1], 0.55, 0.16, 0.0, 6.4);
  loopTone(norm3([-1, 0.35, 0.25]), [0, 0, 1], 0.55, 0.16, 0.0, 6.5);
  loopTone(norm3([ 0.35, -1, 0.3]), [0, 0, 1], 0.7, 0.07, 0.0, 6.7);
  loopTone(norm3([-0.35, -1, 0.3]), [0, 0, 1], 0.7, 0.07, 0.0, 6.8);
  for (let i = 0; i < 260; i++) {
    const v = norm3([rand() - 0.5, rand() - 0.5, rand() - 0.5]);
    push(add3(root, mul3(v, 0.07)), mul3([1, 0.4, 0.65], uni(0.9, 1.1)), v, 6.3, 0.5, root, 0);
  }
}
function leafColored(root, dir, side, length, width, droop, t0) {
  const nrm = norm3(cross(dir, side)), n = Math.round(1400 * length * (width / 0.18));
  for (let i = 0; i < n; i++) {
    const s = rand(), w = uni(-1, 1), hw = width * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 0.6);
    let p = add3(add3(root, mul3(dir, length * s)), mul3(side, w * hw));
    p = add3(p, mul3(nrm, 0.02 * Math.sin(s * 9)));
    const k = 0.8 + 0.25 * (1 - Math.abs(w));
    push(p, mul3([1, 0.3, 0.55], k * uni(0.9, 1.05)), nrm, t0, 0.5, root, 0);
  }
}

// ---------- escena ----------
function buildScene() {
  wrapper();
  const heads = [
    ["rose",   [0.00, 3.05, 0.05], 0.44, ROSES[0]],
    ["rose",   [0.78, 2.72, 0.35], 0.40, ROSES[1]],
    ["rose",   [-0.72, 2.68, 0.40], 0.40, ROSES[2]],
    ["rose",   [0.30, 2.62, -0.70], 0.38, ROSES[3]],
    ["rose",   [-0.40, 2.55, -0.66], 0.38, ROSES[4]],
    ["daisy",  [1.18, 2.28, -0.15], 0.40, null],
    ["daisy",  [-1.20, 2.25, -0.05], 0.40, null],
    ["daisy",  [0.15, 2.30, 1.00], 0.40, null],
    ["tulip",  [0.98, 2.55, -0.72], 0.27, [0.98, 0.35, 0.55]],
    ["tulip",  [-1.00, 2.50, -0.78], 0.27, [1.0, 0.55, 0.30]],
    ["tulip",  [-0.45, 2.15, 1.00], 0.27, [0.85, 0.25, 0.70]],
  ];
  heads.forEach(([type, pos, R, col], i) => {
    const t0 = 2.0 + i * 0.42;
    const a = norm3([pos[0] * 0.55, 1, pos[2] * 0.55]);
    const p0 = [rand() * 0.06 - 0.03, 0.06, rand() * 0.06 - 0.03];
    const base = sub3(pos, mul3(a, 0.05));
    const ctrl = [pos[0] * 0.25, pos[1] * 0.55, pos[2] * 0.25];
    stem(p0, ctrl, base, 0.9 + i * 0.05);
    if (type === "rose") rose(pos, a, R, col, t0);
    else if (type === "daisy") daisy(pos, a, R, t0);
    else tulip(pos, a, R, col, t0);
    // hoja pequeña en el tallo
    if (i % 2 === 0) {
      const st = add3(mul3(ctrl, 0.55), [0, 0.35, 0]);
      const d = norm3([pos[0], 0.55, pos[2]]);
      leaf(st, d, norm3(cross(d, [0, 1, 0])), 0.55, 0.11, 0.1, 3 + rand() * 2, 1);
    }
  });
  // hojas grandes que salen del borde del papel
  for (let i = 0; i < 16; i++) {
    const phi = (i / 16) * 6.2832 + uni(-0.15, 0.15);
    const rim = [1.28 * Math.cos(phi), 1.5, 1.28 * Math.sin(phi)];
    const d = norm3([Math.cos(phi) * 0.75, 0.75, Math.sin(phi) * 0.75]);
    leaf(rim, d, norm3(cross(d, [0, 1, 0])), uni(0.8, 1.15), 0.2, uni(0.1, 0.4), 3.2 + rand() * 2.2, uni(0.85, 1.1));
  }
  // relleno blanco tipo gypsophila
  for (let i = 0; i < 14; i++) {
    const phi = rand() * 6.2832, rad = uni(0.7, 1.25);
    filler([0, 1.4, 0], [rad * Math.cos(phi), uni(2.0, 2.9), rad * Math.sin(phi)], 5.0 + rand() * 1.5);
  }
  ribbon();
}
buildScene();

const N = P.x.length, F = {};
for (const k in P) F[k] = new Float32Array(P[k]);
const jitter = new Float32Array(N).map(() => uni(0.9, 1.08));

// ---------- pétalos que caen (coordenadas de pantalla, cubren toda la ventana) ----------
const PETAL_COLORS = [[255, 190, 210], [255, 225, 232], [255, 160, 190], [255, 235, 210]];
function initPetals() {
  const n = Math.round((W * H) / 2200); petals = [];
  for (let i = 0; i < n; i++) petals.push({ u: rand(), v: rand(), d: uni(3, 14), s: uni(0.03, 0.08), ph: uni(0, 6.28), c: pick(PETAL_COLORS) });
}
function resize() {
  W = canvas.width = innerWidth; H = canvas.height = innerHeight;
  image = ctx.createImageData(W, H); pix = new Uint32Array(image.data.buffer); zbuf = new Float32Array(W * H);
  bg = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) {
    const f = y / H, c = rgba(26 - 18 * f, 11 - 6 * f, 32 - 18 * f);
    bg.fill(c, y * W, (y + 1) * W);
  }
  SCALE = Math.min(W, H) / 700; initPetals();
}

// ---------- render ----------
const rgba = (r, g, b) => (255 << 24) | (clamp(b, 0, 255) << 16) | (clamp(g, 0, 255) << 8) | clamp(r, 0, 255);
function plot(x, y, z, color, size) {
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
    const xx = x + dx, yy = y + dy; if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
    const i = yy * W + xx; if (z < zbuf[i]) { zbuf[i] = z; pix[i] = color; }
  }
}
const CENTRE = [0, 1.55, 0], CAM_D = 8.5, TILT = (-11 * Math.PI) / 180;
const LIGHT = norm3([-0.45, 0.7, 0.55]);
let yawOffset = 0;

function render(t) {
  pix.set(bg); zbuf.fill(Infinity);
  const FOCAL = 1300 * SCALE, PT = SCALE > 1.5 ? 4 : 3;
  const yaw = 0.3 * t + 0.35 + yawOffset, cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(TILT), sx = Math.sin(TILT);
  const R = [[cy, 0, sy], [sx * sy, cx, -sx * cy], [-cx * sy, sx, cx * cy]];
  const Lw = [0, 1, 2].map((j) => R[0][j] * LIGHT[0] + R[1][j] * LIGHT[1] + R[2][j] * LIGHT[2]);
  for (let i = 0; i < N; i++) {
    const k = (t - F.t0[i]) / F.dur[i]; if (k <= 0) continue;
    const s = F.mode[i] === 0 ? pop(k) : 1;
    const x = F.ax[i] + (F.x[i] - F.ax[i]) * s - CENTRE[0];
    const y = F.ay[i] + (F.y[i] - F.ay[i]) * s - CENTRE[1];
    const z = F.az[i] + (F.z[i] - F.az[i]) * s - CENTRE[2];
    const qx = R[0][0] * x + R[0][1] * y + R[0][2] * z;
    const qy = R[1][0] * x + R[1][1] * y + R[1][2] * z;
    const qz = R[2][0] * x + R[2][1] * y + R[2][2] * z + CAM_D;
    if (qz < 0.5) continue;
    const shade = 0.5 + 0.6 * clamp(F.nx[i] * Lw[0] + F.ny[i] * Lw[1] + F.nz[i] * Lw[2]);
    const m = shade * jitter[i] * 255;
    plot((qx * FOCAL / qz + W / 2) | 0, (-qy * FOCAL / qz + H / 2) | 0, qz, rgba(F.r[i] * m, F.g[i] * m, F.b[i] * m), PT);
  }
  if (t > 0.1) for (const f of petals) {
    const near = 1 - (f.d - 3) / 11, b = 0.45 + 0.55 * near, c = f.c;
    const x = ((f.u + 0.03 * Math.sin(t * 0.9 + f.ph)) % 1 + 1) % 1 * W;
    const y = (((f.v + f.s * t * (0.6 + near)) % 1) + 1) % 1 * H;
    const size = near > 0.6 ? 5 : near > 0.3 ? 4 : 3;
    plot(x | 0, y | 0, f.d, rgba(c[0] * b, c[1] * b, c[2] * b), size);
  }
  ctx.putImageData(image, 0, 0);
}

// ---------- bucle e interacción ----------
const fixed = new URLSearchParams(location.search).get("t");   // ?t=12 → fotograma fijo
let start = performance.now();
function loop(now) { render(fixed !== null ? parseFloat(fixed) : (now - start) / 1000); if (fixed === null) requestAnimationFrame(loop); }
resize(); addEventListener("resize", resize); requestAnimationFrame(loop);
const restart = () => { start = performance.now(); yawOffset = 0; };
addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "r") restart(); });
let drag = null;
canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, moved: false }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 2) drag.moved = true; yawOffset += dx * 0.01; drag.x = e.clientX; });
canvas.addEventListener("pointerup", () => { if (drag && !drag.moved) restart(); drag = null; });
