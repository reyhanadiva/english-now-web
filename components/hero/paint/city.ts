import {
  type Ctx,
  type PaintScene,
  type Rand,
  type View,
  G,
  S,
  X,
  cloudSprite,
  drawTree,
  fbm1,
  glow,
  grassDabs,
  layer,
  limb,
  makeTree,
  makeView,
  mod,
  rays,
  rng,
  skyGradient,
  tuft,
} from "./kit";

/**
 * KOTA (Dewasa & Bisnis): senja hangat di tepi sungai.
 * Lampu gedung menyala, kereta melintas di jembatan, cahaya kota memantul di air.
 * Orang-orang di promenade: berjalan pulang kerja, bersepeda, dua orang di bangku
 * (satu dengan laptop, satu membaca). Matahari terbenam di celah gedung.
 */

const WATER_END = 0.3;
const BRIDGE_D = 0.15;
const PROM = { d0: 0.38, d1: 0.47 };
const LEAF = { dark: "#1E3A55", mid: "#2D5270", light: "#46708A", hi: "#8E8FB8" };
const GRASS = ["#2F5563", "#3E6470", "#4B7380", "#5A8590", "#284A5A"];
const DABS = ["#4F7A86", "#55808C", "#3F6878", "#5E8A94"];

type Tower = { x: number; w: number; h: number; top: number; lit: [number, number, number][]; cols: number; rows: number; beacon: boolean; tone: number };
type Cloud = { s: ReturnType<typeof cloudSprite>; x: number; f: number; sp: number };

function makeTowers(r: Rand, far: boolean): Tower[] {
  const out: Tower[] = [];
  let x = -1.3;
  while (x < 1.3) {
    const w = (far ? 0.022 : 0.028) + r() * (far ? 0.03 : 0.034);
    const ax = Math.abs(x + w / 2);
    const cluster = Math.exp(-(((ax - 0.36) / 0.22) ** 2));
    const center = Math.exp(-(((x + w / 2) / 0.09) ** 2));
    const h = Math.max(0.03, (0.04 + 0.2 * cluster - 0.035 * center) * (0.5 + r() * 0.6) * (far ? 0.85 : 1));
    const cols = Math.max(2, Math.round(w / 0.0075));
    const rows = Math.max(3, Math.round(h / 0.0105));
    const lit: [number, number, number][] = [];
    if (!far) for (let c = 0; c < cols; c++) for (let k = 1; k < rows; k++) if (r() < 0.4) lit.push([c, k, r()]);
    out.push({ x, w, h, top: Math.floor(r() * 4), lit, cols, rows, beacon: !far && h > 0.16, tone: r() });
    x += w + (r() < 0.25 ? 0.004 + r() * 0.01 : 0.0015);
  }
  return out;
}

