"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": ruang rapat di lantai atas, sudut pandang dari meja kerja.
 *  - Jendela kaca setinggi dinding menghadap kota saat senja: tiga lapis gedung, lampu jendela berkelip,
 *    lampu peringatan merah, awan lewat pelan, pesawat kecil melintas, matahari terbenam di belakang gedung.
 *  - Di seberang meja: rekan kerja dalam siluet (kena cahaya dari belakang). Di meja: laptop, buku catatan,
 *    kopi beruap, dan pantulan kota di permukaan meja yang mengilap.
 *  - Gelembung obrolan bahasa Inggris muncul bergantian (percakapan kerja + satu tips dari English Now).
 * Semua digambar sebagai SVG vektor, jadi tajam di layar berapa pun.
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

/* ---------- kota ---------- */
type Layer = { id: string; body: string; warm: string; cool: string; blink: { x: number; y: number; w: number; h: number; d: number; t: number }[]; beacons: { x: number; y: number; d: number }[]; tone: string; opacity: number };

function buildCity(w: number, baseY: number, H: number, narrow: boolean): Layer[] {
  const defs = [
    { id: "far", seed: 3, gap: 0.78, scale: 0.6, wmin: 40, wmax: 90, tone: "#4A57B8", opacity: 0.5, lit: 0 },
    { id: "mid", seed: 9, gap: 0.92, scale: 0.8, wmin: 56, wmax: 118, tone: "#1D2A80", opacity: 1, lit: 0.3 },
    { id: "near", seed: 21, gap: 1.02, scale: 1.0, wmin: 82, wmax: 168, tone: "#0B1140", opacity: 1, lit: 0.42 },
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
    const blink: Layer["blink"] = [];
    const beacons: Layer["beacons"] = [];
    let x = -60;
    while (x < w + 60) {
      const bw = (L.wmin + r() * (L.wmax - L.wmin)) * k;
      const xc = (x + bw / 2) / w;
      const edge = Math.min(1, Math.abs(xc - 0.5) * 2);
      const bh = H * L.scale * (0.16 + 0.46 * Math.pow(edge, 1.15) + r() * 0.12);
      const top = baseY - bh;
      body += `M${x.toFixed(1)} ${baseY + 2}V${top.toFixed(1)}H${(x + bw).toFixed(1)}V${baseY + 2}Z`;
      // atap bertingkat / antena
      const roof = r();
      if (roof < 0.3) {
        const sw = bw * 0.38;
        body += `M${(x + bw / 2 - sw / 2).toFixed(1)} ${top}V${(top - 14).toFixed(1)}H${(x + bw / 2 + sw / 2).toFixed(1)}V${top}Z`;
      } else if (roof < 0.52) {
        body += `M${(x + bw / 2 - 1.5).toFixed(1)} ${top}V${(top - 34 * k - r() * 24).toFixed(1)}H${(x + bw / 2 + 1.5).toFixed(1)}V${top}Z`;
      }
      if (L.id !== "far" && bh > H * 0.3 && r() < 0.55) beacons.push({ x: x + bw / 2, y: top - (roof < 0.52 && roof >= 0.3 ? 40 * k : roof < 0.3 ? 14 : 3), d: r() * 3 });
      // jendela menyala
      if (L.lit > 0) {
        const cols = Math.max(2, Math.floor((bw - 8) / cw));
        const rows = Math.max(2, Math.floor((bh - 14) / ch));
        const ox = (bw - cols * cw) / 2 + (cw - ww) / 2;
        for (let cI = 0; cI < cols; cI++) {
          for (let rI = 0; rI < rows; rI++) {
            if (r() > L.lit) continue;
            const wx = x + ox + cI * cw;
            const wy = top + 10 + rI * ch;
            const seg = `M${wx.toFixed(1)} ${wy.toFixed(1)}h${ww.toFixed(1)}v${wh.toFixed(1)}h${(-ww).toFixed(1)}Z`;
            if (L.id === "near" && r() < 0.07) {
              blink.push({ x: wx, y: wy, w: ww, h: wh, d: r() * 6, t: 3 + r() * 6 });
            } else if (r() < 0.72) warm += seg;
            else cool += seg;
          }
        }
      }
      x += bw * L.gap * (0.9 + r() * 0.25);
    }
    return { id: L.id, body, warm, cool, blink, beacons, tone: L.tone, opacity: L.opacity };
  });
}

