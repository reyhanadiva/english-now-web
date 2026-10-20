import {
  type Ctx,
  type PaintScene,
  type View,
  G,
  S,
  X,
  cloudSprite,
  daisy,
  drawTree,
  farTree,
  fbm1,
  glow,
  grassDabs,
  hillShape,
  kidHead,
  layer,
  limb,
  makeTree,
  makeView,
  mod,
  rays,
  rng,
  shadow,
  skyGradient,
  tuft,
} from "./kit";

/**
 * TAMAN (Anak & Remaja): pagi yang cerah dan hangat.
 * Anak-anak bermain: layangan (temannya bersorak), ayunan di pohon besar,
 * dua anak piknik sambil membaca buku ditemani anak anjing, kelinci melompat.
 * Jalan setapak berkelok menuju cahaya matahari di cakrawala.
 */

const SKIN = ["#F5CDA8", "#E3A982", "#C98B60", "#8D5A3B"];
const LEAF = { dark: "#2E7A4A", mid: "#45A05A", light: "#79C46A", hi: "#B8E38A" };
const LEAF2 = { dark: "#3A8752", mid: "#56AE62", light: "#8ACF73", hi: "#C9EC98" };
const GRASS_FG = ["#3F9A4C", "#56B259", "#6CC464", "#8BD474", "#2F8442"];
const DABS = ["#A6DB84", "#8DCF72", "#C2E89C", "#74BE63", "#D8F0B0"];

type Cloud = { s: ReturnType<typeof cloudSprite>; x: number; f: number; sp: number };
type Tuft = { x: number; y: number; h: number; seed: number; ph: number };