export function createCity(): PaintScene {
  let v: View = makeView(1, 1);
  let skyL: HTMLCanvasElement | null = null;
  let cityL: HTMLCanvasElement | null = null;
  let landL: HTMLCanvasElement | null = null;
  let fgL: HTMLCanvasElement | null = null;
  let clouds: Cloud[] = [];
  let tufts: { x: number; y: number; h: number; seed: number; ph: number }[] = [];
  const r0 = rng(41);
  const far = makeTowers(r0, true);
  const towers = makeTowers(r0, false);
  const stars = Array.from({ length: 60 }, () => [(r0() - 0.5) * 3, r0() ** 1.6 * 0.4, r0() * 6.28] as const);
  const flicker = towers.flatMap((b, bi) => b.lit.filter((l) => l[2] < 0.12).map((l) => [bi, l[0], l[1], l[2] * 50] as const));

  function resize(w: number, h: number) {
    v = makeView(w, h, 0.6);

    /* ---------- langit ---------- */
    const sky = layer(w, h);
    skyGradient(sky.g, v, [
      [0, "#1F2B7A"],
      [0.3, "#3949AB"],
      [0.56, "#7A6CC6"],
      [0.78, "#DB98B5"],
      [0.92, "#FFB68B"],
      [1, "#FFDA9E"],
    ]);
    glow(sky.g, v.cx, v.hz, v.u * 0.85, "255,196,130", 0.95);
    rays(sky.g, v.cx, v.hz, v.u * 0.8, "255,214,170", 0.07, rng(3), 9);
    sky.g.fillStyle = "#FFE9B4";
    sky.g.beginPath();
    sky.g.arc(v.cx, v.hz - v.u * 0.012, v.u * 0.045, 0, Math.PI * 2);
    sky.g.fill();
    moon(sky.g, v);
    skyL = sky.c;

    const pal = { shade: "#5E56A8", mid: "#8C78C0", light: "#E7A3BC", rim: "#FFD0B0", under: true };
    const spec: [number, number, number, number, boolean][] = [
      [-0.82, 0.36, 0.5, 0.15, true],
      [0.8, 0.3, 0.54, 0.16, true],
      [-0.22, 0.12, 0.32, 0.07, true],
      [0.34, 0.62, 0.38, 0.09, true],
      [-0.55, 0.7, 0.32, 0.08, true],
      [1.35, 0.56, 0.4, 0.1, true],
    ];
    clouds = spec.map(([x, f, cw, ch, flat], i) => ({
      s: cloudSprite(rng(200 + i), cw * v.u, ch * v.u, pal, flat),
      x,
      f,
      sp: 0.003 + (i % 3) * 0.001,
    }));

    /* ---------- kota + air + jembatan ---------- */
    const city = layer(w, h);
    const g = city.g;
    drawTowers(g, v, far, true);
    drawTowers(g, v, towers, false);
    // kabut senja di kaki kota
    const haze = g.createLinearGradient(0, v.hz - v.u * 0.05, 0, v.hz);
    haze.addColorStop(0, "rgba(255,190,160,0)");
    haze.addColorStop(1, "rgba(255,190,160,0.5)");
    g.fillStyle = haze;
    g.fillRect(0, v.hz - v.u * 0.05, v.w, v.u * 0.05 + 1);

    const y1 = G(v, WATER_END + 0.06);
    const wg = g.createLinearGradient(0, v.hz, 0, y1);
    wg.addColorStop(0, "#F4B48F");
    wg.addColorStop(0.15, "#C98AAE");
    wg.addColorStop(0.5, "#6A66B6");
    wg.addColorStop(1, "#3A4290");
    g.fillStyle = wg;
    g.fillRect(0, v.hz, v.w, y1 - v.hz);
    // pantulan siluet gedung + lampu
    for (const b of towers) {
      const x = X(v, b.x);
      const bw = b.w * v.u;
      const rh = Math.min(b.h * v.u * 0.5, y1 - v.hz);
      g.fillStyle = "rgba(40,44,120,0.32)";
      g.fillRect(x, v.hz, bw, rh);
      if (b.lit.length > 6) {
        for (let i = 0; i < 7; i++) {
          g.fillStyle = `rgba(255,214,140,${0.28 * (1 - i / 7)})`;
          g.fillRect(x + bw * 0.2, v.hz + (i + 0.5) * (rh / 7), bw * 0.6, Math.max(1, v.u * 0.002));
        }
      }
    }
    bridge(g, v);
    cityL = city.c;

    /* ---------- tepian & promenade ---------- */
    const land = layer(w, h);
    const lg = land.g;
    const surf = (x: number) => G(v, WATER_END) + (fbm1(((x - v.cx) / v.u) * 2.2 + 4.1) - 0.5) * v.u * 0.03;
    lg.fillStyle = "#6E6EAE";
    lg.beginPath();
    lg.moveTo(0, v.h);
    for (let x = 0; x <= v.w + 4; x += 4) lg.lineTo(x, surf(x) - v.u * 0.007);
    lg.lineTo(v.w, v.h);
    lg.closePath();
    lg.fill();
    const bg = lg.createLinearGradient(0, G(v, WATER_END) - v.u * 0.03, 0, v.h);
    bg.addColorStop(0, "#628A93");
    bg.addColorStop(0.35, "#45697B");
    bg.addColorStop(1, "#2F5064");
    lg.fillStyle = bg;
    lg.beginPath();
    lg.moveTo(0, v.h);
    for (let x = 0; x <= v.w + 4; x += 4) lg.lineTo(x, surf(x));
    lg.lineTo(v.w, v.h);
    lg.closePath();
    lg.fill();
    grassDabs(lg, v, rng(8), G(v, WATER_END), v.h, 800, DABS, 1.1);
    // jalan promenade
    const p0 = G(v, PROM.d0);
    const p1 = G(v, PROM.d1);
    const pg = lg.createLinearGradient(0, p0, 0, p1);
    pg.addColorStop(0, "#A7A4CF");
    pg.addColorStop(1, "#8C89BC");
    lg.fillStyle = pg;
    lg.fillRect(0, p0, v.w, p1 - p0);
    lg.fillStyle = "rgba(255,255,255,0.18)";
    lg.fillRect(0, p0, v.w, Math.max(1, v.u * 0.003));
    // genangan cahaya lampu di jalan
    for (const xu of LAMPS) {
      const x = X(v, xu);
      const gl = lg.createRadialGradient(x, (p0 + p1) / 2, 0, x, (p0 + p1) / 2, v.u * 0.1);
      gl.addColorStop(0, "rgba(255,214,140,0.5)");
      gl.addColorStop(1, "rgba(255,214,140,0)");
      lg.fillStyle = gl;
      lg.beginPath();
      lg.ellipse(x, (p0 + p1) / 2, v.u * 0.1, (p1 - p0) * 0.8, 0, 0, Math.PI * 2);
      lg.fill();
    }
    // pohon
    const tr = rng(61);
    const t1 = makeTree(tr, v.u * 0.4, LEAF, "#1C2E44", "#3A4E66", 0.8);
    const t2 = makeTree(tr, v.u * 0.22, LEAF, "#1C2E44", "#3A4E66", 0.8);
    drawTree(lg, t2, X(v, -0.62), G(v, PROM.d0 - 0.01));
    const t3 = makeTree(tr, v.u * 0.36, LEAF, "#1C2E44", "#3A4E66", -0.8);
    const t4 = makeTree(tr, v.u * 0.2, LEAF, "#1C2E44", "#3A4E66", -0.8);
    drawTree(lg, t4, X(v, 1.06), G(v, PROM.d0 - 0.01));
    // tiang lampu
    for (const xu of LAMPS) lampPost(lg, v, X(v, xu));
    // bangku
    bench(lg, v, X(v, BENCH_X), G(v, PROM.d0 + 0.015));
    landL = land.c;

    /* ---------- depan ---------- */
    const fg = layer(w, h);
    // pohon depan digambar di lapisan depan, supaya orang yang lewat berada di belakangnya
    drawTree(fg.g, t1, X(v, -0.84), G(v, 0.66));
    drawTree(fg.g, t3, X(v, 0.88), G(v, 0.64));
    const fr = rng(71);
    for (let i = 0; i < 120; i++) {
      const x = fr() * v.w;
      const d = 0.55 + fr() * 0.2;
      tuft(fg.g, x, G(v, d), v.u * (0.018 + (d - 0.5) * 0.08), GRASS, fr, (fr() - 0.5) * 0.4, 5);
    }
    for (let i = 0; i < 220; i++) {
      const x = fr() * v.w;
      const d = 0.72 + fr() * 0.32;
      tuft(fg.g, x, G(v, d), v.u * (0.03 + (d - 0.7) * 0.11), GRASS, fr, (fr() - 0.5) * 0.4, 6);
    }
    fgL = fg.c;
    tufts = Array.from({ length: 26 }, () => ({
      x: fr() * v.w,
      y: G(v, 0.76 + fr() * 0.2),
      h: v.u * (0.055 + fr() * 0.05),
      seed: Math.floor(fr() * 1e6),
      ph: fr() * 6.28,
    }));
  }

  function draw(ctx: Ctx, t: number) {
    if (!skyL || !cityL || !landL || !fgL) return;
    ctx.drawImage(skyL, 0, 0);
    // bintang berkelip
    for (const [x, f, ph] of stars) {
      if (Math.abs(x) > v.half + 0.02) continue;
      const a = (0.25 + 0.6 * Math.max(0, Math.sin(t * 0.9 + ph))) * (1 - f * 1.8);
      ctx.fillStyle = `rgba(255,246,220,${a})`;
      const k = Math.max(1, v.u * 0.0018);
      ctx.fillRect(X(v, x), S(v, f), k, k);
    }
    for (const c of clouds) {
      const span = v.half + 0.6;
      const xu = mod(c.x + c.sp * t + span, span * 2) - span;
      ctx.drawImage(c.s.c, X(v, xu) - c.s.ox, S(v, c.f) - c.s.oy);
    }
    plane(ctx, v, t);
    ctx.drawImage(cityL, 0, 0);

    // jendela yang menyala-padam & lampu suar
    for (const [bi, c, k, ph] of flicker) {
      const b = towers[bi];
      if (Math.sin(t * 0.25 + ph) > 0) continue;
      const bw = b.w * v.u;
      const bh = b.h * v.u;
      const cw = bw / b.cols;
      const ch = (bh * 0.94) / b.rows;
      ctx.fillStyle = "#3A3F92";
      ctx.fillRect(X(v, b.x) + c * cw + cw * 0.24, v.hz - bh + bh * 0.06 + k * ch, Math.max(1, cw * 0.52), Math.max(1, ch * 0.44));
    }
    for (const b of towers) {
      if (!b.beacon || Math.sin(t * 3 + b.x * 10) < 0.4) continue;
      glow(ctx, X(v, b.x + b.w / 2), v.hz - b.h * v.u - v.u * 0.03, v.u * 0.012, "255,90,90", 1);
    }
    shimmer(ctx, v, t);
    train(ctx, v, t);

    ctx.drawImage(landL, 0, 0);
    for (const xu of LAMPS) {
      const flick = 0.85 + 0.15 * Math.sin(t * 7 + xu * 9);
      glow(ctx, X(v, xu), G(v, PROM.d0) - v.u * 0.105, v.u * 0.05, "255,226,160", flick);
    }
    people(ctx, v, t);

    ctx.drawImage(fgL, 0, 0);
    for (const tf of tufts) {
      const bend = Math.sin(t * 1.1 + tf.ph + tf.x * 0.004) * 0.22;
      tuft(ctx, tf.x, tf.y, tf.h, GRASS, rng(tf.seed), bend, 7);
    }
  }

  return { resize, draw };
}