/* ---------- orang (siluet berlatar cahaya senja) ---------- */
type Kind = "hijab" | "short" | "ponytail" | "bun";

function Person({ x, y, u, kind, delay = 0 }: { x: number; y: number; u: number; kind: Kind; delay?: number }) {
  const p = (a: number, b: number) => `${(a * u).toFixed(1)} ${(b * u).toFixed(1)}`;
  const body = `M${p(-3.7, 0)} L${p(-3.5, -3.2)} Q${p(-3.4, -5)} ${p(-1.5, -5.7)} L${p(1.5, -5.7)} Q${p(3.4, -5)} ${p(3.5, -3.2)} L${p(3.7, 0)}Z`;
  const hair: Record<Kind, string> = {
    short: `M${p(-1.12, -7.5)} Q${p(-1.2, -9.3)} ${p(0, -9.3)} Q${p(1.2, -9.3)} ${p(1.12, -7.5)} Q${p(0.8, -8.5)} ${p(0, -8.6)} Q${p(-0.8, -8.5)} ${p(-1.12, -7.5)}Z`,
    ponytail: `M${p(-1.12, -7.5)} Q${p(-1.25, -9.4)} ${p(0, -9.4)} Q${p(1.25, -9.4)} ${p(1.12, -7.5)} Q${p(1.5, -7.2)} ${p(1.9, -6.2)} Q${p(2.2, -5.3)} ${p(1.5, -5.4)} Q${p(1.3, -6.4)} ${p(1.05, -7)} Q${p(0.8, -8.5)} ${p(0, -8.6)} Q${p(-0.8, -8.5)} ${p(-1.12, -7.5)}Z`,
    bun: `M${p(-1.12, -7.5)} Q${p(-1.2, -9.3)} ${p(0, -9.3)} Q${p(1.2, -9.3)} ${p(1.12, -7.5)} Q${p(0.8, -8.5)} ${p(0, -8.6)} Q${p(-0.8, -8.5)} ${p(-1.12, -7.5)}Z M${p(0, -10.3)} m${p(-0.55, 0)} a${(0.55 * u).toFixed(1)} ${(0.55 * u).toFixed(1)} 0 1 0 ${(1.1 * u).toFixed(1)} 0 a${(0.55 * u).toFixed(1)} ${(0.55 * u).toFixed(1)} 0 1 0 ${(-1.1 * u).toFixed(1)} 0Z`,
    hijab: `M${p(-1.45, -7.4)} Q${p(-1.6, -9.8)} ${p(0, -9.9)} Q${p(1.6, -9.8)} ${p(1.45, -7.4)} Q${p(1.5, -6.1)} ${p(2.7, -4.9)} L${p(-2.7, -4.9)} Q${p(-1.5, -6.1)} ${p(-1.45, -7.4)}Z`,
  };
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <g className="en-m-breathe" style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: `en-breathe ${6 + delay}s ease-in-out ${delay}s infinite` }}>
        {/* sandaran kursi */}
        <rect x={-3.2 * u} y={-9.6 * u} width={6.4 * u} height={10.6 * u} rx={2.6 * u} fill="#0C1240" stroke="url(#mt-rim)" strokeWidth="1" />
        <path d={body} fill="url(#mt-person)" stroke="url(#mt-rim)" strokeWidth="1.6" />
        <rect x={-0.55 * u} y={-6.7 * u} width={1.1 * u} height={1.2 * u} fill="#090D30" />
        <ellipse cx="0" cy={-7.6 * u} rx={1.05 * u} ry={1.28 * u} fill="#090D30" stroke="url(#mt-rim)" strokeWidth="1.4" />
        <path d={hair[kind]} fill="#070A26" stroke="url(#mt-rim)" strokeWidth="1.2" />
        {/* kerah kemeja yang samar */}
                <ellipse cx={0.45 * u} cy={-7.5 * u} rx={0.35 * u} ry={0.7 * u} fill="#FFC9A0" opacity=".1" />
      </g>
    </g>
  );
}

