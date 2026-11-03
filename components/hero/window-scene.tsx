"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": pemandangan kota senja dari balik jendela logam bersudut bulat (ala jendela kereta).
 *  - Jendela: bingkai logam tebal dengan paku keling, sill, tepi kursi gelap di sudut bawah, debu halus di berkas cahaya.
 *  - Di dalam kaca: langit senja ke malam, bulan sabit, awan yang berjalan, burung, bintang jatuh, pesawat,
 *    empat lapis kota dengan kabut atmosfer, mahkota menara bercahaya, jalan layang dengan bokeh & jejak lampu.
 *  - Lapisan sinematik: kamera maju sangat pelan, sapuan pantulan kaca, butiran film.
 *  - Gelembung kaca bergantian: pesan peluang kerja → balasan bahasa Inggris → tip English Now.
 * Semua SVG/CSS (tajam di layar berapa pun), tanpa parallax kursor. Animasi berhenti saat adegan di luar layar.
 */

/* ---------- acak tetap ---------- */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (v: number) => v.toFixed(1);

/** persegi bersudut bulat sebagai path (untuk bingkai berlubang) */
function rr(x: number, y: number, w: number, h: number, r: number) {
  return `M${f1(x + r)} ${f1(y)}H${f1(x + w - r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + w)} ${f1(y + r)}V${f1(y + h - r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + w - r)} ${f1(y + h)}H${f1(x + r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x)} ${f1(y + h - r)}V${f1(y + r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + r)} ${f1(y)}Z`;
}

/* ---------- kota ---------- */
type Layer = {
  id: string;
  body: string;
  warm: string;
  cool: string;
  strips: string;
  edge: string;
  blink: { x: number; y: number; w: number; h: number; d: number; t: number }[];
  crowns: { x: number; y: number; r: number; d: number }[];
  beacons: { x: number; y: number; d: number }[];
  tone: string;
  opacity: number;
};