/* ------------------------------------------------------------------ */

const LAMPS = [-0.58, -0.2, 0.2, 0.62];
const BENCH_X = 0.4;

function drawTowers(g: Ctx, v: View, list: Tower[], far: boolean) {
  for (const b of list) {
    const x = X(v, b.x);
    const bw = b.w * v.u;
    const bh = b.h * v.u;
    if (x + bw < -20 || x > v.w + 20) continue;
    const top = v.hz - bh;
    const gr = g.createLinearGradient(0, top, 0, v.hz);
    if (far) {
      gr.addColorStop(0, "#8C82CA");
      gr.addColorStop(1, "#C9A8CE");
    } else {
      gr.addColorStop(0, b.tone > 0.5 ? "#2C3485" : "#353B8E");
      gr.addColorStop(1, b.tone > 0.5 ? "#4C4799" : "#5852A2");
    }
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x, v.hz + 2);
    if (b.top === 1 && bh > v.u * 0.08) {
      g.lineTo(x, top + bh * 0.07);
      g.lineTo(x + bw, top);
    } else if (b.top === 2) {
      g.lineTo(x, top + bh * 0.05);
      g.lineTo(x + bw * 0.2, top + bh * 0.05);
      g.lineTo(x + bw * 0.2, top);
      g.lineTo(x + bw * 0.8, top);
      g.lineTo(x + bw * 0.8, top + bh * 0.05);
      g.lineTo(x + bw, top + bh * 0.05);
    } else {
      g.lineTo(x, top);
      g.lineTo(x + bw, top);
    }
    g.lineTo(x + bw, v.hz + 2);
    g.closePath();
    g.fill();
    if (b.top === 3 && bh > v.u * 0.12) g.fillRect(x + bw / 2 - Math.max(1, bw * 0.03), top - v.u * 0.03, Math.max(2, bw * 0.06), v.u * 0.03);
    if (far) continue;
    // cahaya senja di sisi gedung yang menghadap matahari
    const sunSide = b.x + b.w / 2 < 0;
    const rim = g.createLinearGradient(0, top, 0, v.hz);
    rim.addColorStop(0, "rgba(255,190,150,0.75)");
    rim.addColorStop(1, "rgba(255,190,150,0.2)");
    g.fillStyle = rim;
    g.fillRect(sunSide ? x + bw - Math.max(1.5, bw * 0.08) : x, top + bh * 0.06, Math.max(1.5, bw * 0.08), bh * 0.94);
    const cw = bw / b.cols;
    const ch = (bh * 0.94) / b.rows;
    for (const [c, k, ph] of b.lit) {
      g.fillStyle = ph > 0.7 ? "#FFF0B8" : ph > 0.3 ? "#FFD98A" : "#FFC772";
      g.fillRect(x + c * cw + cw * 0.24, top + bh * 0.06 + k * ch, Math.max(1, cw * 0.52), Math.max(1, ch * 0.44));
    }
  }
}