export function createPark(): PaintScene {
  let v: View = makeView(1, 1);
  let skyL: HTMLCanvasElement | null = null;
  let landL: HTMLCanvasElement | null = null;
  let fgL: HTMLCanvasElement | null = null;
  let clouds: Cloud[] = [];
  let tufts: Tuft[] = [];
  let leftSurf = (x: number) => x;
  let rightSurf = (x: number) => x;
  let bigTreeBase = { x: 0, y: 0, h: 0 };

  function resize(w: number, h: number) {
    v = makeView(w, h, 0.62);
    const r = rng(11);

    /* ---------- langit ---------- */
    const sky = layer(w, h);
    skyGradient(sky.g, v, [
      [0, "#4C97E8"],
      [0.42, "#86C3F5"],
      [0.78, "#CFEAFB"],
      [1, "#FFF1C4"],
    ]);
    glow(sky.g, v.cx, v.hz, v.u * 0.75, "255,236,170", 0.9);
    rays(sky.g, v.cx, v.hz, v.u * 0.9, "255,245,210", 0.08, rng(4), 10);
    sky.g.fillStyle = "#FFF8D8";
    sky.g.beginPath();
    sky.g.arc(v.cx, v.hz - v.u * 0.02, v.u * 0.045, 0, Math.PI * 2);
    sky.g.fill();
    skyL = sky.c;

    /* ---------- awan ---------- */
    const pal = { shade: "#BCCBF0", mid: "#E6EEFC", light: "#FFFFFF" };
    const spec: [number, number, number, number, boolean][] = [
      // x, f(posisi langit), lebar(u), tinggi(u), pipih
      [-0.8, 0.42, 0.46, 0.2, false],
      [0.84, 0.36, 0.5, 0.22, false],
      [-0.28, 0.16, 0.26, 0.06, true],
      [0.4, 0.13, 0.22, 0.05, true],
      [-0.45, 0.86, 0.3, 0.1, false],
      [0.52, 0.88, 0.26, 0.08, false],
      [1.3, 0.66, 0.34, 0.13, false],
      [-1.35, 0.68, 0.34, 0.13, false],
    ];
    clouds = spec.map(([x, f, cw, ch, flat], i) => ({
      s: cloudSprite(rng(100 + i), cw * v.u, ch * v.u, pal, flat),
      x,
      f,
      sp: 0.004 + r() * 0.004,
    }));

    /* ---------- daratan ---------- */
    const land = layer(w, h);
    const g = land.g;
    // gunung jauh
    hillShape(g, v, { y: v.hz + 2, amp: 0.13, freq: 1.4, seed: 3.1, top: "#A8B9EE", bottom: "#D4DEF6" });
    hillShape(g, v, { y: v.hz + 3, amp: 0.06, freq: 2.6, seed: 8.2, top: "#AFD7B8", bottom: "#D3EBC9", light: "#E9F7D9" });
    // padang dasar
    const mg = g.createLinearGradient(0, v.hz, 0, v.h);
    mg.addColorStop(0, "#CBE9A2");
    mg.addColorStop(0.3, "#A7DA84");
    mg.addColorStop(0.7, "#7CC468");
    mg.addColorStop(1, "#5DAF58");
    g.fillStyle = mg;
    g.fillRect(0, v.hz + v.u * 0.004, v.w, v.h);
    // pohon kecil di kejauhan
    const fr = rng(21);
    for (let i = 0; i < 22; i++) {
      const xu = (fr() - 0.5) * 2.6;
      if (Math.abs(xu) < 0.08) continue;
      const y = G(v, 0.01 + fr() * 0.03);
      farTree(g, X(v, xu), y, v.u * (0.012 + fr() * 0.012), "#5E9E6E", "#8CC487", fr() > 0.7);
    }
    grassDabs(g, v, rng(5), v.hz + 4, v.h, 900, DABS, 1);

    // bukit kiri & kanan (membingkai)
    const bump = (at: number, width: number, d: number, rise: number) => (x: number) => {
      const xu = (x - v.cx) / (v.u * v.sx);
      return G(v, d) - rise * v.u * Math.exp(-(((xu - at) / width) ** 2)) - (fbm1(xu * 3 + at) - 0.5) * v.u * 0.012;
    };
    leftSurf = bump(-0.72, 0.42, 0.42, 0.2);
    rightSurf = bump(0.7, 0.4, 0.4, 0.16);
    const drawBump = (surf: (x: number) => number, top: string, bottom: string) => {
      let minY = v.h;
      for (let x = 0; x <= v.w; x += 8) minY = Math.min(minY, surf(x));
      const gr = g.createLinearGradient(0, minY, 0, v.h);
      gr.addColorStop(0, top);
      gr.addColorStop(0.6, bottom);
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, v.h);
      for (let x = 0; x <= v.w + 4; x += 4) g.lineTo(x, surf(x));
      g.lineTo(v.w, v.h);
      g.closePath();
      g.fill();
    };

    // jalan setapak berkelok menuju matahari
    pathTo(g, v);

    drawBump(rightSurf, "#B5E28E", "#7EC66A");
    drawBump(leftSurf, "#ADDF89", "#76C064");
    grassDabs(g, v, rng(6), G(v, 0.2), v.h, 700, DABS, 1.2);

    // bercak bunga di padang
    const pr = rng(31);
    for (let p = 0; p < 26; p++) {
      const cd = 0.1 + pr() * 0.55;
      const cx = (pr() - 0.5) * 2.6;
      const col = [["#FFFFFF", "#FFD23F"], ["#FFF27A", "#F0A12E"], ["#F9B4CF", "#FFF2C0"], ["#FFFFFF", "#F6A5C0"]][Math.floor(pr() * 4)];
      const n = 6 + Math.floor(pr() * 10);
      for (let i = 0; i < n; i++) {
        const d = cd + (pr() - 0.5) * 0.06;
        const x = X(v, cx + (pr() - 0.5) * (0.06 + cd * 0.15));
        daisy(g, x, G(v, d), v.u * (0.003 + d * 0.009), col[0], col[1]);
      }
    }

    // pohon
    const tr = rng(41);
    const big = makeTree(tr, v.u * 0.4, LEAF, "#6B4A32", "#9A6D48", 0.7, 2);
    const bx = X(v, -0.7);
    const by = leftSurf(bx) + v.u * 0.02;
    drawTree(g, big, bx, by);
    bigTreeBase = { x: bx, y: by, h: big.h };
    const t2 = makeTree(tr, v.u * 0.28, LEAF2, "#6B4A32", "#9A6D48", -0.7, 2);
    const t2x = X(v, 0.86);
    drawTree(g, t2, t2x, rightSurf(t2x) + v.u * 0.015);
    const t3 = makeTree(tr, v.u * 0.16, LEAF2, "#6B4A32", "#9A6D48", -0.7);
    const t3x = X(v, 1.02);
    drawTree(g, t3, t3x, rightSurf(t3x) + v.u * 0.01);
    const t4 = makeTree(tr, v.u * 0.12, LEAF2, "#6B4A32", "#9A6D48", 0.7);
    const t4x = X(v, -0.32);
    drawTree(g, t4, t4x, G(v, 0.12));
    landL = land.c;

    /* ---------- depan ---------- */
    const fg = layer(w, h);
    // area tikar piknik dibiarkan bersih dari rumput depan
    const pk = v.u * 0.017;
    const onBlanket = (x: number, d: number) =>
      Math.abs(x - X(v, PICNIC.x)) < pk * 9 && Math.abs(G(v, d) - G(v, PICNIC.d)) < pk * 3.5;
    const fgr = rng(51);
    for (let i = 0; i < 140; i++) {
      const x = fgr() * v.w;
      const d = 0.52 + fgr() * 0.22;
      if (onBlanket(x, d)) continue;
      tuft(fg.g, x, G(v, d), v.u * (0.018 + (d - 0.5) * 0.08), GRASS_FG, fgr, (fgr() - 0.5) * 0.4, 5);
    }
    for (let i = 0; i < 260; i++) {
      const x = fgr() * v.w;
      const d = 0.72 + fgr() * 0.32;
      if (onBlanket(x, d)) continue;
      if (Math.abs(x - v.cx) < v.u * 0.12 && d < 0.9) continue;
      tuft(fg.g, x, G(v, d), v.u * (0.03 + (d - 0.7) * 0.12), GRASS_FG, fgr, (fgr() - 0.5) * 0.4, 6);
    }
    for (let i = 0; i < 70; i++) {
      const x = fgr() * v.w;
      const d = 0.78 + fgr() * 0.22;
      const c = fgr() > 0.3 ? ["#FFFFFF", "#FFD23F"] : ["#FFF27A", "#F0A12E"];
      daisy(fg.g, x, G(v, d) - v.u * 0.02, v.u * (0.01 + (d - 0.75) * 0.03), c[0], c[1], 0.7);
    }
    fgL = fg.c;

    tufts = Array.from({ length: 28 }, () => ({
      x: fgr() * v.w,
      y: G(v, 0.74 + fgr() * 0.2),
      h: v.u * (0.06 + fgr() * 0.05),
      seed: Math.floor(fgr() * 1e6),
      ph: fgr() * 6.28,
    }));
  }

  function draw(ctx: Ctx, t: number) {
    if (!skyL || !landL || !fgL) return;
    ctx.drawImage(skyL, 0, 0);
    for (const c of clouds) {
      const span = v.half + 0.6;
      const xu = mod(c.x + c.sp * t + span, span * 2) - span;
      ctx.drawImage(c.s.c, X(v, xu) - c.s.ox, S(v, c.f) - c.s.oy);
    }
    kite(ctx, v, t);
    ctx.drawImage(landL, 0, 0);

    swing(ctx, v, t, bigTreeBase);
    picnic(ctx, v, t, PICNIC.x, PICNIC.d);
    kiteKids(ctx, v, t, rightSurf);
    bunny(ctx, v, t);

    ctx.drawImage(fgL, 0, 0);
    for (const tf of tufts) {
      if (Math.abs(tf.x - X(v, PICNIC.x)) < v.u * 0.16 && tf.y < G(v, 0.62)) continue;
      const bend = Math.sin(t * 1.3 + tf.ph + tf.x * 0.004) * 0.25;
      tuft(ctx, tf.x, tf.y, tf.h, GRASS_FG, rng(tf.seed), bend, 7);
    }
  }

  return { resize, draw };
}

