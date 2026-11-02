"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": panorama kota dunia di malam hari, tanpa tokoh manusia.
 *  - Langit senja ke malam, bulan, awan, pesawat yang melintas, tiga lapis gedung dengan jendela menyala.
 *  - Dua menara fitur (layar lebar) membawa papan LED berisi kalimat kerja bahasa Inggris & peluang baru.
 *  - Jalan di bawah dengan lampu kendaraan yang lewat, dan papan keberangkatan split-flap:
 *    tujuan kota + "NEW ROLE / GLOBAL TEAM / NEW CLIENT" berganti-ganti.
 * Semua vektor (SVG) + sedikit HTML, tajam di layar berapa pun. Tidak ada parallax kursor.
 * Animasi berhenti otomatis saat adegan keluar dari layar.
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

/* ---------- jendela gedung ---------- */
function facade(x: number, top: number, bw: number, bh: number, r: () => number, lit: number, cw: number, ch: number) {
  const ww = cw * 0.5;
  const wh = ch * 0.52;
  let warm = "";
  let cool = "";
  const blink: { x: number; y: number; w: number; h: number; d: number; t: number }[] = [];
  const cols = Math.max(2, Math.floor((bw - 8) / cw));
  const rows = Math.max(2, Math.floor((bh - 14) / ch));
  const ox = (bw - cols * cw) / 2 + (cw - ww) / 2;
  for (let c = 0; c < cols; c++) {
    for (let rr = 0; rr < rows; rr++) {
      if (r() > lit) continue;
      const wx = x + ox + c * cw;
      const wy = top + 10 + rr * ch;
      const seg = `M${wx.toFixed(1)} ${wy.toFixed(1)}h${ww.toFixed(1)}v${wh.toFixed(1)}h${(-ww).toFixed(1)}Z`;
      if (r() < 0.04 && blink.length < 10) blink.push({ x: wx, y: wy, w: ww, h: wh, d: r() * 6, t: 3 + r() * 6 });
      else if (r() < 0.74) warm += seg;
      else cool += seg;
    }
  }
  return { warm, cool, blink };
}

/* ---------- kota ---------- */
type Layer = {
  id: string;
  body: string;
  warm: string;
  cool: string;
  blink: { x: number; y: number; w: number; h: number; d: number; t: number }[];
  beacons: { x: number; y: number; d: number }[];
  tone: string;
  opacity: number;
};

function buildCity(w: number, baseY: number, H: number, narrow: boolean): Layer[] {
  const defs = [
    { id: "far", seed: 3, gap: 0.78, scale: 0.6, wmin: 40, wmax: 90, tone: "#3B49A8", opacity: 0.55, lit: 0 },
    { id: "mid", seed: 9, gap: 0.92, scale: 0.8, wmin: 56, wmax: 118, tone: "#1B2878", opacity: 1, lit: 0.28 },
    { id: "near", seed: 21, gap: 1.02, scale: 1.0, wmin: 82, wmax: 168, tone: "#0A1040", opacity: 1, lit: 0.4 },
  ];
  const cw = narrow ? 11 : 14;
  const ch = narrow ? 15 : 19;
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
      // tengah dibuat rendah supaya teks hero tetap bersih
      const bh = H * L.scale * (0.07 + 0.5 * Math.pow(edge, 1.2) + r() * 0.08);
      const top = baseY - bh;
      body += `M${x.toFixed(1)} ${baseY + 2}V${top.toFixed(1)}H${(x + bw).toFixed(1)}V${baseY + 2}Z`;
      const roof = r();
      if (roof < 0.3) {
        const sw = bw * 0.38;
        body += `M${(x + bw / 2 - sw / 2).toFixed(1)} ${top}V${(top - 14).toFixed(1)}H${(x + bw / 2 + sw / 2).toFixed(1)}V${top}Z`;
      } else if (roof < 0.52) {
        body += `M${(x + bw / 2 - 1.5).toFixed(1)} ${top}V${(top - 34 * k - r() * 24).toFixed(1)}H${(x + bw / 2 + 1.5).toFixed(1)}V${top}Z`;
      }
      if (L.id !== "far" && edge > 0.45 && r() < 0.4) {
        beacons.push({ x: x + bw / 2, y: top - (roof >= 0.3 && roof < 0.52 ? 40 * k : roof < 0.3 ? 14 : 3), d: r() * 3 });
      }
      if (L.lit > 0 && bh > 40) {
        const f = facade(x, top, bw, bh, r, L.lit, cw, ch);
        warm += f.warm;
        cool += f.cool;
        if (L.id === "near") blink.push(...f.blink);
      }
      x += bw * L.gap * (0.9 + r() * 0.25);
    }
    return { id: L.id, body, warm, cool, blink, beacons, tone: L.tone, opacity: L.opacity };
  });
}