function bridge(g: Ctx, v: View) {
  const y = G(v, BRIDGE_D);
  const deck = Math.max(2, v.u * 0.01);
  const waterY = G(v, WATER_END + 0.02);
  const span = 0.16;
  g.fillStyle = "#2A2F78";
  g.strokeStyle = "#2A2F78";
  g.lineWidth = Math.max(1.5, v.u * 0.004);
  for (let xu = -2; xu <= 2; xu += span) {
    const px = X(v, xu);
    if (px < -v.u * 0.3 || px > v.w + v.u * 0.3) continue;
    const pw = Math.max(2, v.u * 0.007);
    g.fillRect(px - pw / 2, y + deck, pw, waterY - y - deck);
    g.beginPath();
    g.moveTo(px, y + deck + v.u * 0.032);
    g.quadraticCurveTo(px + (span * v.u) / 2, y + deck - v.u * 0.002, px + span * v.u, y + deck + v.u * 0.032);
    g.stroke();
    g.fillStyle = "rgba(42,47,120,0.35)";
    g.fillRect(px - pw / 2, waterY, pw, v.u * 0.03);
    g.fillStyle = "#2A2F78";
  }
  g.fillStyle = "#262B70";
  g.fillRect(0, y, v.w, deck);
  g.fillStyle = "rgba(255,200,170,0.5)";
  g.fillRect(0, y, v.w, Math.max(1, deck * 0.25));
  g.fillStyle = "rgba(255,220,150,0.95)";
  for (let xu = -2; xu <= 2; xu += 0.05) {
    const px = X(v, xu);
    if (px < 0 || px > v.w) continue;
    g.beginPath();
    g.arc(px, y + deck * 0.55, Math.max(1, v.u * 0.0018), 0, Math.PI * 2);
    g.fill();
  }
}