/* ------------------------------------------------------------------ */

function pathTo(g: Ctx, v: View) {
  const N = 50;
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const c = 0.11 * Math.sin(s * 5.6 + 0.9) * Math.pow(s, 0.8);
    const half = (0.004 + 0.3 * Math.pow(s, 1.7)) / 2;
    const y = G(v, s * 1.02);
    L.push([X(v, c - half), y]);
    R.push([X(v, c + half), y]);
  }
  const gr = g.createLinearGradient(0, v.hz, 0, v.h);
  gr.addColorStop(0, "#FFF6D6");
  gr.addColorStop(1, "#E9CF92");
  g.fillStyle = gr;
  g.beginPath();
  L.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
  g.closePath();
  g.fill();
  // sisi teduh di kanan jalan
  g.fillStyle = "rgba(190,150,90,0.35)";
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const m = (L[i][0] + R[i][0]) / 2;
    const x = m + (R[i][0] - m) * 0.55;
    if (i === 0) g.moveTo(x, R[i][1]);
    else g.lineTo(x, R[i][1]);
  }
  for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
  g.closePath();
  g.fill();
  // kerikil
  const r = rng(77);
  for (let i = 0; i < 70; i++) {
    const k = Math.floor(Math.pow(r(), 0.7) * N);
    const x = L[k][0] + (R[k][0] - L[k][0]) * r();
    const s = v.u * (0.002 + (k / N) * 0.006);
    g.fillStyle = r() > 0.5 ? "#D8BC80" : "#FFF9E6";
    g.beginPath();
    g.ellipse(x, L[k][1], s * 1.4, s * 0.7, 0, 0, Math.PI * 2);
    g.fill();
  }
}