/* ---------- papan LED di menara ---------- */
function Sign({ phrases, style, active, offset, period, font }: { phrases: string[]; style: React.CSSProperties; active: boolean; offset: number; period: number; font: number }) {
  const [i, setI] = useState(offset);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % phrases.length), period);
    return () => window.clearInterval(id);
  }, [active, period, phrases.length]);
  return (
    <div
      className="absolute z-[8] flex items-center overflow-hidden rounded-md bg-[#060A2B]/92 px-2.5 ring-1 ring-sun/45 shadow-[0_0_28px_-6px_rgba(255,242,117,0.55)]"
      style={style}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="font-semibold leading-snug tracking-wide text-sun [text-shadow:0_0_10px_rgba(255,242,117,0.7)]"
          style={{ fontSize: font }}
        >
          {phrases[i]}
        </motion.p>
      </AnimatePresence>
      {/* garis pindai LED */}
      <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.28)_0_1px,transparent_1px_3px)]" />
    </div>
  );
}

/* ---------- papan keberangkatan split-flap ---------- */
const SCREENS: [string, string][][] = [
  [["LONDON", "BOARDING"], ["NEW ROLE", "OPEN"]],
  [["SINGAPORE", "ON TIME"], ["GLOBAL TEAM", "READY"]],
  [["NEW YORK", "NOW BOARDING"], ["NEW CLIENT", "WELCOME"]],
];
const LEN = 12;