function shimmer(ctx: Ctx, v: View, t: number) {
  const depth = G(v, WATER_END) - v.hz;
  for (let i = 0; i < 60; i++) {
    const s = mod(i * 0.618 + t * 0.012, 1);
    const off = Math.sin(i * 12.9898) * 0.5;
    const yy = v.hz + s * depth;
    const spread = v.u * (0.02 + s * 0.12);
    const a = (0.3 + 0.5 * Math.max(0, Math.sin(t * 2.4 + i))) * (1 - s * 0.6);
    const len = v.u * (0.012 + s * 0.03);
    ctx.fillStyle = `rgba(255,226,160,${a})`;
    ctx.fillRect(v.cx + off * spread * 2 - len / 2, yy, len, Math.max(1, v.u * (0.0015 + s * 0.002)));
  }
}

function train(ctx: Ctx, v: View, t: number) {
  const y = G(v, BRIDGE_D);
  const cycle = 12;
  const p = mod(t + 3, cycle) / 7;
  if (p > 1) return;
  const reach = v.half + 0.75;
  const len = 0.56 * v.u;
  const x = X(v, reach - p * reach * 2);
  const th = Math.max(4, v.u * 0.019);
  trainBody(ctx, x, y, len, th, true);
  const waterY = G(v, WATER_END + 0.02);
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.translate(0, waterY + (waterY - y) * 0.05);
  ctx.scale(1, -0.55);
  trainBody(ctx, x, 0, len, th, false);
  ctx.restore();
}

function trainBody(ctx: Ctx, x: number, y: number, len: number, th: number, light: boolean) {
  const cars = 4;
  const gap = th * 0.22;
  const cl = (len - gap * (cars - 1)) / cars;
  for (let i = 0; i < cars; i++) {
    const cx = x + i * (cl + gap);
    ctx.fillStyle = "#EEF0FA";
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(cx + th, y - th);
      ctx.lineTo(cx + cl, y - th);
      ctx.lineTo(cx + cl, y);
      ctx.lineTo(cx, y);
      ctx.quadraticCurveTo(cx, y - th, cx + th, y - th);
    } else ctx.roundRect(cx, y - th, cl, th, th * 0.15);
    ctx.fill();
    ctx.fillStyle = "#C9CDEB";
    ctx.fillRect(cx + (i === 0 ? th * 0.5 : 0), y - th * 0.18, cl - (i === 0 ? th * 0.5 : 0), th * 0.18);
    ctx.fillStyle = "#405FDA";
    ctx.fillRect(cx + (i === 0 ? th * 0.35 : 0), y - th * 0.34, cl - (i === 0 ? th * 0.35 : 0), th * 0.12);
    ctx.fillStyle = "#FFE08A";
    const wn = Math.max(2, Math.floor(cl / (th * 0.95)));
    for (let k = 0; k < wn; k++) {
      const wx = cx + (i === 0 ? th * 1.15 : th * 0.3) + k * ((cl - th * 0.5) / wn);
      if (wx > cx + cl - th * 0.45) continue;
      ctx.beginPath();
      ctx.roundRect(wx, y - th * 0.8, th * 0.52, th * 0.36, th * 0.08);
      ctx.fill();
    }
  }
  if (light) glow(ctx, x + th * 0.2, y - th * 0.45, th * 4, "255,240,190", 0.8);
}

