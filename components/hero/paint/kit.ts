/**
 * Alat lukis untuk scene hero (gaya ilustrasi ala film animasi: tanpa garis tepi,
 * bentuk lembut dengan sisi terang & bayangan yang tegas, sapuan kecil sebagai tekstur).
 *
 * Koordinat:
 *  - u = tinggi canvas (px). x dalam satuan u, 0 = tengah layar.
 *  - langit: f = 0 (atas) .. 1 (cakrawala); tanah: d = 0 (cakrawala) .. 1 (bawah).
 */

export type Ctx = CanvasRenderingContext2D;
export type Rand = () => number;

export interface View {
  w: number;
  h: number;
  cx: number;
  u: number;
  hz: number;
  half: number;
  /** skala horizontal: di layar HP komposisi dipadatkan supaya tokoh tetap terlihat */
  sx: number;
}

/** Scene hero: lapisan statis digambar ulang saat resize, sisanya tiap frame. */
export interface PaintScene {
  resize: (w: number, h: number) => void;
  draw: (ctx: Ctx, t: number) => void;
}

export function makeView(w: number, h: number, horizon = 0.64): View {
  const portrait = h > w;
  const sx = Math.min(1, w / 2 / (0.62 * h));
  return { w, h, cx: w / 2, u: h, hz: h * (portrait ? horizon + 0.06 : horizon), half: w / 2 / (h * sx), sx };
}

export const X = (v: View, x: number) => v.cx + x * v.u * v.sx;
export const S = (v: View, f: number) => f * v.hz;
export const G = (v: View, d: number) => v.hz + d * (v.h - v.hz);

export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash1 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const k = f * f * (3 - 2 * f);
  return hash1(i) * (1 - k) + hash1(i + 1) * k;
}
export function fbm1(x: number, oct = 4) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise1(x * f);
    f *= 2.03;
    a *= 0.5;
  }
  return v;
}

export const mod = (v: number, m: number) => ((v % m) + m) % m;
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function layer(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return { c, g: c.getContext("2d")! };
}

/* ------------------------------------------------------------------ */
/* Langit & cahaya                                                     */
/* ------------------------------------------------------------------ */

export function skyGradient(g: Ctx, v: View, stops: [number, string][]) {
  const gr = g.createLinearGradient(0, 0, 0, v.hz);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, v.w, v.hz + 4);
}