function Cells({ text, tick, base, cw, ch, still }: { text: string; tick: number; base: number; cw: number; ch: number; still: boolean }) {
  const chars = text.padEnd(LEN, " ").split("");
  return (
    <span className="flex gap-[2px]">
      {chars.map((c, i) => (
        <span key={i} className="relative inline-block" style={{ width: cw, height: ch, perspective: 240 }}>
          <motion.span
            key={tick}
            initial={still ? false : { rotateX: -90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.3, delay: (base + i) * 0.02, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[3px] bg-gradient-to-b from-[#1D2878] to-[#0A0F3A] font-mono font-bold text-sun"
            style={{ fontSize: ch * 0.6, backfaceVisibility: "hidden" }}
          >
            {c.trim() ? c : " "}
            <span className="absolute inset-x-0 top-1/2 h-px bg-black/70" />
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Board({ tick, narrow, cw, ch, still }: { tick: number; narrow: boolean; cw: number; ch: number; still: boolean }) {
  const screen = SCREENS[tick % SCREENS.length];
  return (
    <div
      className="absolute left-1/2 z-[8] -translate-x-1/2 rounded-2xl bg-[#060A2B]/88 ring-1 ring-white/12 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
      style={{ bottom: narrow ? 12 : 16, padding: narrow ? "8px 10px 10px" : "10px 14px 14px" }}
    >
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
          </svg>
          Departures
        </span>
        <span>Gate EN</span>
      </div>
      <div className="flex flex-col gap-1">
        {screen.map(([dest, status], row) => (
          <div key={row} className="flex" style={{ gap: narrow ? 8 : 14 }}>
            <Cells text={dest} tick={tick} base={row * 2 * LEN} cw={cw} ch={ch} still={still} />
            <Cells text={status} tick={tick} base={row * 2 * LEN + LEN} cw={cw} ch={ch} still={still} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- adegan ---------- */
export function CityScene() {
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
  const wide = w >= 1100;
  const G = narrow ? 122 : 142; // tinggi jalan + plaza di bawah
  const baseY = h - G;
  const H = baseY;
  const road = narrow ? 18 : 24;

  const city = useMemo(() => buildCity(w, baseY, H, narrow), [w, baseY, H, narrow]);
  const stars = useMemo(() => {
    const r = rng(44);
    const n = narrow ? 22 : 36;
    return Array.from({ length: n }, (_, i) => ({ x: r() * w, y: 70 + r() * H * 0.45, s: 0.7 + r() * 1.2, d: r() * 4, t: 2 + r() * 3, tw: i % 2 === 0 }));
  }, [w, H, narrow]);

  // dua menara fitur yang membawa papan LED
  const towers = useMemo(() => {
    if (!wide) return [];
    const mk = (x: number, bw: number, hf: number, seed: number) => {
      const top = baseY - H * hf;
      const f = facade(x, top, bw, baseY - top, rng(seed), 0.36, 14, 19);
      return { x, bw, top, ...f };
    };
    return [mk(w * 0.035, w * 0.15, 0.52, 5), mk(w * 0.815, w * 0.15, 0.44, 8)];
  }, [wide, w, baseY, H]);

  // papan split-flap
  const [tick, setTick] = useState(0);
  const active = inView && !reduce;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 5200);
    return () => window.clearInterval(id);
  }, [active]);
  const cw = narrow ? 12 : w < 900 ? 17 : 21;
  const ch = narrow ? 22 : w < 900 ? 28 : 34;

  const moonX = w * 0.86;
  const moonY = h * 0.2;
  const R_ = (v: number) => v.toFixed(1);
  const rise = (i: number) => (reduce ? { initial: false as const } : { initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, delay: 0.15 + i * 0.18, ease: "easeOut" as const } });

  const streaks = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: narrow ? 6 : 10 }, (_, i) => ({
      y: baseY + 6 + (i % 2) * (road * 0.42) + (i % 3) * 1.5,
      len: 70 + r() * 90,
      dir: i % 2 === 0 ? "r" : "l",
      dur: 8 + r() * 8,
      delay: -r() * 16,
    }));
  }, [narrow, baseY, road]);

  return (
    <motion.div
      ref={root}
      aria-hidden
      className={`absolute inset-0 z-[6] overflow-hidden ${inView ? "" : "en-paused"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.8 }}
      style={{ background: "#0A0F36" }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ct-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={baseY}>
            <stop offset="0%" stopColor="#060A2A" />
            <stop offset="34%" stopColor="#0F1A66" />
            <stop offset="62%" stopColor="#2F3FA8" />
            <stop offset="80%" stopColor="#7E6FCB" />
            <stop offset="92%" stopColor="#E8908C" />
            <stop offset="100%" stopColor="#FFC08F" />
          </linearGradient>
          <radialGradient id="ct-moon" gradientUnits="userSpaceOnUse" cx={moonX} cy={moonY} r={h * 0.18}>
            <stop offset="0%" stopColor="#FFF6D6" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#BFD0FF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#BFD0FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ct-haze" gradientUnits="userSpaceOnUse" x1="0" y1={baseY - H * 0.3} x2="0" y2={baseY}>
            <stop offset="0%" stopColor="#FFB28A" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFB28A" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="ct-ground" gradientUnits="userSpaceOnUse" x1="0" y1={baseY} x2="0" y2={h}>
            <stop offset="0%" stopColor="#0B1142" />
            <stop offset="100%" stopColor="#04061C" />
          </linearGradient>
          <linearGradient id="ct-tower" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#080D38" />
            <stop offset="100%" stopColor="#16227A" />
          </linearGradient>
          <linearGradient id="ct-white" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFF6D6" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFF6D6" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="ct-red" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF4B4B" stopOpacity="0" />
            <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="ct-cloud">
            <stop offset="0%" stopColor="#FFD7C0" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFD7C0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ct-vig" cx="50%" cy="45%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>

        {/* langit */}
        <rect width={w} height={baseY} fill="url(#ct-sky)" />
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={R_(s.x)}
            cy={R_(s.y)}
            r={s.s}
            fill="#fff"
            opacity={s.tw ? undefined : 0.7}
            className={s.tw ? "en-m-twinkle" : undefined}
            style={s.tw ? { animation: `en-twinkle ${s.t}s ease-in-out ${s.d}s infinite` } : undefined}
          />
        ))}
        {!narrow && (
          <>
            <circle cx={moonX} cy={moonY} r={h * 0.18} fill="url(#ct-moon)" />
            <circle cx={moonX} cy={moonY} r={Math.max(22, h * 0.034)} fill="#FFF3CF" />
            <circle cx={moonX - h * 0.01} cy={moonY - h * 0.006} r={h * 0.006} fill="#E7DAB4" opacity=".7" />
            <circle cx={moonX + h * 0.012} cy={moonY + h * 0.012} r={h * 0.0045} fill="#E7DAB4" opacity=".6" />
          </>
        )}
        {/* awan */}
        {[0.3, 0.44, 0.22].map((f, i) => (
          <g key={i} className="en-m-drift" style={{ animation: `en-drift ${150 + i * 50}s linear ${-i * 62}s infinite` }}>
            <ellipse cx="0" cy={R_(H * f)} rx={w * (0.13 + i * 0.03)} ry={H * 0.04} fill="url(#ct-cloud)" />
          </g>
        ))}
        {/* pesawat dengan jejak */}
        <g className="en-m-fly" style={{ animation: "en-fly 70s linear 2s infinite" }}>
          <g transform={`translate(0 ${R_(H * 0.2)})`}>
            <path d="M0 0 L-120 0" stroke="#fff" strokeOpacity=".18" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M0 0 L9 -1.2 L12 0 L9 1.2Z M3.5 0 L1 -4.5 L2.6 -4.5 L6 0Z M3.5 0 L1 4.5 L2.6 4.5 L6 0Z" fill="#E8EDFF" opacity=".9" />
            <circle cx="0" cy="0" r="1.5" fill="#FF5A5A" className="en-m-blink" style={{ animation: "en-blink 1.6s linear infinite" }} />
          </g>
        </g>

        {/* kota, naik berurutan saat muncul */}
        {city.map((L, i) => (
          <motion.g key={L.id} {...rise(i)}>
            <path d={L.body} fill={L.tone} opacity={L.opacity} />
            {L.warm && <path d={L.warm} fill="#FFD98A" opacity=".92" />}
            {L.cool && <path d={L.cool} fill="#BFE3FF" opacity=".85" />}
            {L.blink.map((b, k) => (
              <rect key={k} x={R_(b.x)} y={R_(b.y)} width={R_(b.w)} height={R_(b.h)} fill="#FFE2A6" className="en-m-twinkle" style={{ animation: `en-twinkle ${b.t}s ease-in-out ${b.d}s infinite` }} />
            ))}
          </motion.g>
        ))}

        {/* menara fitur */}
        {towers.map((t, i) => (
          <motion.g key={i} {...rise(3 + i)}>
            <path d={`M${R_(t.x)} ${baseY + 2}V${R_(t.top)}H${R_(t.x + t.bw)}V${baseY + 2}Z`} fill="url(#ct-tower)" />
            <path d={`M${R_(t.x + t.bw * 0.2)} ${R_(t.top)}V${R_(t.top - 26)}H${R_(t.x + t.bw * 0.8)}V${R_(t.top)}Z`} fill="#0B1250" />
            {i === 0 && <rect x={R_(t.x + t.bw * 0.5 - 1.5)} y={R_(t.top - 90)} width="3" height="64" fill="#0B1250" />}
            <rect x={R_(t.x + t.bw - 2.5)} y={R_(t.top)} width="2.5" height={R_(baseY - t.top)} fill="#FFC594" opacity=".35" />
            {t.warm && <path d={t.warm} fill="#FFD98A" opacity=".9" />}
            {t.cool && <path d={t.cool} fill="#BFE3FF" opacity=".8" />}
            <circle cx={R_(t.x + t.bw * 0.5)} cy={R_(t.top - (i === 0 ? 92 : 28))} r="6" fill="#FF3B3B" opacity=".4" className="en-m-blink" style={{ animation: `en-blink 2.6s linear ${i}s infinite` }} />
            <circle cx={R_(t.x + t.bw * 0.5)} cy={R_(t.top - (i === 0 ? 92 : 28))} r="2" fill="#FF8A8A" className="en-m-blink" style={{ animation: `en-blink 2.6s linear ${i}s infinite` }} />
          </motion.g>
        ))}

        {/* lampu peringatan di puncak gedung */}
        {city.flatMap((L) =>
          L.beacons.map((b, i) => (
            <g key={`${L.id}${i}`} className="en-m-blink" style={{ animation: `en-blink 2.6s linear ${b.d}s infinite` }}>
              <circle cx={R_(b.x)} cy={R_(b.y)} r="5" fill="#FF3B3B" opacity=".35" />
              <circle cx={R_(b.x)} cy={R_(b.y)} r="1.8" fill="#FF8A8A" />
            </g>
          )),
        )}
        <rect x="0" y={baseY - H * 0.3} width={w} height={H * 0.3} fill="url(#ct-haze)" />

        {/* jalan & plaza */}
        <rect x="0" y={baseY} width={w} height={G} fill="url(#ct-ground)" />
        <rect x="0" y={baseY} width={w} height={road} fill="#070B30" />
        <rect x="0" y={baseY} width={w} height="1.5" fill="#FFC594" opacity=".5" />
        <rect x="0" y={baseY + road} width={w} height="1.5" fill="#fff" opacity=".08" />
        {streaks.map((s, i) => (
          <rect
            key={i}
            x="0"
            y={R_(s.y)}
            width={R_(s.len)}
            height="2.4"
            rx="1.2"
            fill={s.dir === "r" ? "url(#ct-white)" : "url(#ct-red)"}
            className="en-m-road"
            style={{ animation: `${s.dir === "r" ? "en-road-r" : "en-road-l"} ${s.dur}s linear ${s.delay}s infinite` }}
          />
        ))}

        <rect width={w} height={h} fill="url(#ct-vig)" />
      </svg>

      {/* papan LED di menara */}
      {towers.map((t, i) => (
        <Sign
          key={i}
          active={active}
          offset={i}
          period={i === 0 ? 4800 : 5600}
          font={w < 1300 ? 13 : 15}
          phrases={i === 0 ? ["Let's align on next steps.", "Could we reschedule the call?", "Thank you for your time."] : ["Open to new opportunities.", "Looking forward to working with you.", "Welcome to the team."]}
          style={{ left: t.x + 10, top: t.top + 44, width: t.bw - 20, height: 76 }}
        />
      ))}

      <Board tick={tick} narrow={narrow} cw={cw} ch={ch} still={reduce} />
    </motion.div>
  );
}