function plane(ctx: Ctx, v: View, t: number) {
  const p = mod((t + 18) / 46, 1);
  const span = v.half + 0.4;
  const x = X(v, span - p * span * 2);
  const y = S(v, 0.16) + p * v.u * 0.03;
  const s = v.u * 0.011;
  const tr = ctx.createLinearGradient(x, y, x + v.u * 0.4, y);
  tr.addColorStop(0, "rgba(255,210,200,0.8)");
  tr.addColorStop(1, "rgba(255,210,200,0)");
  ctx.strokeStyle = tr;
  ctx.lineWidth = Math.max(1, s * 0.22);
  ctx.beginPath();
  ctx.moveTo(x + s, y);
  ctx.lineTo(x + v.u * 0.4, y - v.u * 0.012);
  ctx.stroke();
  ctx.fillStyle = "#DADDF5";
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.22, -0.03, 0, Math.PI * 2);
  ctx.fill();
  if (Math.sin(t * 6) > 0.5) glow(ctx, x, y - s * 0.1, s * 0.8, "255,106,106", 1);
}

function lampPost(g: Ctx, v: View, x: number) {
  const base = G(v, PROM.d0);
  const hgt = v.u * 0.105;
  const w = Math.max(2, v.u * 0.004);
  g.fillStyle = "#1E2654";
  g.fillRect(x - w / 2, base - hgt, w, hgt);
  g.fillRect(x - w * 1.5, base - w, w * 3, w);
  g.beginPath();
  g.roundRect(x - w * 1.6, base - hgt - w * 2.2, w * 3.2, w * 2.4, w * 0.6);
  g.fill();
  g.fillStyle = "#FFF1C6";
  g.beginPath();
  g.roundRect(x - w * 1.1, base - hgt - w * 1.8, w * 2.2, w * 1.6, w * 0.4);
  g.fill();
}

function bench(g: Ctx, v: View, x: number, y: number) {
  const w = v.u * 0.085;
  const k = v.u * 0.004;
  g.fillStyle = "#3B2F4A";
  g.fillRect(x - w / 2 + k, y - k * 4.5, k, k * 4.5);
  g.fillRect(x + w / 2 - k * 2, y - k * 4.5, k, k * 4.5);
  g.fillStyle = "#8B5E3C";
  g.fillRect(x - w / 2, y - k * 5, w, k * 1.2);
  g.fillRect(x - w / 2, y - k * 9, w, k * 1.1);
  g.fillRect(x - w / 2, y - k * 7.4, w, k * 1.1);
}

/* ---------- orang-orang ---------- */