function buildCity(w: number, baseY: number, H: number, narrow: boolean): Layer[] {
  const defs = [
    { id: "haze", seed: 2, gap: 0.7, scale: 0.5, wmin: 36, wmax: 80, tone: "#8A98DE", opacity: 0.3, lit: 0 },
    { id: "far", seed: 3, gap: 0.78, scale: 0.6, wmin: 40, wmax: 90, tone: "#4757B8", opacity: 0.6, lit: 0.07 },
    { id: "mid", seed: 9, gap: 0.92, scale: 0.8, wmin: 56, wmax: 118, tone: "#1E2C86", opacity: 1, lit: 0.26 },
    { id: "near", seed: 21, gap: 1.02, scale: 1.0, wmin: 82, wmax: 168, tone: "#0A1040", opacity: 1, lit: 0.4 },
  ];
  const cw = narrow ? 11 : 14;
  const ch = narrow ? 15 : 19;
  const ww = cw * 0.5;
  const wh = ch * 0.52;
  const k = narrow ? 0.62 : 1;

  return defs.map((L) => {
    const r = rng(L.seed);
    let body = "";
    let warm = "";
    let cool = "";
    let strips = "";
    let edge = "";
    const blink: Layer["blink"] = [];
    const crowns: Layer["crowns"] = [];
    const beacons: Layer["beacons"] = [];
    let x = -60;
    while (x < w + 60) {
      const bw = (L.wmin + r() * (L.wmax - L.wmin)) * k;
      const xc = (x + bw / 2) / w;
      const edgeF = Math.min(1, Math.abs(xc - 0.5) * 2);
      // bagian tengah dibuat rendah supaya teks hero tetap bersih
      const bh = H * L.scale * (0.07 + 0.5 * Math.pow(edgeF, 1.2) + r() * 0.08);
      const top = baseY - bh;
      body += `M${f1(x)} ${f1(baseY + 2)}V${f1(top)}H${f1(x + bw)}V${f1(baseY + 2)}Z`;

      // atap: bertingkat / antena
      const roof = r();
      let crownY = top;
      if (roof < 0.35) {
        const sw = bw * 0.6;
        const sh = H * (0.03 + r() * 0.04);
        body += `M${f1(x + (bw - sw) / 2)} ${f1(top)}V${f1(top - sh)}H${f1(x + (bw + sw) / 2)}V${f1(top)}Z`;
        crownY = top - sh;
      } else if (roof < 0.55) {
        const sp = 34 * k + r() * 24;
        body += `M${f1(x + bw / 2 - 1.5)} ${f1(top)}V${f1(top - sp)}H${f1(x + bw / 2 + 1.5)}V${f1(top)}Z`;
        crownY = top - sp;
      }

      const big = bh > H * 0.3 && edgeF > 0.35;
      if ((L.id === "mid" || L.id === "near") && big) {
        if (L.id === "near" && r() < 0.55) crowns.push({ x: x + bw / 2, y: crownY + 2, r: (14 + r() * 12) * k, d: r() * 4 });
        else if (r() < 0.4) beacons.push({ x: x + bw / 2, y: crownY - 2, d: r() * 3 });
        if (L.id === "near" && r() < 0.5) strips += `M${f1(x + bw * 0.82)} ${f1(top + 8)}h1.6v${f1(bh * 0.62)}h-1.6Z`;
      }
      // tepi kiri kena sisa cahaya matahari
      if (L.id === "near" || L.id === "mid") edge += `M${f1(x)} ${f1(top)}h1.6V${f1(baseY)}h-1.6Z`;

      // jendela menyala
      if (L.lit > 0 && bh > 40) {
        const cols = Math.max(2, Math.floor((bw - 8) / cw));
        const rows = Math.max(2, Math.floor((bh - 14) / ch));
        const ox = (bw - cols * cw) / 2 + (cw - ww) / 2;
        for (let c = 0; c < cols; c++) {
          for (let rr2 = 0; rr2 < rows; rr2++) {
            if (r() > L.lit) continue;
            const wx = x + ox + c * cw;
            const wy = top + 10 + rr2 * ch;
            const seg = `M${f1(wx)} ${f1(wy)}h${f1(ww)}v${f1(wh)}h${f1(-ww)}Z`;
            if (L.id === "near" && r() < 0.04 && blink.length < 14) blink.push({ x: wx, y: wy, w: ww, h: wh, d: r() * 6, t: 3 + r() * 6 });
            else if (r() < 0.74) warm += seg;
            else cool += seg;
          }
        }
      }
      x += bw * L.gap * (0.9 + r() * 0.25);
    }
    return { id: L.id, body, warm, cool, strips, edge, blink, crowns, beacons, tone: L.tone, opacity: L.opacity };
  });
}

/* ---------- percakapan ---------- */
type Line = { who: "in" | "out" | "tip"; label: string; text: string };
const SCRIPTS: Line[][] = [
  [
    { who: "in", label: "New message", text: "Interview invitation: Singapore office, Monday 10:00." },
    { who: "out", label: "Your reply", text: "Thank you. I'd be glad to attend." },
    { who: "tip", label: "English Now tip", text: "Formal & warm: “I'd be glad to…”" },
  ],
  [
    { who: "in", label: "New message", text: "Can you present to our regional team?" },
    { who: "out", label: "Your reply", text: "Certainly. I'll prepare the deck." },
    { who: "tip", label: "English Now tip", text: "Confident & polite: “Certainly.”" },
  ],
  [
    { who: "in", label: "New message", text: "The client call has moved to 3 PM." },
    { who: "out", label: "Your reply", text: "Noted. I'll join at 3 PM." },
    { who: "tip", label: "English Now tip", text: "Short & clear: “Noted.”" },
  ],
];

function Bubble({ line, style, narrow }: { line: Line; style: React.CSSProperties; narrow: boolean }) {
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setTyping(false), line.who === "in" ? 0 : 700);
    return () => window.clearTimeout(t);
  }, [line.who]);
  const tone =
    line.who === "tip"
      ? "bg-sun text-cobalt-900 shadow-[0_14px_40px_-12px_rgba(255,242,117,0.6)]"
      : line.who === "out"
        ? "bg-cobalt/85 text-white ring-1 ring-white/25 backdrop-blur-md shadow-[0_14px_40px_-12px_rgba(64,95,218,0.8)]"
        : "bg-white/14 text-white ring-1 ring-white/30 backdrop-blur-md shadow-[0_14px_40px_-14px_rgba(0,0,0,0.6)]";
  return (
    <div className="absolute z-[8]" style={{ ...style, width: narrow ? "min(62vw, 236px)" : "min(19vw, 262px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -6, transition: { duration: 0.25 } }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={`rounded-2xl px-3.5 py-2.5 ${tone}`}
      >
        <p className="mb-0.5 text-[10px] font-bold tracking-[0.14em] uppercase opacity-70">{line.label}</p>
        {typing ? (
          <span className="flex h-5 items-center gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="size-1.5 rounded-full bg-current opacity-60" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
            ))}
          </span>
        ) : (
          <p className={`${narrow ? "text-[12.5px]" : "text-[14.5px]"} leading-snug font-semibold`}>{line.text}</p>
        )}
      </motion.div>
    </div>
  );
}

