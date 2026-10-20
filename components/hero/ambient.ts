import type { Audience } from "@/lib/content";

/**
 * Lapisan animasi di atas gambar hero (canvas 2D transparan).
 *  - Anak:   kelopak bunga beterbangan, kupu-kupu kecil, burung.
 *  - Dewasa: titik-titik cahaya senja (bokeh), kunang-kunang, burung.
 *  - Keduanya: sesekali kupu-kupu besar lewat sangat dekat dengan "kamera".
 * Saat ganti dunia, elemen lama memudar dan elemen baru muncul.
 */

type Rand = () => number;

function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mod = (v: number, m: number) => ((v % m) + m) % m;

/* ------------------------------------------------------------------ */
/* Kupu-kupu (digambar detail: sayap bergradasi, garis tepi, bintik)   */
/* ------------------------------------------------------------------ */

type Wing = { a: string; b: string; edge: string; dot: string };

const WINGS_KIDS: Wing[] = [
  { a: "#FFF7B0", b: "#FFC93C", edge: "#3A2A1A", dot: "#FFFFFF" },
  { a: "#FFFFFF", b: "#C9B8F5", edge: "#3B3566", dot: "#FFFFFF" },
  { a: "#FFE1EC", b: "#F79AC0", edge: "#5A2A44", dot: "#FFFFFF" },
  { a: "#E6F6FF", b: "#7CC8F8", edge: "#1E3A66", dot: "#FFFFFF" },
];
const WING_NEAR_KIDS: Wing = { a: "#FFF4A8", b: "#F59E3D", edge: "#2E1E10", dot: "#FFF7E0" };
const WING_NEAR_ADULT: Wing = { a: "#FFFFFF", b: "#B9AAF2", edge: "#2C2A5A", dot: "#FFFFFF" };

function butterfly(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flap: number, rot: number, w: Wing) {
  const k = 0.18 + 0.82 * Math.abs(Math.sin(flap));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (const side of [1, -1]) {
    ctx.save();
    ctx.scale(side * k, 1);
    const g = ctx.createLinearGradient(0, 0, s, -s * 0.4);
    g.addColorStop(0, w.b);
    g.addColorStop(0.55, w.a);
    g.addColorStop(1, w.b);
    ctx.fillStyle = g;
    ctx.strokeStyle = w.edge;
    ctx.lineWidth = Math.max(0.6, s * 0.035);
    // sayap atas
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.05);
    ctx.bezierCurveTo(s * 0.15, -s * 0.95, s * 1.15, -s * 1.05, s * 0.98, -s * 0.28);
    ctx.bezierCurveTo(s * 0.92, -s * 0.02, s * 0.45, s * 0.04, 0, -s * 0.05);
    ctx.fill();
    ctx.stroke();
    // sayap bawah
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.55, s * 0.05, s * 0.85, s * 0.55, s * 0.5, s * 0.78);
    ctx.bezierCurveTo(s * 0.28, s * 0.9, s * 0.06, s * 0.45, 0, 0);
    ctx.fill();
    ctx.stroke();
    // urat & bintik
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.08);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.5, s * 0.85, -s * 0.55);
    ctx.moveTo(s * 0.05, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.2, s * 0.9, -s * 0.25);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = w.dot;
    ctx.beginPath();
    ctx.arc(s * 0.82, -s * 0.5, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.66, -s * 0.72, s * 0.045, 0, Math.PI * 2);
    ctx.arc(s * 0.46, s * 0.6, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // badan & antena
  ctx.fillStyle = "#2A2230";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.07, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2A2230";
  ctx.lineWidth = Math.max(0.5, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.33);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.6, s * 0.2, -s * 0.66);
  ctx.moveTo(0, -s * 0.33);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.6, -s * 0.2, -s * 0.66);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */

type Petal = { x: number; y: number; s: number; sp: number; ph: number; c: [string, string] };
type Mote = { x: number; y: number; r: number; sp: number; ph: number };
type Fly = { x: number; y: number; ph: number; sp: number; w: Wing; s: number };