export function glow(g: Ctx, x: number, y: number, r: number, rgb: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(0.25, `rgba(${rgb},${a * 0.6})`);
  gr.addColorStop(0.6, `rgba(${rgb},${a * 0.18})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

/** berkas cahaya matahari yang lembut */
export function rays(g: Ctx, x: number, y: number, len: number, rgb: string, a: number, r: Rand, n = 9) {
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (r() - 0.5) * 2.4;
    const spread = 0.025 + r() * 0.05;
    const gr = g.createRadialGradient(x, y, 0, x, y, len);
    gr.addColorStop(0, `rgba(${rgb},${a})`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, len, ang - spread, ang + spread);
    g.closePath();
    g.fill();
  }
  g.restore();
}

/* ------------------------------------------------------------------ */
/* Awan kumulus bertumpuk (sisi atas terang, bawah teduh, tepi tegas)  */
/* ------------------------------------------------------------------ */

export interface CloudPalette {
  shade: string;
  mid: string;
  light: string;
  rim?: string;
  /** cahaya dari bawah (matahari terbenam) */
  under?: boolean;
}

export function cloudSprite(r: Rand, wPx: number, hPx: number, p: CloudPalette, flat = false) {
  const pad = hPx * 0.4;
  const { c, g } = layer(wPx + pad * 2, hPx + pad * 2);
  const cx = pad + wPx / 2;
  const base = pad + hPx; // dasar awan (datar)
  // gumpalan besar yang saling menumpuk; makin ke tengah makin tinggi
  const puffs: [number, number, number][] = [];
  const n = flat ? 7 : 9;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const jitter = (r() - 0.5) * 0.12;
    const edge = 1 - Math.abs(u);
    const rad = hPx * (flat ? 0.34 + r() * 0.14 : 0.3 + r() * 0.12) * (0.55 + edge * 0.6);
    const lift = (flat ? 0.12 : 0.55) * hPx * Math.pow(edge, 0.9) * (0.75 + r() * 0.4);
    puffs.push([cx + (u + jitter) * wPx * 0.38, base - rad * 0.85 - lift, rad]);
  }
  const body = (dx: number, dy: number, k: number) => {
    g.beginPath();
    g.ellipse(cx + dx * hPx, base - hPx * 0.2 + dy * hPx, (wPx / 2) * (0.92 + (k - 1) * 0.5), hPx * 0.22 * k, 0, 0, Math.PI * 2);
    for (const [x, y, rr] of puffs) {
      g.moveTo(x + dx * rr + rr * k, y + dy * rr);
      g.arc(x + dx * rr, y + dy * rr, rr * k, 0, Math.PI * 2);
    }
  };
  g.fillStyle = p.shade;
  body(0, 0, 1);
  g.fill();
  g.globalCompositeOperation = "destination-out";
  g.fillRect(0, base, c.width, c.height);
  g.globalCompositeOperation = "source-atop";
  if (p.under) {
    // senja: bagian bawah awan yang kena cahaya, atasnya teduh
    g.fillStyle = p.mid;
    body(0, -0.1, 0.95);
    g.fill();
    const gr = g.createLinearGradient(0, base - hPx, 0, base);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(0.55, p.light);
    gr.addColorStop(1, p.rim ?? p.light);
    g.fillStyle = gr;
    g.fillRect(0, 0, c.width, c.height);
  } else {
    g.fillStyle = p.mid;
    body(-0.05, -0.12, 0.93);
    g.fill();
    g.fillStyle = p.light;
    g.beginPath();
    for (const [x, y, rr] of puffs) {
      g.moveTo(x - rr * 0.1 + rr * 0.72, y - rr * 0.22);
      g.arc(x - rr * 0.1, y - rr * 0.22, rr * 0.72, 0, Math.PI * 2);
    }
    g.fill();
    if (p.rim) {
      g.fillStyle = p.rim;
      g.beginPath();
      for (const [x, y, rr] of puffs) {
        g.moveTo(x - rr * 0.18 + rr * 0.4, y - rr * 0.4);
        g.arc(x - rr * 0.18, y - rr * 0.4, rr * 0.4, 0, Math.PI * 2);
      }
      g.fill();
    }
  }
  g.globalCompositeOperation = "source-over";
  return { c, ox: cx, oy: base };
}

/* ------------------------------------------------------------------ */
/* Pepohonan                                                           */
/* ------------------------------------------------------------------ */

export interface LeafPalette {
  dark: string;
  mid: string;
  light: string;
  hi: string;
}

/** Satu gumpalan daun (sprite). Cahaya datang dari `sun` (-1 kiri .. 1 kanan). */
export function crownSprite(r: Rand, R: number, p: LeafPalette, sun = -0.6, fruit = 0) {
  const pad = R * 0.35;
  const { c, g } = layer(R * 2 + pad * 2, R * 1.8 + pad * 2);
  const cx = c.width / 2;
  const cy = pad + R * 0.9;
  const lobes: [number, number, number][] = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + r() * 0.4;
    const d = R * (0.45 + r() * 0.2);
    lobes.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.75, R * (0.38 + r() * 0.2)]);
  }
  lobes.push([cx, cy, R * 0.6]);
  const pass = (color: string, dx: number, dy: number, k: number, only?: (x: number, y: number) => boolean) => {
    g.fillStyle = color;
    g.beginPath();
    for (const [x, y, rr] of lobes) {
      if (only && !only(x, y)) continue;
      g.moveTo(x + dx * R + rr * k, y + dy * R);
      g.arc(x + dx * R, y + dy * R, rr * k, 0, Math.PI * 2);
    }
    g.fill();
  };
  pass(p.dark, 0, 0, 1);
  g.globalCompositeOperation = "source-atop";
  pass(p.mid, sun * 0.08, -0.1, 0.88);
  pass(p.light, sun * 0.16, -0.22, 0.62, (x, y) => (x - cx) * sun >= -R * 0.2 && y < cy + R * 0.15);
  pass(p.hi, sun * 0.22, -0.3, 0.32, (x, y) => (x - cx) * sun > 0 && y < cy);
  // tekstur daun: sapuan kecil
  for (let i = 0; i < 55; i++) {
    const a = r() * Math.PI * 2;
    const d = R * Math.sqrt(r()) * 0.95;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.8;
    const lit = (x - cx) * sun + (cy - y) > 0;
    g.fillStyle = lit ? (r() > 0.5 ? p.hi : p.light) : r() > 0.5 ? p.dark : p.mid;
    g.globalAlpha = 0.35;
    g.beginPath();
    g.ellipse(x, y, R * 0.045, R * 0.024, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  // daun-daun di tepi supaya siluet tidak bulat sempurna
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2;
    const x = cx + Math.cos(a) * R * 0.98;
    const y = cy + Math.sin(a) * R * 0.78;
    g.fillStyle = (x - cx) * sun + (cy - y) > 0 ? p.light : p.dark;
    g.beginPath();
    g.ellipse(x, y, R * 0.06, R * 0.035, a, 0, Math.PI * 2);
    g.fill();
  }
  // aksen ceri (sepasang buah merah dengan tangkai)
  for (let i = 0; i < fruit; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.35 + r() * 0.5);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.75;
    const fr = R * 0.042;
    g.strokeStyle = "#5C7A2E";
    g.lineWidth = Math.max(1, fr * 0.3);
    g.beginPath();
    g.moveTo(x - fr * 0.8, y);
    g.quadraticCurveTo(x, y - fr * 2.6, x + fr * 0.3, y - fr * 2.4);
    g.moveTo(x + fr * 0.9, y + fr * 0.2);
    g.quadraticCurveTo(x + fr * 0.6, y - fr * 2, x + fr * 0.3, y - fr * 2.4);
    g.stroke();
    for (const [dx, dy] of [[-0.8, 0], [0.9, 0.2]] as const) {
      g.fillStyle = "#E23B4E";
      g.beginPath();
      g.arc(x + dx * fr, y + dy * fr + fr * 0.8, fr, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.7)";
      g.beginPath();
      g.arc(x + dx * fr - fr * 0.35, y + dy * fr + fr * 0.45, fr * 0.28, 0, Math.PI * 2);
      g.fill();
    }
  }
  return { c, ox: cx, oy: cy };
}

export interface Tree {
  crowns: { s: ReturnType<typeof crownSprite>; dx: number; dy: number }[];
  h: number;
  trunk: string;
  trunkLight: string;
  lean: number;
}

/** Pohon: batang bercabang + beberapa gumpalan daun. size = tinggi pohon (px) */
export function makeTree(r: Rand, size: number, p: LeafPalette, trunk: string, trunkLight: string, sun = -0.6, fruit = 0): Tree {
  const crowns = [] as Tree["crowns"];
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const R = size * (0.26 + r() * 0.12) * (i === 0 ? 1.25 : 1);
    const a = i === 0 ? 0 : (i / n) * Math.PI * 2 + r();
    crowns.push({
      s: crownSprite(r, R, p, sun, fruit),
      dx: i === 0 ? 0 : Math.cos(a) * size * 0.26,
      dy: i === 0 ? -size * 0.68 : -size * (0.62 + Math.sin(a) * 0.14),
    });
  }
  crowns.sort((a, b) => a.dy - b.dy);
  return { crowns, h: size, trunk, trunkLight, lean: (r() - 0.5) * 0.1 };
}

export function drawTree(g: Ctx, tr: Tree, x: number, y: number, sway = 0) {
  const s = tr.h;
  const tw = s * 0.07;
  g.fillStyle = tr.trunk;
  g.beginPath();
  g.moveTo(x - tw * 1.3, y);
  g.quadraticCurveTo(x - tw * 0.6, y - s * 0.3, x - tw * 0.5 + tr.lean * s, y - s * 0.62);
  g.lineTo(x + tw * 0.5 + tr.lean * s, y - s * 0.62);
  g.quadraticCurveTo(x + tw * 0.6, y - s * 0.3, x + tw * 1.3, y);
  g.closePath();
  g.fill();
  // cabang
  g.strokeStyle = tr.trunk;
  g.lineCap = "round";
  g.lineWidth = tw * 0.5;
  g.beginPath();
  g.moveTo(x + tr.lean * s * 0.6, y - s * 0.42);
  g.quadraticCurveTo(x + s * 0.12, y - s * 0.5, x + s * 0.2, y - s * 0.62);
  g.moveTo(x + tr.lean * s * 0.5, y - s * 0.36);
  g.quadraticCurveTo(x - s * 0.1, y - s * 0.44, x - s * 0.18, y - s * 0.58);
  g.stroke();
  // sisi terang batang
  g.fillStyle = tr.trunkLight;
  g.beginPath();
  g.moveTo(x - tw * 1.1, y);
  g.quadraticCurveTo(x - tw * 0.5, y - s * 0.3, x - tw * 0.4 + tr.lean * s, y - s * 0.6);
  g.lineTo(x - tw * 0.05 + tr.lean * s, y - s * 0.6);
  g.quadraticCurveTo(x - tw * 0.1, y - s * 0.3, x - tw * 0.3, y);
  g.closePath();
  g.fill();
  for (const { s: sp, dx, dy } of tr.crowns) {
    g.drawImage(sp.c, x + dx + sway * (1 + -dy / s) - sp.ox, y + dy - sp.oy);
  }
}

/** pohon kecil di kejauhan: gumpalan sederhana dua warna */
export function farTree(g: Ctx, x: number, y: number, s: number, dark: string, light: string, cypress = false) {
  g.fillStyle = dark;
  g.beginPath();
  if (cypress) g.ellipse(x, y - s * 0.9, s * 0.22, s * 0.9, 0, 0, Math.PI * 2);
  else {
    g.arc(x, y - s * 0.6, s * 0.45, 0, Math.PI * 2);
    g.arc(x - s * 0.3, y - s * 0.4, s * 0.32, 0, Math.PI * 2);
    g.arc(x + s * 0.3, y - s * 0.42, s * 0.3, 0, Math.PI * 2);
  }
  g.fill();
  g.fillStyle = light;
  g.beginPath();
  if (cypress) g.ellipse(x - s * 0.06, y - s * 1.05, s * 0.12, s * 0.6, 0, 0, Math.PI * 2);
  else {
    g.arc(x - s * 0.1, y - s * 0.72, s * 0.28, 0, Math.PI * 2);
    g.arc(x - s * 0.36, y - s * 0.5, s * 0.16, 0, Math.PI * 2);
  }
  g.fill();
}

/* ------------------------------------------------------------------ */
/* Tanah, rumput, bunga                                                */
/* ------------------------------------------------------------------ */

/** Siluet bukit dengan tepi tegas + gradasi; mengembalikan fungsi tinggi permukaan */
export function hillShape(
  g: Ctx,
  v: View,
  o: { y: number; amp: number; freq: number; seed: number; top: string; bottom: string; light?: string },
) {
  const surf = (x: number) => o.y - o.amp * v.u * fbm1(((x - v.cx) / v.u) * o.freq + o.seed, 3);
  const top = o.y - o.amp * v.u;
  const gr = g.createLinearGradient(0, top, 0, v.h);
  gr.addColorStop(0, o.top);
  gr.addColorStop(Math.min(1, ((o.y - top) / (v.h - top)) * 1.4), o.bottom);
  gr.addColorStop(1, o.bottom);
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, v.h);
  for (let x = 0; x <= v.w + 4; x += 4) g.lineTo(x, surf(x));
  g.lineTo(v.w, v.h);
  g.closePath();
  g.fill();
  if (o.light) {
    // sinar tipis di punggung bukit
    g.strokeStyle = o.light;
    g.lineWidth = Math.max(1, v.u * 0.0025);
    g.beginPath();
    for (let x = 0; x <= v.w + 4; x += 4) (x === 0 ? g.moveTo : g.lineTo).call(g, x, surf(x) + 1);
    g.stroke();
  }
  return surf;
}

/** sapuan rumput kecil (tekstur padang) */
export function grassDabs(g: Ctx, v: View, r: Rand, y0: number, y1: number, n: number, colors: string[], scale = 1) {
  for (let i = 0; i < n; i++) {
    const k = Math.pow(r(), 0.8);
    const y = lerp(y0, y1, k);
    const x = r() * v.w;
    const sz = v.u * (0.003 + k * 0.008) * scale;
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    g.globalAlpha = 0.35 + r() * 0.4;
    g.beginPath();
    g.ellipse(x, y, sz * 2.2, sz * 0.32, (r() - 0.5) * 0.3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** rumpun rumput: helai-helai meruncing */
export function tuft(g: Ctx, x: number, y: number, h: number, colors: string[], r: Rand, bend = 0, blades = 7) {
  for (let i = 0; i < blades; i++) {
    const ox = (r() - 0.5) * h * 0.5;
    const bh = h * (0.55 + r() * 0.5);
    const lean = (r() - 0.5) * h * 0.5 + bend * bh;
    const w = h * (0.06 + r() * 0.04);
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    g.beginPath();
    g.moveTo(x + ox - w, y);
    g.quadraticCurveTo(x + ox + lean * 0.3, y - bh * 0.6, x + ox + lean, y - bh);
    g.quadraticCurveTo(x + ox + lean * 0.3 + w * 0.4, y - bh * 0.5, x + ox + w, y);
    g.closePath();
    g.fill();
  }
}

/** bunga aster putih / warna (kelopak + tengah) */
export function daisy(g: Ctx, x: number, y: number, s: number, petal: string, center: string, tilt = 0.55) {
  g.save();
  g.translate(x, y);
  g.scale(1, tilt);
  g.fillStyle = petal;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.beginPath();
    g.ellipse(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.42, s * 0.2, a, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = center;
  g.beginPath();
  g.arc(0, 0, s * 0.3, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/* ------------------------------------------------------------------ */
/* Tokoh                                                               */
/* ------------------------------------------------------------------ */

export function shadow(g: Ctx, x: number, y: number, rx: number, a = 0.16) {
  g.fillStyle = `rgba(30,50,40,${a})`;
  g.beginPath();
  g.ellipse(x, y, rx, rx * 0.22, 0, 0, Math.PI * 2);
  g.fill();
}

/** kepala anak: wajah, rambut/hijab, mata titik, pipi merona. k = ukuran kepala (radius) */
export function kidHead(
  g: Ctx,
  x: number,
  y: number,
  k: number,
  o: { skin: string; hair: string; style: "short" | "bob" | "hijab" | "pony"; face?: -1 | 0 | 1 },
) {
  const f = o.face ?? 0; // arah hadap: -1 kiri, 1 kanan
  if (o.style === "hijab") {
    g.fillStyle = o.hair;
    g.beginPath();
    g.ellipse(x, y + k * 0.15, k * 1.18, k * 1.25, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x - k * 1.1, y + k * 0.6);
    g.quadraticCurveTo(x, y + k * 2.0, x + k * 1.1, y + k * 0.6);
    g.fill();
  }
  if (o.style === "bob" || o.style === "pony") {
    g.fillStyle = o.hair;
    g.beginPath();
    g.ellipse(x, y + k * 0.1, k * 1.12, k * 1.1, 0, 0, Math.PI * 2);
    g.fill();
    if (o.style === "pony") {
      g.beginPath();
      g.ellipse(x - f * k * 1.1, y - k * 0.2, k * 0.45, k * 0.3, -f * 0.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = o.skin;
  g.beginPath();
  g.ellipse(x + f * k * 0.1, y + k * 0.08, k * 0.86, k * 0.9, 0, 0, Math.PI * 2);
  g.fill();
  if (o.style === "short" || o.style === "bob" || o.style === "pony") {
    g.fillStyle = o.hair;
    g.beginPath();
    g.ellipse(x, y - k * 0.42, k * 0.98, k * 0.62, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.ellipse(x + f * k * 0.3 - k * 0.15, y - k * 0.38, k * 0.72, k * 0.36, -0.2, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = o.hair;
    g.beginPath();
    g.ellipse(x, y - k * 0.55, k * 1.0, k * 0.5, 0, Math.PI, 0);
    g.fill();
  }
  // mata & pipi
  g.fillStyle = "#2A2230";
  const ex = x + f * k * 0.28;
  g.beginPath();
  g.arc(ex - k * 0.3, y + k * 0.12, k * 0.09, 0, Math.PI * 2);
  g.arc(ex + k * 0.3, y + k * 0.12, k * 0.09, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(240,120,120,0.45)";
  g.beginPath();
  g.ellipse(ex - k * 0.48, y + k * 0.4, k * 0.16, k * 0.1, 0, 0, Math.PI * 2);
  g.ellipse(ex + k * 0.48, y + k * 0.4, k * 0.16, k * 0.1, 0, 0, Math.PI * 2);
  g.fill();
  // senyum
  g.strokeStyle = "#7A3A2E";
  g.lineWidth = Math.max(1, k * 0.07);
  g.lineCap = "round";
  g.beginPath();
  g.arc(ex, y + k * 0.36, k * 0.18, 0.2 * Math.PI, 0.8 * Math.PI);
  g.stroke();
}

/** anggota badan (lengan/kaki) sebagai garis tebal membulat */
export function limb(g: Ctx, x1: number, y1: number, x2: number, y2: number, w: number, color: string, bend = 0) {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x1, y1);
  const mx = (x1 + x2) / 2 + bend * (y2 - y1) * 0.3;
  const my = (y1 + y2) / 2 - bend * (x2 - x1) * 0.3;
  g.quadraticCurveTo(mx, my, x2, y2);
  g.stroke();
}