/* ---------- butiran film (statis, ringan) ---------- */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")";

/* ---------- adegan ---------- */
export function WindowScene() {
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => setSize({ w: el.clientWidth || 1440, h: el.clientHeight || 900 });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const narrow = w < 640;

  // geometri jendela
  const T = narrow ? 14 : 24; // tebal bingkai
  const wx = narrow ? w * 0.035 : w * 0.075;
  const wy = narrow ? 64 : 62;
  const ww = w - 2 * wx;
  const wbot = h * (narrow ? 0.9 : 0.865);
  const wh = wbot - wy;
  const R = narrow ? 30 : 64;
  const ix = wx + T;
  const iy = wy + T;
  const iw = ww - 2 * T;
  const ih = wh - 2 * T;
  const ir = Math.max(8, R - T * 0.6);
  const roadH = narrow ? 26 : 40;
  const baseY = iy + ih - roadH;
  const H = baseY - iy;

  const city = useMemo(() => buildCity(iw, baseY, H, narrow), [iw, baseY, H, narrow]);
  const stars = useMemo(() => {
    const r = rng(44);
    const n = narrow ? 22 : 40;
    return Array.from({ length: n }, (_, i) => ({ x: ix + r() * iw, y: iy + r() * H * 0.55, s: 0.7 + r() * 1.2, d: r() * 4, t: 2 + r() * 3, tw: i % 2 === 0 }));
  }, [ix, iw, iy, H, narrow]);
  const streaks = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: narrow ? 6 : 11 }, (_, i) => ({
      y: baseY + 7 + (i % 2) * (roadH * 0.38) + (i % 3) * 1.5,
      len: 70 + r() * 90,
      dir: i % 2 === 0 ? "r" : "l",
      dur: 8 + r() * 8,
      delay: -r() * 16,
    }));
  }, [narrow, baseY, roadH]);
  const bokeh = useMemo(() => {
    const r = rng(12);
    return Array.from({ length: narrow ? 10 : 20 }, (_, i) => ({
      x: ix + r() * iw,
      y: baseY + roadH * (0.2 + r() * 0.6),
      r: 4 + r() * 10,
      o: 0.3 + r() * 0.35,
      red: r() < 0.25,
      pulse: i % 4 === 0,
      d: r() * 5,
    }));
  }, [ix, iw, baseY, roadH, narrow]);
  const motes = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: narrow ? 8 : 16 }, () => ({ x: w * (0.12 + r() * 0.76), y: wbot + 6 + r() * (h - wbot) * 0.9, s: 0.8 + r() * 1.6, d: -r() * 12, t: 9 + r() * 8 }));
  }, [w, h, wbot, narrow]);
  const rivets = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const c = T / 2;
    const step = 56;
    for (let x = wx + R; x <= wx + ww - R; x += step) {
      out.push({ x, y: wy + c }, { x, y: wy + wh - c });
    }
    for (let y = wy + R; y <= wy + wh - R; y += step) {
      out.push({ x: wx + c, y }, { x: wx + ww - c, y });
    }
    return out;
  }, [T, wx, wy, ww, wh, R]);

  // percakapan
  const [script, setScript] = useState(0);
  const [step, setStep] = useState(reduce ? 3 : 0);
  const active = inView && !reduce;
  useEffect(() => {
    if (!active) return;
    const ts: number[] = [];
    ts.push(window.setTimeout(() => setStep(1), 700));
    ts.push(window.setTimeout(() => setStep(2), 3300));
    ts.push(window.setTimeout(() => setStep(3), 6000));
    ts.push(window.setTimeout(() => setStep(0), 11500));
    ts.push(window.setTimeout(() => setScript((s) => (s + 1) % SCRIPTS.length), 12000));
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, [active, script]);
  const lines = SCRIPTS[script];
  const bubbleStyle = (l: Line): React.CSSProperties => {
    if (narrow) {
      const t0 = Math.min(h * 0.7, h - 230);
      if (l.who === "in") return { left: 12, top: t0 };
      if (l.who === "out") return { right: 12, top: t0 + 76 };
      return { left: "50%", top: t0 + 150, transform: "translateX(-50%)" };
    }
    if (l.who === "in") return { left: w * 0.125, top: h * 0.56 };
    if (l.who === "out") return { right: w * 0.125, top: h * 0.6 };
    return { right: w * 0.125, top: h * 0.6 + 96 };
  };

  const sunX = ix + iw * 0.36;
  const sunY = baseY - H * 0.04;
  const moonX = ix + iw * 0.88;
  const moonY = iy + H * 0.28;
  const moonR = Math.max(20, h * 0.03);
  const rise = (i: number) =>
    reduce ? { initial: false as const } : { initial: { opacity: 0, y: 34 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, delay: 0.15 + i * 0.16, ease: "easeOut" as const } };

  return (
    <motion.div
      ref={root}
      aria-hidden
      className={`absolute inset-0 z-[6] overflow-hidden ${inView ? "" : "en-paused"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.8 }}
      style={{ background: "#05070F" }}
    >
      {/* kamera maju sangat pelan */}
      <div className="en-m-camera absolute inset-0" style={{ animation: "en-camera 30s ease-in-out infinite alternate", transformOrigin: "50% 58%" }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wn-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#060918" />
              <stop offset="55%" stopColor="#0C1230" />
              <stop offset="100%" stopColor="#05070F" />
            </linearGradient>
            <linearGradient id="wn-sky" gradientUnits="userSpaceOnUse" x1="0" y1={iy} x2="0" y2={baseY}>
              <stop offset="0%" stopColor="#050922" />
              <stop offset="30%" stopColor="#0C1760" />
              <stop offset="58%" stopColor="#2A3CA5" />
              <stop offset="76%" stopColor="#6B63C4" />
              <stop offset="90%" stopColor="#D98B96" />
              <stop offset="100%" stopColor="#FFC48C" />
            </linearGradient>
            <radialGradient id="wn-sun" gradientUnits="userSpaceOnUse" cx={sunX} cy={sunY} r={H * 0.7}>
              <stop offset="0%" stopColor="#FFF1CC" stopOpacity="0.95" />
              <stop offset="12%" stopColor="#FFD59A" stopOpacity="0.7" />
              <stop offset="40%" stopColor="#FF9F7E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FF9F7E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wn-moon" gradientUnits="userSpaceOnUse" cx={moonX} cy={moonY} r={moonR * 5}>
              <stop offset="0%" stopColor="#FFF6D6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#BFD0FF" stopOpacity="0" />
            </radialGradient>
            <mask id="wn-crescent">
              <rect x={moonX - moonR * 2} y={moonY - moonR * 2} width={moonR * 4} height={moonR * 4} fill="#000" />
              <circle cx={moonX} cy={moonY} r={moonR} fill="#fff" />
              <circle cx={moonX + moonR * 0.45} cy={moonY - moonR * 0.18} r={moonR * 0.92} fill="#000" />
            </mask>
            <radialGradient id="wn-cloud">
              <stop offset="0%" stopColor="#FFC9B8" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#E9A8C8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#E9A8C8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wn-mist" gradientUnits="userSpaceOnUse" x1="0" y1={baseY - H * 0.34} x2="0" y2={baseY}>
              <stop offset="0%" stopColor="#FFB89A" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFB89A" stopOpacity="0.45" />
            </linearGradient>
            <radialGradient id="wn-crown">
              <stop offset="0%" stopColor="#FFF0C4" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#FFD38A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD38A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wn-bokeh-w">
              <stop offset="0%" stopColor="#FFE2A6" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#FFD38A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFD38A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wn-bokeh-r">
              <stop offset="0%" stopColor="#FF8A7A" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#FF5A5A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF5A5A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wn-white" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFF6D6" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFF6D6" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="wn-red" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF4B4B" stopOpacity="0" />
              <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="wn-frame" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3A4260" />
              <stop offset="35%" stopColor="#1B2038" />
              <stop offset="70%" stopColor="#0F1325" />
              <stop offset="100%" stopColor="#2C2A33" />
            </linearGradient>
            <linearGradient id="wn-frame-hi" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FFB48A" stopOpacity="0.35" />
            </linearGradient>
            <radialGradient id="wn-rivet" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#8E9AC8" />
              <stop offset="100%" stopColor="#141831" />
            </radialGradient>
            <linearGradient id="wn-ledge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A5378" />
              <stop offset="100%" stopColor="#0E1228" />
            </linearGradient>
            <radialGradient id="wn-spill" cx="50%" cy="0%" r="70%">
              <stop offset="0%" stopColor="#FFC594" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#FFC594" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wn-seat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A1730" />
              <stop offset="100%" stopColor="#0B0614" />
            </linearGradient>
            <linearGradient id="wn-seat-rim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFB48A" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFB48A" stopOpacity="0.55" />
            </linearGradient>
            <radialGradient id="wn-vig" cx="50%" cy="45%" r="75%">
              <stop offset="55%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
            </radialGradient>
            <linearGradient id="wn-glare" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="wn-clip">
              <rect x={ix} y={iy} width={iw} height={ih} rx={ir} />
            </clipPath>
          </defs>

          {/* dinding interior */}
          <rect width={w} height={h} fill="url(#wn-wall)" />
          <ellipse cx={w / 2} cy={wbot + 4} rx={w * 0.46} ry={h * 0.12} fill="url(#wn-spill)" />

          {/* ===== di dalam kaca ===== */}
          <g clipPath="url(#wn-clip)">
            <rect x={ix} y={iy} width={iw} height={ih} fill="url(#wn-sky)" />
            {stars.map((s, i) => (
              <circle
                key={i}
                cx={f1(s.x)}
                cy={f1(s.y)}
                r={s.s}
                fill="#fff"
                opacity={s.tw ? undefined : 0.7}
                className={s.tw ? "en-m-twinkle" : undefined}
                style={s.tw ? { animation: `en-twinkle ${s.t}s ease-in-out ${s.d}s infinite` } : undefined}
              />
            ))}
            {!narrow && (
              <>
                <circle cx={moonX} cy={moonY} r={moonR * 5} fill="url(#wn-moon)" />
                <circle cx={moonX} cy={moonY} r={moonR} fill="#FFF3CF" mask="url(#wn-crescent)" />
              </>
            )}
            {/* bintang jatuh jarang-jarang */}
            <g className="en-m-shoot" style={{ animation: "en-shoot 19s linear 4s infinite", opacity: 0 }}>
              <path d={`M${f1(ix + iw * 0.7)} ${f1(iy + H * 0.12)} l-46 23`} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity=".85" />
            </g>
            <circle cx={sunX} cy={sunY} r={H * 0.7} fill="url(#wn-sun)" />
            {/* awan berjalan */}
            {[0.26, 0.42, 0.18].map((f, i) => (
              <g key={i} className="en-m-drift" style={{ animation: `en-drift ${150 + i * 50}s linear ${-i * 62}s infinite` }}>
                <ellipse cx="0" cy={f1(iy + H * f)} rx={iw * (0.14 + i * 0.03)} ry={H * 0.05} fill="url(#wn-cloud)" />
              </g>
            ))}
            {/* pesawat */}
            <g className="en-m-fly" style={{ animation: "en-fly 70s linear 2s infinite" }}>
              <g transform={`translate(0 ${f1(iy + H * 0.34)})`}>
                <path d="M0 0 L-120 0" stroke="#fff" strokeOpacity=".16" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M0 0 L9 -1.2 L12 0 L9 1.2Z M3.5 0 L1 -4.5 L2.6 -4.5 L6 0Z M3.5 0 L1 4.5 L2.6 4.5 L6 0Z" fill="#E8EDFF" opacity=".9" />
                <circle cx="0" cy="0" r="1.5" fill="#FF5A5A" className="en-m-blink" style={{ animation: "en-blink 1.6s linear infinite" }} />
              </g>
            </g>
            {/* sekawanan burung */}
            <g className="en-m-bird" style={{ animation: "en-bird 46s linear 8s infinite" }}>
              <g transform={`translate(0 ${f1(iy + H * 0.5)})`}>
                {[0, 1, 2].map((i) => (
                  <g key={i} transform={`translate(${i * 22} ${i % 2 ? 9 : -4})`}>
                    <path
                      d="M-6 0 Q-3 -4 0 0 Q3 -4 6 0"
                      fill="none"
                      stroke="#171C5A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="en-m-flap"
                      style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: `en-flap 0.55s ease-in-out ${i * 0.12}s infinite` }}
                    />
                  </g>
                ))}
              </g>
            </g>

            {/* kota berlapis */}
            <g transform={`translate(${f1(ix)} 0)`}>
              {city.map((L, i) => (
                <motion.g key={L.id} {...rise(i)}>
                  <path d={L.body} fill={L.tone} opacity={L.opacity} />
                  {L.edge && <path d={L.edge} fill="#FFC594" opacity={L.id === "near" ? 0.3 : 0.18} />}
                  {L.warm && <path d={L.warm} fill="#FFD98A" opacity=".92" />}
                  {L.cool && <path d={L.cool} fill="#BFE3FF" opacity=".85" />}
                  {L.strips && <path d={L.strips} fill="#BFE3FF" opacity=".85" />}
                  {L.blink.map((b, k) => (
                    <rect key={k} x={f1(b.x)} y={f1(b.y)} width={f1(b.w)} height={f1(b.h)} fill="#FFE2A6" className="en-m-twinkle" style={{ animation: `en-twinkle ${b.t}s ease-in-out ${b.d}s infinite` }} />
                  ))}
                  {L.crowns.map((c, k) => (
                    <circle key={k} cx={f1(c.x)} cy={f1(c.y)} r={f1(c.r)} fill="url(#wn-crown)" className="en-m-pulse" style={{ animation: `en-pulse ${6 + c.d}s ease-in-out ${c.d}s infinite` }} />
                  ))}
                  {L.beacons.map((b, k) => (
                    <g key={k} className="en-m-blink" style={{ animation: `en-blink 2.6s linear ${b.d}s infinite` }}>
                      <circle cx={f1(b.x)} cy={f1(b.y)} r="5" fill="#FF3B3B" opacity=".35" />
                      <circle cx={f1(b.x)} cy={f1(b.y)} r="1.8" fill="#FF8A8A" />
                    </g>
                  ))}
                  {/* kabut atmosfer di antara lapisan */}
                  {(L.id === "far" || L.id === "mid") && <rect x="-60" y={f1(baseY - H * 0.34)} width={f1(iw + 120)} height={f1(H * 0.34 + 2)} fill="url(#wn-mist)" opacity={L.id === "far" ? 0.55 : 0.4} />}
                </motion.g>
              ))}
            </g>

            {/* jalan layang + bokeh + jejak lampu */}
            <rect x={ix} y={baseY} width={iw} height={roadH + 2} fill="#070B30" />
            <rect x={ix} y={baseY} width={iw} height="1.5" fill="#FFC594" opacity=".5" />
            {streaks.map((s, i) => (
              <rect
                key={i}
                x="0"
                y={f1(s.y)}
                width={f1(s.len)}
                height="2.4"
                rx="1.2"
                fill={s.dir === "r" ? "url(#wn-white)" : "url(#wn-red)"}
                className="en-m-road"
                style={{ animation: `${s.dir === "r" ? "en-road-r" : "en-road-l"} ${s.dur}s linear ${s.delay}s infinite` }}
              />
            ))}
            {bokeh.map((b, i) => (
              <circle
                key={i}
                cx={f1(b.x)}
                cy={f1(b.y)}
                r={f1(b.r)}
                fill={b.red ? "url(#wn-bokeh-r)" : "url(#wn-bokeh-w)"}
                opacity={b.o}
                className={b.pulse ? "en-m-pulse" : undefined}
                style={b.pulse ? { animation: `en-pulse ${5 + b.d}s ease-in-out ${b.d}s infinite` } : undefined}
              />
            ))}

            {/* pantulan kaca yang menyapu */}
            <g className="en-m-sweep" style={{ animation: "en-sweep 16s ease-in-out 3s infinite" }}>
              <path d={`M${f1(ix)} ${f1(iy)} L${f1(ix + iw * 0.16)} ${f1(iy)} L${f1(ix + iw * 0.06)} ${f1(iy + ih)} L${f1(ix - iw * 0.1)} ${f1(iy + ih)}Z`} fill="url(#wn-glare)" />
            </g>
            {/* sisa pantulan statis di kaca */}
            <path d={`M${f1(ix + iw * 0.62)} ${f1(iy)} L${f1(ix + iw * 0.7)} ${f1(iy)} L${f1(ix + iw * 0.52)} ${f1(iy + ih)} L${f1(ix + iw * 0.44)} ${f1(iy + ih)}Z`} fill="url(#wn-glare)" opacity=".6" />
          </g>

          {/* ===== bingkai logam ===== */}
          <path d={rr(wx, wy, ww, wh, R) + rr(ix, iy, iw, ih, ir)} fillRule="evenodd" fill="url(#wn-frame)" />
          <path d={rr(wx + 0.75, wy + 0.75, ww - 1.5, wh - 1.5, R)} fill="none" stroke="url(#wn-frame-hi)" strokeWidth="1.5" />
          <path d={rr(ix - 1, iy - 1, iw + 2, ih + 2, ir + 1)} fill="none" stroke="#C98A5A" strokeOpacity=".35" strokeWidth="1.2" />
          <path d={rr(ix, iy, iw, ih, ir)} fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="2" />
          {rivets.map((p, i) => (
            <circle key={i} cx={f1(p.x)} cy={f1(p.y)} r={narrow ? 1.8 : 2.6} fill="url(#wn-rivet)" />
          ))}

          {/* sill */}
          <rect x={wx - 14} y={wbot - 2} width={ww + 28} height={narrow ? 8 : 11} rx="4" fill="url(#wn-ledge)" />
          <rect x={wx - 14} y={wbot + (narrow ? 6 : 9)} width={ww + 28} height="26" fill="#000" opacity=".28" />

          {/* tepi kursi di sudut bawah */}
          {!narrow && (
            <>
              <path d={`M0 ${h}V${f1(h * 0.78)}C${f1(w * 0.05)} ${f1(h * 0.75)} ${f1(w * 0.095)} ${f1(h * 0.83)} ${f1(w * 0.105)} ${h}Z`} fill="url(#wn-seat)" />
              <path d={`M0 ${f1(h * 0.78)}C${f1(w * 0.05)} ${f1(h * 0.75)} ${f1(w * 0.095)} ${f1(h * 0.83)} ${f1(w * 0.105)} ${h}`} fill="none" stroke="url(#wn-seat-rim)" strokeWidth="2" />
              <path d={`M${w} ${h}V${f1(h * 0.78)}C${f1(w * 0.95)} ${f1(h * 0.75)} ${f1(w * 0.905)} ${f1(h * 0.83)} ${f1(w * 0.895)} ${h}Z`} fill="url(#wn-seat)" />
              <path d={`M${w} ${f1(h * 0.78)}C${f1(w * 0.95)} ${f1(h * 0.75)} ${f1(w * 0.905)} ${f1(h * 0.83)} ${f1(w * 0.895)} ${h}`} fill="none" stroke="url(#wn-seat-rim)" strokeWidth="2" />
            </>
          )}

          {/* debu halus di berkas cahaya */}
          {motes.map((m, i) => (
            <circle key={i} cx={f1(m.x)} cy={f1(m.y)} r={m.s} fill="#FFE2B8" opacity="0" className="en-m-mote" style={{ animation: `en-mote ${m.t}s ease-out ${m.d}s infinite` }} />
          ))}

          <rect width={w} height={h} fill="url(#wn-vig)" />
        </svg>
      </div>

      {/* butiran film */}
      <div className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ backgroundImage: GRAIN, opacity: 0.09 }} />

      {/* gelembung kaca */}
      <AnimatePresence>
        {lines.map((l, i) => (step > i ? <Bubble key={`${script}-${i}`} line={l} narrow={narrow} style={bubbleStyle(l)} /> : null))}
      </AnimatePresence>
    </motion.div>
  );
}