/* ---------- percakapan ---------- */
type Line = { who: 0 | 1 | "tip"; text: string };
const SCRIPTS: Line[][] = [
  [
    { who: 0, text: "Shall we move the launch to Friday?" },
    { who: 1, text: "Sounds good. I'll update the timeline." },
    { who: "tip", text: "Polite & clear: “Shall we…?”" },
  ],
  [
    { who: 1, text: "Could you share the report before noon?" },
    { who: 0, text: "Of course. I'll send it right away." },
    { who: "tip", text: "Request politely: “Could you…?”" },
  ],
  [
    { who: 0, text: "What do you think about the proposal?" },
    { who: 1, text: "I'd suggest a few small changes." },
    { who: "tip", text: "Soften feedback: “I'd suggest…”" },
  ],
];

function Bubble({ line, style, narrow }: { line: Line; style: React.CSSProperties; narrow: boolean }) {
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setTyping(false), 650);
    return () => window.clearTimeout(t);
  }, []);
  const tip = line.who === "tip";
  const mine = line.who === 1;
  const tone = tip
    ? "bg-sun text-cobalt-900 shadow-[0_14px_40px_-12px_rgba(244,199,123,0.65)]"
    : mine
      ? "bg-cobalt text-white shadow-[0_14px_40px_-12px_rgba(64,95,218,0.7)]"
      : "bg-white/95 text-cobalt-900 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.5)]";
  return (
    <div className="absolute z-[8]" style={{ ...style, width: narrow ? "min(44vw, 176px)" : "min(21vw, 292px)" }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={`rounded-2xl px-3.5 py-2.5 ${tone}`}
    >
      {tip && <p className="mb-0.5 text-[10px] font-bold tracking-[0.14em] uppercase opacity-70">English Now tip</p>}
      {typing ? (
        <span className="flex h-5 items-center gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="size-1.5 rounded-full bg-current opacity-60" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
          ))}
        </span>
      ) : (
        <p className={`${narrow ? "text-[12.5px]" : "text-[15px]"} leading-snug font-semibold`}>{line.text}</p>
      )}
    </motion.div>
    </div>
  );
}