const PETAL_COLORS: [string, string][] = [
  ["#FFFFFF", "#FFD6E6"],
  ["#FFE3EE", "#F7A8C8"],
  ["#FFFFFF", "#FFF4C2"],
  ["#FFF9D6", "#FFE07A"],
];

export function createAmbient(canvas: HTMLCanvasElement, opts: { reduceMotion: boolean }) {
  const ctx = canvas.getContext("2d")!;
  const r = rng(7);

  const petals: Petal[] = Array.from({ length: 26 }, () => ({
    x: r(),
    y: r(),
    s: 0.6 + r() * 0.9,
    sp: 0.6 + r() * 0.8,
    ph: r() * 6.28,
    c: PETAL_COLORS[Math.floor(r() * PETAL_COLORS.length)],
  }));
  const motes: Mote[] = Array.from({ length: 22 }, () => ({ x: r(), y: 0.35 + r() * 0.6, r: 2 + r() * 7, sp: 0.4 + r(), ph: r() * 6.28 }));
  const flies: Fly[] = Array.from({ length: 4 }, (_, i) => ({
    x: [0.18, 0.72, 0.4, 0.86][i],
    y: [0.7, 0.62, 0.82, 0.78][i],
    ph: r() * 6.28,
    sp: 0.6 + r() * 0.5,
    w: WINGS_KIDS[i % WINGS_KIDS.length],
    s: 7 + r() * 4,
  }));

  let W = 0;
  let H = 0;
  let dpr = 1;
  let raf = 0;
  let visible = true;
  let destroyed = false;
  let mix = 0; // 0 = Anak, 1 = Dewasa
  let target = 0;
  let lastDraw = 0;
  const t0 = performance.now();
  let lastNow = t0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    W = Math.max(1, Math.round(rect.width * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    draw(performance.now());
  }

  function birds(t: number, alpha: number, color: string, f: number, dur: number, delay: number, reverse = false) {
    const p = mod((t + delay) / dur, 1);
    const x0 = reverse ? W * (1.15 - p * 1.3) : W * (-0.15 + p * 1.3);
    const y0 = H * f;
    const s = Math.max(4, H * 0.008);
    const flock = [
      [0, 0],
      [-4.5, -2.4],
      [-7, 1.6],
      [-10, -0.8],
      [-13, 2.2],
    ];
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, s * 0.28);
    ctx.lineCap = "round";
    flock.forEach(([dx, dy], i) => {
      const k = reverse ? -1 : 1;
      const x = x0 + dx * s * k;
      const y = y0 + dy * s + Math.sin(t * 0.8 + i) * s * 0.6;
      const fl = Math.sin(t * 8 + i * 1.7);
      ctx.beginPath();
      ctx.moveTo(x - s, y + fl * s * 0.3);
      ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.5 * fl - s * 0.1, x, y);
      ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.5 * fl - s * 0.1, x + s, y + fl * s * 0.3);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawPetals(t: number, alpha: number) {
    const base = Math.max(5, Math.min(W, H) * 0.009);
    for (const p of petals) {
      // jatuh miring pelan dari kiri atas ke kanan bawah, sambil bergoyang
      const y = mod(p.y + t * 0.018 * p.sp, 1.15) - 0.08;
      const x = mod(p.x + t * 0.012 * p.sp + Math.sin(t * 0.6 + p.ph) * 0.02, 1.1) - 0.05;
      const s = base * p.s;
      const flip = Math.cos(t * 1.6 * p.sp + p.ph);
      ctx.save();
      ctx.globalAlpha = alpha * (0.75 + 0.25 * Math.abs(flip));
      ctx.translate(x * W, y * H);
      ctx.rotate(t * 0.8 * p.sp + p.ph);
      ctx.scale(1, 0.35 + 0.65 * Math.abs(flip));
      const g = ctx.createLinearGradient(-s, 0, s, 0);
      g.addColorStop(0, p.c[1]);
      g.addColorStop(0.5, p.c[0]);
      g.addColorStop(1, p.c[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(0, -s * 0.75, s, 0);
      ctx.quadraticCurveTo(0, s * 0.75, -s, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFlies(t: number, alpha: number) {
    ctx.globalAlpha = alpha;
    const unit = (H / 900) * 1.5;
    for (const f of flies) {
      const x = (f.x + Math.sin(t * 0.35 * f.sp + f.ph) * 0.06) * W;
      const y = (f.y + Math.sin(t * 0.7 * f.sp + f.ph * 2) * 0.03) * H - Math.abs(Math.sin(t * 1.1 + f.ph)) * H * 0.02;
      butterfly(ctx, x, y, f.s * unit, t * 9 * f.sp + f.ph, Math.sin(t * 0.5 + f.ph) * 0.4, f.w);
    }
    ctx.globalAlpha = 1;
  }

  function drawMotes(t: number, alpha: number) {
    for (const m of motes) {
      const x = mod(m.x + Math.sin(t * 0.08 * m.sp + m.ph) * 0.05 + t * 0.003 * m.sp, 1) * W;
      const y = (m.y + Math.sin(t * 0.2 * m.sp + m.ph) * 0.03) * H;
      const a = (0.25 + 0.45 * Math.max(0, Math.sin(t * 0.9 * m.sp + m.ph))) * alpha;
      const rad = m.r * dpr * (m.y > 0.7 ? 1.4 : 1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(255,226,160,${a})`);
      g.addColorStop(0.4, `rgba(255,214,140,${a * 0.5})`);
      g.addColorStop(1, "rgba(255,214,140,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }

  /** kupu-kupu besar, buram, lewat dekat kamera ±3,6 detik setiap `every` detik */
  function nearButterfly(t: number, alpha: number, every: number, offset: number, w: Wing) {
    const dur = 3.6;
    const local = mod(t + offset, every);
    if (local > dur || alpha <= 0.01) return;
    const p = local / dur;
    const x = W * (-0.15 + p * 1.3);
    const y = H * (1.05 - p * 0.85) + Math.sin(p * Math.PI * 3) * H * 0.05;
    const s = H * (0.1 + 0.06 * Math.sin(p * Math.PI));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalAlpha = alpha * 0.92;
    butterfly(ctx, x, y, s, t * 7, 0.5 - p * 0.6, w);
    ctx.restore();
  }

  function draw(now: number) {
    const t = opts.reduceMotion ? 8 : (now - t0) / 1000;
    const dt = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    mix += (target - mix) * Math.min(1, dt * 2.2);
    if (Math.abs(target - mix) < 0.002) mix = target;
    const kids = 1 - mix;
    const adult = mix;

    ctx.clearRect(0, 0, W, H);
    if (kids > 0.01) {
      birds(t, kids * 0.8, "#2C3E86", 0.17, 34, 3);
      birds(t, kids * 0.6, "#3D52A0", 0.3, 46, 22, true);
      drawFlies(t, kids);
      drawPetals(t, kids);
    }
    if (adult > 0.01) {
      birds(t, adult * 0.75, "#1E2560", 0.22, 40, 9);
      drawMotes(t, adult);
    }
    if (!opts.reduceMotion) {
      nearButterfly(t, kids, 14, -5, WING_NEAR_KIDS);
      nearButterfly(t, adult, 17, -8, WING_NEAR_ADULT);
    }
  }

  function loop(now: number) {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    if (opts.reduceMotion && mix === target) return;
    if (now - lastDraw < 1000 / 30) return; // 30 fps sudah cukup halus, jauh lebih ringan
    lastDraw = now;
    draw(now);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  });
  io.observe(canvas);
  raf = requestAnimationFrame(loop);

  return {
    setAudience(a: Audience, instant = false) {
      target = a === "adult" ? 1 : 0;
      if (instant) mix = target;
      if (opts.reduceMotion) draw(performance.now());
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    },
  };
}