/* ---------- layangan ---------- */

const KITE = { x: 0.6, f: 0.3 };
const PICNIC = { x: 0.3, d: 0.5 };
const KID_AT = { x: 0.42, d: 0.3 };

function kitePos(v: View, t: number) {
  return { x: X(v, KITE.x) + Math.sin(t * 0.6) * v.u * 0.025, y: S(v, KITE.f) + Math.sin(t * 1.1) * v.u * 0.015 };
}

function kite(ctx: Ctx, v: View, t: number) {
  const { x, y } = kitePos(v, t);
  const s = v.u * 0.032;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.3 + Math.sin(t * 1.3) * 0.12);
  // ekor
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, s * 1.2);
  for (let i = 1; i <= 8; i++) ctx.lineTo(Math.sin(t * 3 + i * 0.9) * s * 0.35, s * 1.2 + i * s * 0.32);
  ctx.stroke();
  for (let i = 2; i <= 8; i += 3) {
    ctx.fillStyle = i % 2 ? "#405FDA" : "#07A9F8";
    ctx.beginPath();
    ctx.ellipse(Math.sin(t * 3 + i * 0.9) * s * 0.35, s * 1.2 + i * s * 0.32, s * 0.16, s * 0.08, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const q = (a: [number, number], b: [number, number], c: [number, number], col: string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.closePath();
    ctx.fill();
  };
  q([0, -s], [s * 0.75, 0], [0, 0], "#FFE45C");
  q([0, -s], [-s * 0.75, 0], [0, 0], "#FFF39A");
  q([0, s * 1.2], [s * 0.75, 0], [0, 0], "#405FDA");
  q([0, s * 1.2], [-s * 0.75, 0], [0, 0], "#5B78E6");
  ctx.restore();
}

function kiteKids(ctx: Ctx, v: View, t: number, surf: (x: number) => number) {
  const gx = X(v, KID_AT.x);
  const gy = Math.min(G(v, KID_AT.d), surf(gx) + v.u * 0.035);
  const k = v.u * 0.015; // radius kepala
  // anak perempuan berhijab memegang benang layangan
  const bob = Math.abs(Math.sin(t * 2.2)) * k * 0.25;
  const by = gy - bob;
  shadow(ctx, gx, gy, k * 1.6);
  limb(ctx, gx - k * 0.35, by - k * 2.2, gx - k * 0.5, by, k * 0.5, "#2F47B0");
  limb(ctx, gx + k * 0.35, by - k * 2.2, gx + k * 0.6, by, k * 0.5, "#2F47B0");
  ctx.fillStyle = "#07A9F8";
  ctx.beginPath();
  ctx.moveTo(gx - k * 1.05, by - k * 1.4);
  ctx.quadraticCurveTo(gx - k * 0.9, by - k * 4.2, gx, by - k * 4.4);
  ctx.quadraticCurveTo(gx + k * 0.9, by - k * 4.2, gx + k * 1.05, by - k * 1.4);
  ctx.closePath();
  ctx.fill();
  const pull = Math.sin(t * 1.6) * k * 0.4;
  const hand = { x: gx + k * 1.7, y: by - k * 6.2 + pull };
  limb(ctx, gx + k * 0.6, by - k * 3.8, hand.x, hand.y, k * 0.45, "#07A9F8");
  limb(ctx, gx - k * 0.6, by - k * 3.8, gx - k * 1.4, by - k * 2.6, k * 0.45, "#07A9F8");
  kidHead(ctx, gx, by - k * 5.2, k, { skin: SKIN[1], hair: "#405FDA", style: "hijab", face: 1 });
  // benang ke layangan
  const kp = kitePos(v, t);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(1, v.u * 0.0012);
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.quadraticCurveTo(hand.x + (kp.x - hand.x) * 0.7, hand.y + (kp.y - hand.y) * 0.2, kp.x, kp.y + v.u * 0.035);
  ctx.stroke();

  // temannya melompat-lompat bersorak
  const fx = gx - k * 5.5;
  const jump = Math.max(0, Math.sin(t * 3.4)) * k * 1.4;
  const fy = gy - jump;
  shadow(ctx, fx, gy, k * 1.4 * (1 - jump / (k * 4)));
  const spread = jump > k * 0.4 ? 1 : 0.4;
  limb(ctx, fx - k * 0.3, fy - k * 2.2, fx - k * 0.3 - spread * k * 0.5, fy, k * 0.5, "#3A3A48");
  limb(ctx, fx + k * 0.3, fy - k * 2.2, fx + k * 0.3 + spread * k * 0.5, fy, k * 0.5, "#3A3A48");
  ctx.fillStyle = "#FFD23F";
  roundRect(ctx, fx - k * 0.95, fy - k * 4.3, k * 1.9, k * 2.4, k * 0.7);
  const arm = jump > k * 0.4 ? -1 : 0.2;
  limb(ctx, fx - k * 0.7, fy - k * 3.9, fx - k * 1.6, fy - k * (4.6 - arm * -1.8), k * 0.42, "#FFD23F");
  limb(ctx, fx + k * 0.7, fy - k * 3.9, fx + k * 1.6, fy - k * (4.6 - arm * -1.8), k * 0.42, "#FFD23F");
  kidHead(ctx, fx, fy - k * 5.1, k * 0.95, { skin: SKIN[2], hair: "#2B2320", style: "short", face: 1 });
}

/* ---------- ayunan ---------- */

function swing(ctx: Ctx, v: View, t: number, tree: { x: number; y: number; h: number }) {
  const s = tree.h;
  const px = tree.x + s * 0.17;
  const py = tree.y - s * 0.57;
  const len = s * 0.4;
  const ang = Math.sin(t * 1.9) * 0.42;
  const k = v.u * 0.014;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(ang);
  ctx.strokeStyle = "#5B3D25";
  ctx.lineWidth = Math.max(1, v.u * 0.0015);
  ctx.beginPath();
  ctx.moveTo(-k * 1.2, 0);
  ctx.lineTo(-k * 1.2, len);
  ctx.moveTo(k * 1.2, 0);
  ctx.lineTo(k * 1.2, len);
  ctx.stroke();
  ctx.fillStyle = "#8A5A36";
  ctx.fillRect(-k * 1.6, len, k * 3.2, k * 0.4);
  // anak duduk, kaki mengayun mengikuti arah ayunan
  const leg = Math.cos(t * 1.9) * 0.9;
  limb(ctx, -k * 0.3, len, -k * 0.3 + k * 1.6 * Math.cos(leg), len + k * 1.6 * Math.sin(leg) + k * 0.4, k * 0.5, "#2F47B0");
  limb(ctx, k * 0.3, len, k * 0.3 + k * 1.6 * Math.cos(leg), len + k * 1.6 * Math.sin(leg) + k * 0.4, k * 0.5, "#2F47B0");
  ctx.fillStyle = "#FF8FAE";
  roundRect(ctx, -k * 0.95, len - k * 2.3, k * 1.9, k * 2.4, k * 0.7);
  limb(ctx, -k * 0.7, len - k * 1.9, -k * 1.2, len - k * 3.2, k * 0.4, "#FF8FAE");
  limb(ctx, k * 0.7, len - k * 1.9, k * 1.2, len - k * 3.2, k * 0.4, "#FF8FAE");
  kidHead(ctx, 0, len - k * 3.2, k, { skin: SKIN[0], hair: "#4A2E1E", style: "pony", face: 1 });
  ctx.restore();
}

/* ---------- piknik membaca ---------- */

function picnic(ctx: Ctx, v: View, t: number, xu: number, d: number) {
  const cx = X(v, xu);
  const cy = G(v, d);
  const k = v.u * 0.017;
  // tikar kotak-kotak
  const wT = k * 13;
  const wB = k * 16;
  const hh = k * 3.2;
  shadow(ctx, cx, cy + hh * 0.55, wB * 0.55, 0.12);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - wT / 2, cy - hh / 2);
  ctx.lineTo(cx + wT / 2, cy - hh / 2);
  ctx.lineTo(cx + wB / 2, cy + hh / 2);
  ctx.lineTo(cx - wB / 2, cy + hh / 2);
  ctx.closePath();
  ctx.fillStyle = "#FFFDF2";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "rgba(255,210,63,0.85)";
  const sq = k * 1.1;
  for (let i = -8; i < 8; i++) ctx.fillRect(cx + i * sq * 2, cy - hh, sq, hh * 2);
  ctx.fillStyle = "rgba(255,210,63,0.55)";
  for (let j = 0; j < 4; j++) ctx.fillRect(cx - wB, cy - hh / 2 + j * sq * 2, wB * 2, sq);
  ctx.restore();

  // keranjang
  ctx.fillStyle = "#C98A45";
  roundRect(ctx, cx + k * 3.9, cy - k * 2.4, k * 2.6, k * 1.8, k * 0.4);
  ctx.strokeStyle = "#8A5A34";
  ctx.lineWidth = Math.max(1, k * 0.2);
  ctx.beginPath();
  ctx.arc(cx + k * 5.2, cy - k * 2.4, k * 1.0, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = "#E8433F";
  ctx.beginPath();
  ctx.arc(cx + k * 4.7, cy - k * 2.6, k * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // dua anak duduk bersila agak berjauhan, masing-masing membaca bukunya sendiri
  readingKid(ctx, cx - k * 3.4, cy + k * 0.2, k, t, {
    shirt: "#07A9F8", pants: "#2F47B0", skin: SKIN[2], hair: "#2B2320", style: "short", cover: "#405FDA", flipAt: 0,
  });
  readingKid(ctx, cx + k * 1.3, cy + k * 0.1, k, t, {
    shirt: "#FFD23F", pants: "#3A3A48", skin: SKIN[0], hair: "#6B3A22", style: "bob", cover: "#E8433F", flipAt: 2.4,
  });

  // kucing tidur-tiduran di ujung tikar, ekornya bergoyang
  cat(ctx, cx - k * 6.4, cy + k * 0.9, k, t);
}

/** anak duduk bersila sambil membaca buku sendiri; sesekali halaman dibalik */
function readingKid(
  ctx: Ctx,
  x: number,
  y: number,
  k: number,
  t: number,
  o: { shirt: string; pants: string; skin: string; hair: string; style: "short" | "bob"; cover: string; flipAt: number },
) {
  sittingKid(ctx, x, y, k, { shirt: o.shirt, pants: o.pants, lean: 0 });
  const bx = x;
  const by = y - k * 1.9;
  const bw = k * 1.25; // setengah lebar buku
  // sampul
  ctx.fillStyle = o.cover;
  ctx.beginPath();
  ctx.moveTo(bx - bw - k * 0.15, by - k * 0.6);
  ctx.lineTo(bx, by - k * 0.35);
  ctx.lineTo(bx + bw + k * 0.15, by - k * 0.6);
  ctx.lineTo(bx + bw + k * 0.15, by + k * 0.6);
  ctx.lineTo(bx, by + k * 0.85);
  ctx.lineTo(bx - bw - k * 0.15, by + k * 0.6);
  ctx.closePath();
  ctx.fill();
  // halaman
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(bx + side * bw, by - k * 0.5);
    ctx.lineTo(bx, by - k * 0.25);
    ctx.lineTo(bx, by + k * 0.7);
    ctx.lineTo(bx + side * bw, by + k * 0.45);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = "rgba(64,95,218,0.35)";
  for (let i = 0; i < 3; i++) ctx.fillRect(bx - bw * 0.85, by - k * 0.15 + i * k * 0.22, bw * 0.65, Math.max(1, k * 0.07));
  ctx.fillStyle = "#FFD23F";
  ctx.beginPath();
  ctx.arc(bx + bw * 0.5, by + k * 0.1, k * 0.25, 0, Math.PI * 2);
  ctx.fill();
  // balik halaman
  const flip = mod(t + o.flipAt, 5.5);
  if (flip < 0.7) {
    const p = flip / 0.7;
    const ex = bx + Math.cos(p * Math.PI) * bw;
    const lift = Math.sin(p * Math.PI) * k * 0.5;
    ctx.fillStyle = "#F4F1E6";
    ctx.beginPath();
    ctx.moveTo(bx, by - k * 0.25);
    ctx.lineTo(ex, by - k * 0.5 - lift);
    ctx.lineTo(ex, by + k * 0.45 - lift);
    ctx.lineTo(bx, by + k * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  // tangan memegang sisi buku
  limb(ctx, x - k * 0.75, y - k * 2.6, bx - bw, by + k * 0.25, k * 0.42, o.shirt);
  limb(ctx, x + k * 0.75, y - k * 2.6, bx + bw, by + k * 0.25, k * 0.42, o.shirt);
  ctx.fillStyle = o.skin;
  ctx.beginPath();
  ctx.arc(bx - bw, by + k * 0.25, k * 0.26, 0, Math.PI * 2);
  ctx.arc(bx + bw, by + k * 0.25, k * 0.26, 0, Math.PI * 2);
  ctx.fill();
  // kepala sedikit menunduk, mengangguk pelan
  ctx.save();
  ctx.translate(x, y - k * 4.15);
  ctx.rotate(Math.sin(t * 0.8 + o.flipAt) * 0.05);
  kidHead(ctx, 0, k * 0.1, k, { skin: o.skin, hair: o.hair, style: o.style, face: 0 });
  ctx.restore();
}

/** anak duduk bersila (tampak depan) */
function sittingKid(ctx: Ctx, x: number, y: number, k: number, o: { shirt: string; pants: string; lean: number }) {
  // kaki bersila
  ctx.fillStyle = o.pants;
  ctx.beginPath();
  ctx.ellipse(x - k * 0.7, y - k * 0.35, k * 1.25, k * 0.5, 0.12, 0, Math.PI * 2);
  ctx.ellipse(x + k * 0.7, y - k * 0.35, k * 1.25, k * 0.5, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(x - k * 1.75, y - k * 0.2, k * 0.35, k * 0.25, 0, 0, Math.PI * 2);
  ctx.ellipse(x + k * 1.75, y - k * 0.2, k * 0.35, k * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  // badan
  ctx.save();
  ctx.translate(x, y - k * 0.6);
  ctx.rotate(o.lean);
  ctx.fillStyle = o.shirt;
  ctx.beginPath();
  ctx.roundRect(-k * 1.0, -k * 2.7, k * 2.0, k * 2.8, [k * 0.9, k * 0.9, k * 0.4, k * 0.4]);
  ctx.fill();
  ctx.restore();
}

function cat(ctx: Ctx, x: number, y: number, k: number, t: number) {
  shadow(ctx, x, y, k * 1.8, 0.12);
  const body = "#F2A65A";
  const stripe = "#D9833A";
  // ekor melengkung, bergoyang pelan
  const sw = Math.sin(t * 2.2) * 0.5;
  ctx.strokeStyle = body;
  ctx.lineWidth = k * 0.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - k * 1.3, y - k * 0.5);
  ctx.bezierCurveTo(x - k * 2.4, y - k * 0.4, x - k * 2.5, y - k * 1.6, x - k * 2.0 + sw * k, y - k * 2.2);
  ctx.stroke();
  // badan duduk
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x - k * 0.2, y - k * 0.9, k * 1.3, k * 1.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF3E2";
  ctx.beginPath();
  ctx.ellipse(x + k * 0.55, y - k * 0.75, k * 0.5, k * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  // garis belang di punggung
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x - k * 0.2, y - k * 0.9, k * 1.3, k * 1.0, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = stripe;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x - k * 0.8 + i * k * 0.45, y - k * 1.85, k * 0.12, k * 0.45, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // kepala
  const hx = x + k * 0.7;
  const hy = y - k * 2.1 + Math.sin(t * 1.5) * k * 0.05;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(hx - k * 0.75, hy - k * 0.3);
  ctx.lineTo(hx - k * 0.6, hy - k * 1.15);
  ctx.lineTo(hx - k * 0.15, hy - k * 0.6);
  ctx.lineTo(hx + k * 0.15, hy - k * 0.6);
  ctx.lineTo(hx + k * 0.6, hy - k * 1.15);
  ctx.lineTo(hx + k * 0.75, hy - k * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx, hy, k * 0.85, k * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFB3C1";
  ctx.beginPath();
  ctx.moveTo(hx - k * 0.55, hy - k * 0.45);
  ctx.lineTo(hx - k * 0.5, hy - k * 0.9);
  ctx.lineTo(hx - k * 0.25, hy - k * 0.55);
  ctx.moveTo(hx + k * 0.55, hy - k * 0.45);
  ctx.lineTo(hx + k * 0.5, hy - k * 0.9);
  ctx.lineTo(hx + k * 0.25, hy - k * 0.55);
  ctx.fill();
  // mata: sesekali berkedip
  const blink = mod(t, 4.5) < 0.18;
  ctx.fillStyle = "#2A2230";
  ctx.strokeStyle = "#2A2230";
  ctx.lineWidth = Math.max(1, k * 0.1);
  for (const dx of [-0.3, 0.3]) {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(hx + dx * k - k * 0.14, hy);
      ctx.lineTo(hx + dx * k + k * 0.14, hy);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(hx + dx * k, hy, k * 0.1, k * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#E86A7A";
  ctx.beginPath();
  ctx.arc(hx, hy + k * 0.22, k * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- kelinci ---------- */

function bunny(ctx: Ctx, v: View, t: number) {
  const dur = 26;
  const p = mod((t + 8) / dur, 1);
  const span = v.half + 0.15;
  const x = X(v, -span + p * span * 2);
  const ground = G(v, 0.6);
  const hop = Math.max(0, Math.sin(t * 7)) * v.u * 0.022;
  const k = v.u * 0.018;
  shadow(ctx, x, ground, k * 1.1 * (1 - hop / (v.u * 0.05)), 0.14);
  const y = ground - hop;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(x, y - k * 0.65, k * 0.95, k * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + k * 0.85, y - k * 1.15, k * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + k * 0.7, y - k * 1.9, k * 0.17, k * 0.55, -0.25, 0, Math.PI * 2);
  ctx.ellipse(x + k * 1.05, y - k * 1.9, k * 0.17, k * 0.55, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E6E8F2";
  ctx.beginPath();
  ctx.ellipse(x - k * 0.2, y - k * 0.4, k * 0.6, k * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFC2D1";
  ctx.beginPath();
  ctx.ellipse(x + k * 0.7, y - k * 1.9, k * 0.07, k * 0.35, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2A2230";
  ctx.beginPath();
  ctx.arc(x + k * 1.05, y - k * 1.2, k * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