/* ---------- adegan ---------- */
export function MeetingScene() {
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
  const ceil = narrow ? 66 : 80;
  const tableTop = Math.round(h * (narrow ? 0.78 : 0.76));
  const H = tableTop - ceil;
  const city = useMemo(() => buildCity(w, tableTop, H, narrow), [w, tableTop, H, narrow]);
  const stars = useMemo(() => {
    const r = rng(44);
    return Array.from({ length: 46 }, () => ({ x: r() * w, y: ceil + r() * H * 0.5, s: 0.7 + r() * 1.2, d: r() * 4, t: 2 + r() * 3 }));
  }, [w, ceil, H]);

  // orang
  const u = narrow ? Math.max(8.5, w * 0.024) : Math.min(16, Math.max(11, w * 0.0112));
  const seats: { x: number; kind: Kind }[] = narrow
    ? [
        { x: w * 0.2, kind: "hijab" },
        { x: w * 0.8, kind: "short" },
      ]
    : [
        { x: w * 0.12, kind: "hijab" },
        { x: w * 0.25, kind: "short" },
        { x: w * 0.75, kind: "bun" },
        { x: w * 0.88, kind: "short" },
      ];
  const speakerX = narrow ? [seats[0].x, seats[1].x] : [seats[0].x, seats[3].x];

  // parallax halus mengikuti kursor (hanya layar dengan mouse)
  const layers = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      const f = [4, 9, 16];
      layers.current.forEach((g, i) => g?.style.setProperty("transform", `translate(${(-dx * f[i]).toFixed(1)}px, ${(-dy * f[i] * 0.5).toFixed(1)}px)`));
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduce]);

  // urutan percakapan
  const [script, setScript] = useState(0);
  const [step, setStep] = useState(reduce ? 3 : 0);
  useEffect(() => {
    if (reduce || !inView) return;
    const ts: number[] = [];
    ts.push(window.setTimeout(() => setStep(1), 700));
    ts.push(window.setTimeout(() => setStep(2), 3200));
    ts.push(window.setTimeout(() => setStep(3), 5800));
    ts.push(window.setTimeout(() => setStep(0), 11000));
    ts.push(window.setTimeout(() => setScript((s) => (s + 1) % SCRIPTS.length), 11500));
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, [reduce, inView, script]);
  const lines = SCRIPTS[script];

  const headTop = tableTop - u * 10;
  const bubbleStyle = (l: Line): React.CSSProperties => {
    if (l.who === "tip") {
      return narrow
        ? { left: "50%", top: tableTop + 118, transform: "translateX(-50%)" }
        : { left: "51%", top: tableTop + h * 0.07 };
    }
    const sx = speakerX[l.who];
    if (narrow) {
      return l.who === 0 ? { left: 12, top: tableTop + 24 } : { right: 12, top: tableTop + 24 };
    }
    return { left: sx, top: headTop - 14, transform: "translate(-50%, -100%)" };
  };

  const sunX = w * (narrow ? 0.7 : 0.72);
  const sunY = tableTop - H * 0.27;
  const R_ = (v: number) => v.toFixed(1);

  return (
    <motion.div
      ref={root}
      aria-hidden
      className="absolute inset-0 z-[6] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.8 }}
      style={{ background: "#0A0F36" }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mt-sky" gradientUnits="userSpaceOnUse" x1="0" y1={ceil} x2="0" y2={tableTop}>
            <stop offset="0%" stopColor="#070B2E" />
            <stop offset="30%" stopColor="#121C68" />
            <stop offset="52%" stopColor="#3447B0" />
            <stop offset="70%" stopColor="#8A7AD2" />
            <stop offset="86%" stopColor="#F0A290" />
            <stop offset="100%" stopColor="#FFD3A2" />
          </linearGradient>
          <radialGradient id="mt-sun" gradientUnits="userSpaceOnUse" cx={sunX} cy={sunY} r={H * 0.42}>
            <stop offset="0%" stopColor="#FFF1CC" stopOpacity="1" />
            <stop offset="14%" stopColor="#FFD59A" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#FF9F7E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF9F7E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mt-haze" gradientUnits="userSpaceOnUse" x1="0" y1={tableTop - H * 0.34} x2="0" y2={tableTop}>
            <stop offset="0%" stopColor="#FFB28A" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFB28A" stopOpacity="0.42" />
          </linearGradient>
          <linearGradient id="mt-table" gradientUnits="userSpaceOnUse" x1="0" y1={tableTop} x2="0" y2={h}>
            <stop offset="0%" stopColor="#2A3590" />
            <stop offset="18%" stopColor="#18205F" />
            <stop offset="100%" stopColor="#090D2E" />
          </linearGradient>
          <linearGradient id="mt-ceil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A0E2E" />
            <stop offset="100%" stopColor="#141B52" />
          </linearGradient>
          <linearGradient id="mt-person" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10174F" />
            <stop offset="100%" stopColor="#070A26" />
          </linearGradient>
          <linearGradient id="mt-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFB48A" stopOpacity="0" />
            <stop offset="55%" stopColor="#FFB48A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFD9AE" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="mt-refl" gradientUnits="userSpaceOnUse" x1="0" y1={tableTop} x2="0" y2={tableTop + h * 0.2}>
            <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="mt-refl-mask">
            <rect x="0" y={tableTop} width={w} height={h - tableTop} fill="url(#mt-refl)" />
          </mask>
          <linearGradient id="mt-shaft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFC594" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FFC594" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mt-pillar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#05071F" />
            <stop offset="100%" stopColor="#141A55" />
          </linearGradient>
          <radialGradient id="mt-vig" cx="50%" cy="45%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
          </radialGradient>
          <filter id="mt-blur6" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="mt-blur2" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <clipPath id="mt-glass">
            <rect x="0" y={ceil} width={w} height={H} />
          </clipPath>
          <clipPath id="mt-tableclip">
            <rect x="0" y={tableTop} width={w} height={h - tableTop} />
          </clipPath>
          {/* kota (dipakai dua kali: jendela & pantulan di meja) */}
          <g id="mt-city">
            {city.map((L, i) => (
              <g key={L.id} ref={(el) => { layers.current[i] = el; }} style={{ transition: "transform .5s ease-out" }}>
                <path d={L.body} fill={L.tone} opacity={L.opacity} />
                {L.warm && <path d={L.warm} fill="#FFD98A" opacity=".92" />}
                {L.cool && <path d={L.cool} fill="#BFE3FF" opacity=".85" />}
                {L.blink.map((b, k) => (
                  <rect key={k} x={R_(b.x)} y={R_(b.y)} width={R_(b.w)} height={R_(b.h)} fill="#FFE2A6" className="en-m-twinkle" style={{ animation: `en-twinkle ${b.t}s ease-in-out ${b.d}s infinite` }} />
                ))}
              </g>
            ))}
          </g>
        </defs>

        {/* dinding */}
        <rect width={w} height={h} fill="#0A0F36" />

        {/* ===== jendela ===== */}
        <g clipPath="url(#mt-glass)">
          <rect x="0" y={ceil} width={w} height={H} fill="url(#mt-sky)" />
          {stars.map((s, i) => (
            <circle key={i} cx={R_(s.x)} cy={R_(s.y)} r={s.s} fill="#fff" className="en-m-twinkle" style={{ animation: `en-twinkle ${s.t}s ease-in-out ${s.d}s infinite` }} />
          ))}
          <circle cx={sunX} cy={sunY} r={H * 0.42} fill="url(#mt-sun)" />
          {/* awan */}
          {[0.34, 0.5, 0.26].map((f, i) => (
            <g key={i} className="en-m-drift" style={{ animation: `en-drift ${150 + i * 50}s linear ${-i * 62}s infinite` }}>
              <ellipse cx="0" cy={ceil + H * f} rx={w * (0.13 + i * 0.03)} ry={H * 0.02} fill="#FFD7C0" opacity={0.17 - i * 0.03} filter="url(#mt-blur6)" />
              <ellipse cx={w * 0.06} cy={ceil + H * f - 8} rx={w * 0.07} ry={H * 0.014} fill="#fff" opacity=".1" filter="url(#mt-blur6)" />
            </g>
          ))}
          {/* pesawat kecil melintas */}
          <g className="en-m-fly" style={{ animation: "en-fly 75s linear 3s infinite" }}>
            <g transform={`translate(0 ${R_(ceil + H * 0.2)})`}>
              <path d="M0 0 L9 -1.2 L12 0 L9 1.2Z M3.5 0 L1 -4.5 L2.6 -4.5 L6 0Z M3.5 0 L1 4.5 L2.6 4.5 L6 0Z" fill="#E8EDFF" opacity=".85" />
              <circle cx="0" cy="0" r="1.4" fill="#FF5A5A" className="en-m-blink" style={{ animation: "en-blink 1.6s linear infinite" }} />
              <path d="M0 0 L-90 0" stroke="#fff" strokeOpacity=".16" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>
          <use href="#mt-city" />
          {/* lampu peringatan merah di puncak gedung */}
          {city.flatMap((L) => L.beacons.map((b, i) => (
            <g key={`${L.id}${i}`}>
              <circle cx={R_(b.x)} cy={R_(b.y)} r="7" fill="#FF3B3B" opacity=".5" filter="url(#mt-blur2)" className="en-m-blink" style={{ animation: `en-blink 2.6s linear ${b.d}s infinite` }} />
              <circle cx={R_(b.x)} cy={R_(b.y)} r="1.8" fill="#FF8A8A" className="en-m-blink" style={{ animation: `en-blink 2.6s linear ${b.d}s infinite` }} />
            </g>
          )))}
          <rect x="0" y={tableTop - H * 0.34} width={w} height={H * 0.34} fill="url(#mt-haze)" />
          {/* pantulan kaca yang menyapu pelan */}
          <g className="en-m-sweep" style={{ animation: "en-sweep 16s ease-in-out 2s infinite" }}>
            <path d={`M0 ${ceil} L${w * 0.09} ${ceil} L${w * 0.03} ${tableTop} L${-w * 0.06} ${tableTop}Z`} fill="#fff" opacity=".05" />
            <path d={`M${w * 0.11} ${ceil} L${w * 0.125} ${ceil} L${w * 0.065} ${tableTop} L${w * 0.05} ${tableTop}Z`} fill="#fff" opacity=".07" />
          </g>
          {/* kaca: garis sambungan panel */}
          {[0.3, 0.7].map((f) => (
            <rect key={f} x={w * f} y={ceil} width="1.4" height={H} fill="#fff" opacity=".08" />
          ))}
        </g>

        {/* ===== tiang kiri-kanan ===== */}
        <rect x="0" y={ceil} width={w * 0.04} height={H} fill="url(#mt-pillar)" />
        <rect x={w * 0.96} y={ceil} width={w * 0.04} height={H} fill="#080C2C" />
        <rect x={w * 0.04 - 2} y={ceil} width="2" height={H} fill="#fff" opacity=".1" />

        {/* ===== langit-langit ===== */}
        <rect x="0" y="0" width={w} height={ceil} fill="url(#mt-ceil)" />
        {[0.18, 0.5, 0.82].map((f) => (
          <g key={f}>
            <rect x={w * f - w * 0.09} y={ceil - 12} width={w * 0.18} height="3" rx="1.5" fill="#FFE3B8" opacity=".95" />
            <rect x={w * f - w * 0.09} y={ceil - 16} width={w * 0.18} height="14" fill="#FFD9A0" opacity=".16" filter="url(#mt-blur6)" />
          </g>
        ))}
        <rect x="0" y={ceil - 1} width={w} height="2" fill="#fff" opacity=".08" />

        {/* ===== orang di seberang meja ===== */}
        {seats.map((s, i) => (
          <Person key={i} x={s.x} y={tableTop + 2} u={u} kind={s.kind} delay={i * 0.8} />
        ))}

        {/* ===== meja ===== */}
        <rect x="0" y={tableTop} width={w} height={h - tableTop} fill="url(#mt-table)" />
        <g clipPath="url(#mt-tableclip)">
          {/* pantulan kota di permukaan meja */}
          <g mask="url(#mt-refl-mask)" opacity=".5" filter="url(#mt-blur2)">
            <use href="#mt-city" transform={`translate(0 ${tableTop * 2}) scale(1 -1)`} />
          </g>
          {/* pantulan matahari memanjang */}
          <rect x={sunX - 36} y={tableTop} width="72" height={h * 0.2} fill="url(#mt-shaft)" opacity=".9" className="en-m-pulse" style={{ animation: "en-pulse 7s ease-in-out infinite" }} />
          {/* berkas cahaya dari jendela */}
          {[0.2, 0.46, 0.62].map((f, i) => (
            <path key={f} d={`M${w * f} ${tableTop} L${w * (f + 0.08)} ${tableTop} L${w * (f + 0.2 + i * 0.03)} ${h} L${w * (f - 0.06)} ${h}Z`} fill="url(#mt-shaft)" opacity=".55" className="en-m-pulse" style={{ animation: `en-pulse ${8 + i * 2}s ease-in-out ${i}s infinite` }} />
          ))}
        </g>
        <rect x="0" y={tableTop} width={w} height="2.5" fill="#B9C6FF" opacity=".55" />
        <rect x="0" y={tableTop + 2.5} width={w} height="10" fill="#fff" opacity=".05" />

        {/* laptop tiap peserta (terlihat dari belakang layar) */}
        {seats.map((s, i) => (
          <g key={`lp${i}`} transform={`translate(${s.x.toFixed(1)} ${tableTop})`}>
            <path d={`M${-2.7 * u} ${0.9 * u} L${-2.5 * u} ${-2.4 * u} H${2.5 * u} L${2.7 * u} ${0.9 * u}Z`} fill="#1A2166" />
            <path d={`M${-2.5 * u} ${-2.4 * u} H${2.5 * u}`} stroke="#BFD6FF" strokeWidth="1.6" opacity=".85" />
            <circle cx="0" cy={-0.8 * u} r={0.5 * u} fill="#fff" opacity=".3" />
          </g>
        ))}

        {/* ===== benda di meja ===== */}
        {!narrow && (
          <>
            {/* laptop dari belakang */}
            <g transform={`translate(${w * 0.07} ${tableTop + h * 0.1}) rotate(-3)`}>
              <rect x="-6" y="130" width={w * 0.23 + 12} height="14" rx="6" fill="#000" opacity=".4" filter="url(#mt-blur6)" />
              <path d={`M0 0 H${w * 0.23} L${w * 0.235} ${h * 0.12} H-8Z`} fill="#1A2166" />
              <rect x="-10" y={h * 0.12} width={w * 0.23 + 22} height="9" rx="4" fill="#2B3690" />
              <path d={`M0 0 H${w * 0.23}`} stroke="#BFD6FF" strokeWidth="2.4" opacity=".9" />
              <path d={`M0 0 L-8 ${h * 0.12}`} stroke="#BFD6FF" strokeWidth="1.4" opacity=".35" />
              <circle cx={w * 0.115} cy={h * 0.055} r="13" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
              <circle cx={w * 0.115} cy={h * 0.055} r="5" fill="#fff" opacity=".28" />
            </g>
            {/* buku catatan + pulpen */}
            <g transform={`translate(${w * 0.74} ${tableTop + h * 0.12}) rotate(-8)`}>
              <rect x="6" y="104" width={w * 0.14} height="12" rx="6" fill="#000" opacity=".4" filter="url(#mt-blur6)" />
              <rect x="0" y="0" width={w * 0.14} height={h * 0.1} rx="6" fill="#405FDA" />
              <rect x="0" y="0" width="14" height={h * 0.1} rx="4" fill="#2C45B0" />
              <rect x={w * 0.14 - 26} y="0" width="10" height={h * 0.1} fill="#FFF275" />
              <rect x="18" y="10" width={w * 0.07} height="3" rx="1.5" fill="#fff" opacity=".5" />
              <rect x="18" y="20" width={w * 0.045} height="3" rx="1.5" fill="#fff" opacity=".3" />
            </g>
            {/* kopi */}
            <g transform={`translate(${w * 0.4} ${tableTop + h * 0.13})`}>
              <ellipse cx="0" cy="18" rx="46" ry="11" fill="#000" opacity=".4" filter="url(#mt-blur2)" />
              <ellipse cx="0" cy="12" rx="38" ry="9" fill="#E9ECFA" />
              <path d="M-24 -18 H24 L20 12 Q0 20 -20 12Z" fill="#F5F7FF" />
              <ellipse cx="0" cy="-18" rx="24" ry="6.5" fill="#3B2415" />
              <ellipse cx="-5" cy="-19" rx="9" ry="2" fill="#7B5236" opacity=".6" />
              <path d="M24 -10 q14 2 10 14 q-3 6 -12 6" fill="none" stroke="#F5F7FF" strokeWidth="4.5" strokeLinecap="round" />
              {[-8, 2, 11].map((x, i) => (
                <path key={x} d={`M${x} -26 q-6 -9 0 -17 q6 -8 0 -17`} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" className="en-m-steam" style={{ animation: `en-steam 3.6s ease-out ${i * 1.1}s infinite` }} />
              ))}
            </g>
          </>
        )}

        {/* vinyet halus supaya fokus ke tengah */}
        <rect width={w} height={h} fill="url(#mt-vig)" />
      </svg>

      {/* gelembung obrolan */}
      <AnimatePresence>
        {lines.map((l, i) => (step > i ? <Bubble key={`${script}-${i}`} line={l} narrow={narrow} style={bubbleStyle(l)} /> : null))}
      </AnimatePresence>
    </motion.div>
  );
}