function adult(
  ctx: Ctx,
  x: number,
  y: number,
  k: number,
  o: { skin: string; hair: string; top: string; pants: string; walk?: number; face: 1 | -1; bag?: string; hairLong?: boolean },
) {
  const walk = o.walk ?? 0;
  const sw = Math.sin(walk) * 0.5;
  const hip = { x, y: y - k * 3.4 };
  limb(ctx, hip.x, hip.y, x + Math.sin(walk) * k * 1.1, y, k * 0.62, o.pants);
  limb(ctx, hip.x, hip.y, x - Math.sin(walk) * k * 1.1, y, k * 0.62, o.pants);
  // badan
  ctx.fillStyle = o.top;
  ctx.beginPath();
  ctx.roundRect(x - k * 0.85, y - k * 6.6, k * 1.7, k * 3.5, k * 0.6);
  ctx.fill();
  // lengan
  limb(ctx, x, y - k * 6.1, x - o.face * sw * k * 1.4, y - k * 3.6, k * 0.5, o.top);
  limb(ctx, x, y - k * 6.1, x + o.face * sw * k * 1.4, y - k * 3.6, k * 0.5, o.top);
  if (o.bag) {
    ctx.fillStyle = o.bag;
    ctx.beginPath();
    ctx.roundRect(x + o.face * sw * k * 1.4 - k * 0.8, y - k * 3.6, k * 1.6, k * 1.2, k * 0.2);
    ctx.fill();
  }
  // kepala
  ctx.fillStyle = o.skin;
  ctx.beginPath();
  ctx.arc(x + o.face * k * 0.08, y - k * 7.5, k * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = o.hair;
  ctx.beginPath();
  ctx.arc(x - o.face * k * 0.1, y - k * 7.75, k * 0.85, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  if (o.hairLong) {
    ctx.beginPath();
    ctx.ellipse(x - o.face * k * 0.55, y - k * 7.1, k * 0.45, k * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function people(ctx: Ctx, v: View, t: number) {
  const k = v.u * 0.011;
  // pekerja berjalan pulang (kiri → kanan)
  const span = v.half + 0.12;
  const p1 = mod((t + 4) / 34, 1);
  const wx = X(v, -span + p1 * span * 2);
  const wy = G(v, PROM.d0 + 0.06);
  ctx.fillStyle = "rgba(20,24,60,0.18)";
  ctx.beginPath();
  ctx.ellipse(wx, wy, k * 1.6, k * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  adult(ctx, wx, wy, k, { skin: "#E3A982", hair: "#2B2320", top: "#405FDA", pants: "#1E2654", walk: t * 5, face: 1, bag: "#5A3A26" });

  // pesepeda (kanan → kiri), lebih cepat
  const p2 = mod((t + 11) / 18, 1);
  const cx = X(v, span - p2 * span * 2);
  const cy = G(v, PROM.d0 + 0.035);
  cyclist(ctx, cx, cy, k, t);

  // dua orang duduk di bangku: satu dengan laptop, satu membaca buku
  const bx = X(v, BENCH_X);
  const by = G(v, PROM.d0 + 0.015);
  const kb = v.u * 0.004;
  const seatY = by - kb * 5;
  const turn = Math.sin(t * 0.5) > 0.6 ? 1 : 0; // sesekali menoleh ke temannya
  seated(ctx, bx - v.u * 0.02, seatY, by, k, { skin: "#C98B60", hair: "#1E1A1A", top: "#FFD23F", pants: "#2E3A5C", face: turn ? 1 : 0, hairLong: true });
  seated(ctx, bx + v.u * 0.02, seatY, by, k, { skin: "#F5CDA8", hair: "#6B3A22", top: "#EDEFF8", pants: "#3D3B6E", face: turn ? -1 : 0 });
  // laptop di pangkuan (punggung laptop menghadap kita) + cahaya layar
  const lx = bx - v.u * 0.02;
  glow(ctx, lx, seatY - k * 1.6, k * 3.2, "190,220,255", 0.3 + 0.05 * Math.sin(t * 2));
  ctx.fillStyle = "#C9CDEB";
  ctx.beginPath();
  ctx.roundRect(lx - k * 1.1, seatY - k * 1.7, k * 2.2, k * 1.4, k * 0.15);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(lx, seatY - k * 1.0, k * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // buku di tangan
  const rx = bx + v.u * 0.02;
  ctx.fillStyle = "#07A9F8";
  ctx.beginPath();
  ctx.roundRect(rx - k * 0.85, seatY - k * 2.3, k * 1.7, k * 1.3, k * 0.1);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(rx - k * 0.5, seatY - k * 1.95, k * 1.0, Math.max(1, k * 0.15));
  ctx.fillStyle = "#F5CDA8";
  ctx.beginPath();
  ctx.arc(rx - k * 0.85, seatY - k * 1.6, k * 0.25, 0, Math.PI * 2);
  ctx.arc(rx + k * 0.85, seatY - k * 1.6, k * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/** orang duduk tampak depan; seatY = tinggi dudukan bangku, footY = tanah */
function seated(
  ctx: Ctx,
  x: number,
  seatY: number,
  footY: number,
  k: number,
  o: { skin: string; hair: string; top: string; pants: string; face: -1 | 0 | 1; hairLong?: boolean },
) {
  // paha (pendek karena menghadap kita) + betis turun ke tanah
  ctx.fillStyle = o.pants;
  ctx.beginPath();
  ctx.roundRect(x - k * 0.95, seatY - k * 0.5, k * 1.9, k * 0.9, k * 0.35);
  ctx.fill();
  limb(ctx, x - k * 0.45, seatY + k * 0.2, x - k * 0.5, footY - k * 0.2, k * 0.55, o.pants);
  limb(ctx, x + k * 0.45, seatY + k * 0.2, x + k * 0.5, footY - k * 0.2, k * 0.55, o.pants);
  ctx.fillStyle = "#2A2230";
  ctx.beginPath();
  ctx.ellipse(x - k * 0.55, footY - k * 0.1, k * 0.4, k * 0.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + k * 0.55, footY - k * 0.1, k * 0.4, k * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // badan
  ctx.fillStyle = o.top;
  ctx.beginPath();
  ctx.roundRect(x - k * 0.95, seatY - k * 3.6, k * 1.9, k * 3.3, [k * 0.8, k * 0.8, k * 0.3, k * 0.3]);
  ctx.fill();
  limb(ctx, x - k * 0.8, seatY - k * 3.0, x - k * 0.7, seatY - k * 1.5, k * 0.45, o.top);
  limb(ctx, x + k * 0.8, seatY - k * 3.0, x + k * 0.7, seatY - k * 1.5, k * 0.45, o.top);
  // kepala
  const hx = x + o.face * k * 0.15;
  const hy = seatY - k * 4.5;
  if (o.hairLong) {
    // rambut panjang di belakang kepala, jatuh ke bahu
    ctx.fillStyle = o.hair;
    ctx.beginPath();
    ctx.roundRect(hx - k * 1.0, hy - k * 0.4, k * 2.0, k * 1.9, [k * 0.9, k * 0.9, k * 0.3, k * 0.3]);
    ctx.fill();
  }
  ctx.fillStyle = o.skin;
  ctx.beginPath();
  ctx.arc(hx, hy, k * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = o.hair;
  ctx.beginPath();
  ctx.ellipse(hx - o.face * k * 0.1, hy - k * 0.35, k * 0.9, k * 0.55, 0, Math.PI, 0);
  ctx.fill();
  // wajah sederhana (menghadap kita / menoleh ke teman)
  const ex = hx + o.face * k * 0.22;
  ctx.fillStyle = "#2A2230";
  ctx.beginPath();
  ctx.arc(ex - k * 0.28, hy + k * 0.1, Math.max(0.8, k * 0.09), 0, Math.PI * 2);
  ctx.arc(ex + k * 0.28, hy + k * 0.1, Math.max(0.8, k * 0.09), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7A3A2E";
  ctx.lineWidth = Math.max(1, k * 0.08);
  ctx.beginPath();
  ctx.arc(ex, hy + k * 0.35, k * 0.18, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

function cyclist(ctx: Ctx, x: number, y: number, k: number, t: number) {
  // digambar menghadap kanan, lalu dicerminkan karena melaju ke kiri
  ctx.save();
  ctx.translate(x * 2, 0);
  ctx.scale(-1, 1);
  const wr = k * 1.5;
  // dicerminkan karena melaju ke kiri, jadi putaran lokal searah jarum jam = berputar ke kiri di layar
  const rot = t * 6;
  ctx.fillStyle = "rgba(20,24,60,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y, k * 3, k * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1E2654";
  ctx.lineWidth = Math.max(1, k * 0.25);
  for (const dx of [-k * 2, k * 2]) {
    ctx.beginPath();
    ctx.arc(x + dx, y - wr, wr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + dx + Math.cos(rot) * wr, y - wr + Math.sin(rot) * wr);
    ctx.lineTo(x + dx - Math.cos(rot) * wr, y - wr - Math.sin(rot) * wr);
    ctx.stroke();
  }
  // rangka
  ctx.strokeStyle = "#E8433F";
  ctx.lineWidth = Math.max(1, k * 0.3);
  ctx.beginPath();
  ctx.moveTo(x - k * 2, y - wr);
  ctx.lineTo(x, y - wr);
  ctx.lineTo(x + k * 1.2, y - wr * 2.2);
  ctx.lineTo(x - k * 0.6, y - wr * 2.2);
  ctx.lineTo(x, y - wr);
  ctx.moveTo(x + k * 2, y - wr);
  ctx.lineTo(x + k * 1.2, y - wr * 2.2);
  ctx.lineTo(x + k * 1.6, y - wr * 2.6);
  ctx.stroke();
  // pengendara (menghadap kiri)
  const hip = { x: x - k * 0.5, y: y - wr * 2.4 };
  const ped = { x: x + Math.cos(rot) * k * 0.7, y: y - wr + Math.sin(rot) * k * 0.7 };
  limb(ctx, hip.x, hip.y, ped.x, ped.y, k * 0.6, "#2E3A5C", 0.6);
  ctx.fillStyle = "#07A9F8";
  ctx.save();
  ctx.translate(hip.x, hip.y);
  ctx.rotate(0.35);
  ctx.beginPath();
  ctx.roundRect(-k * 0.85, -k * 3.4, k * 1.7, k * 3.4, k * 0.6);
  ctx.fill();
  ctx.restore();
  limb(ctx, hip.x + k * 0.9, hip.y - k * 2.6, x + k * 1.6, y - wr * 2.6, k * 0.45, "#07A9F8");
  ctx.fillStyle = "#E3A982";
  ctx.beginPath();
  ctx.arc(hip.x + k * 1.3, hip.y - k * 3.7, k * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFD23F";
  ctx.beginPath();
  ctx.arc(hip.x + k * 1.3, hip.y - k * 3.95, k * 0.92, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function moon(g: Ctx, v: View) {
  const x = X(v, 0.6);
  const y = S(v, 0.5);
  const r = v.u * 0.032;
  glow(g, x, y, r * 4.5, "255,240,210", 0.35);
  const m = layer(r * 3, r * 3);
  m.g.fillStyle = "#FFF4D6";
  m.g.beginPath();
  m.g.arc(r * 1.5, r * 1.5, r, 0, Math.PI * 2);
  m.g.fill();
  m.g.globalCompositeOperation = "destination-out";
  m.g.beginPath();
  m.g.arc(r * 1.5 + r * 0.45, r * 1.5 - r * 0.25, r * 0.88, 0, Math.PI * 2);
  m.g.fill();
  g.drawImage(m.c, x - r * 1.5, y - r * 1.5);
}
