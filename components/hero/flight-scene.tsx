"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationFrame, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate" (percobaan): pemandangan dari jendela pesawat di ketinggian.
 *  - Bumi melengkung di bawah, berputar pelan (benua & awan), cahaya fajar di sisi kiri.
 *  - Monumen dunia "tumbuh" dari permukaan bumi saat memasuki pandangan, lalu mengecil di sisi lain.
 *  - Sayap pesawat di kiri bawah, bingkai jendela kabin, dan penumpang berjas di kanan.
 * Digambar dengan SVG datar bernuansa dewasa (tanpa garis tepi tebal), animasinya lewat requestAnimationFrame.
 */

const L = "#FFF1D0"; // sisi terang monumen
const S = "#D5C49C"; // sisi bayangan
const A = "#F4C77B"; // aksen emas
const DK = "#2B3A8F"; // detail gelap

/* ---------- pembangkit acak tetap (supaya SSR & klien sama) ---------- */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blobPath(rand: () => number, r: number, n = 9, rough = 0.38) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 - rough / 2 + rand() * rough);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const mid = (a: [number, number], b: [number, number]) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
  let d = `M${mid(pts[n - 1], pts[0])}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mid(pts[i], pts[(i + 1) % n])}`;
  return d + "Z";
}

type Patch = { a: number; depth: number; sx: number; sy: number; d: string; fill: string; op: number };

const LAND_FILL = ["#2F9C86", "#4DB08F", "#7FC8A0", "#2A8576", "#D9C58C"];
const LAND: Patch[] = (() => {
  const r = rng(11);
  return Array.from({ length: 110 }, () => ({
    a: r() * 360,
    depth: 6 + r() * 430,
    sx: 0.9 + r() * 1.0,
    sy: 0.5 + r() * 0.45,
    d: blobPath(r, 14 + r() * 36),
    fill: LAND_FILL[Math.floor(r() * LAND_FILL.length)],
    op: 0.85,
  }));
})();
const CLOUDS: Patch[] = (() => {
  const r = rng(29);
  return Array.from({ length: 80 }, () => ({
    a: r() * 360,
    depth: 4 + r() * 430,
    sx: 1.8 + r() * 2.2,
    sy: 0.2 + r() * 0.2,
    d: blobPath(r, 20 + r() * 40, 8, 0.55),
    fill: "#FFFFFF",
    op: 0.22 + r() * 0.32,
  }));
})();
const STARS = (() => {
  const r = rng(5);
  return Array.from({ length: 70 }, () => ({ x: r(), y: r() * 0.62, s: 0.6 + r() * 1.4, d: r() * 4, t: 2 + r() * 3 }));
})();

/* ---------- monumen (digambar di kotak 100×100, kaki di y≈100) ---------- */
type Key = "eiffel" | "liberty" | "bigben" | "pyramids" | "taj" | "colosseum" | "opera" | "pisa";
const ART: Record<Key, React.ReactNode> = {
  eiffel: (
    <>
      <path d="M50 0 L52.5 26 L58 46 L68 98 L58 98 L54 80 H46 L42 98 H32 L42 46 L47.5 26Z" fill={L} />
      <path d="M50 0 L52.5 26 L58 46 L68 98 L58 98 L54 80 H50Z" fill={S} opacity=".5" />
      <rect x="37" y="44" width="26" height="4.5" fill={L} />
      <rect x="44" y="25" width="12" height="3.5" fill={L} />
      <path d="M44 48 L56 62 M56 48 L44 62 M41 62 L59 80 M59 62 L41 80" stroke={DK} strokeWidth="1.4" opacity=".5" />
      <path d="M46 80 Q50 69 54 80Z" fill={DK} opacity=".4" />
      <rect x="30" y="97" width="40" height="3" fill={S} />
    </>
  ),
  liberty: (
    <>
      <rect x="26" y="92" width="48" height="8" fill={S} />
      <path d="M36 92 L40 68 H60 L64 92Z" fill={L} />
      <path d="M41 68 L44 44 Q50 38 56 44 L59 68Z" fill={L} />
      <path d="M50 40 L59 68 H55 L50 44Z" fill={S} opacity=".5" />
      <circle cx="50" cy="35" r="5.5" fill={L} />
      <path d="M44.5 32 L39 26 M47 29.5 L44.5 22 M50 28.5 V20 M53 29.5 L55.5 22 M55.5 32 L61 26" stroke={L} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M55 44 L63 26 L64 12" stroke={L} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M60.5 11 H67.5 L66.5 7 L64 -3 L61.5 7Z" fill={A} />
      <rect x="40" y="48" width="6" height="10" rx="1" fill={S} />
    </>
  ),
  bigben: (
    <>
      <rect x="8" y="80" width="84" height="20" fill={S} />
      <rect x="8" y="76" width="84" height="4" fill={L} />
      {[16, 28, 40, 60, 72, 82].map((x) => (
        <rect key={x} x={x} y="84" width="5" height="9" fill={DK} opacity=".4" />
      ))}
      <rect x="38" y="26" width="24" height="74" fill={L} />
      <rect x="50" y="26" width="12" height="74" fill={S} opacity=".45" />
      <path d="M36 26 H64 L50 0Z" fill={A} />
      <circle cx="50" cy="40" r="9" fill="#fff" />
      <circle cx="50" cy="40" r="9" fill="none" stroke={DK} strokeWidth="1.2" opacity=".5" />
      <path d="M50 40 V33.5 M50 40 L55 43" stroke={DK} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="44" y="58" width="4" height="12" fill={DK} opacity=".4" />
      <rect x="52" y="58" width="4" height="12" fill={DK} opacity=".4" />
    </>
  ),
  pyramids: (
    <>
      <path d="M0 100 L38 34 L76 100Z" fill={L} />
      <path d="M38 34 L76 100 H38Z" fill={S} />
      <path d="M54 100 L80 58 L100 100Z" fill={L} />
      <path d="M80 58 L100 100 H80Z" fill={S} />
    </>
  ),
  taj: (
    <>
      <rect x="24" y="66" width="52" height="34" fill={L} />
      <rect x="50" y="66" width="26" height="34" fill={S} opacity=".4" />
      <path d="M32 66 Q50 24 68 66Z" fill={L} />
      <path d="M50 34 Q64 44 68 66 H50Z" fill={S} opacity=".4" />
      <path d="M50 34 V22" stroke={A} strokeWidth="2.2" />
      <circle cx="50" cy="20" r="2.6" fill={A} />
      <rect x="8" y="52" width="7" height="48" fill={L} />
      <rect x="85" y="52" width="7" height="48" fill={S} />
      <path d="M7 52 Q11.5 41 16 52Z" fill={A} />
      <path d="M84 52 Q88.5 41 93 52Z" fill={A} />
      <path d="M43 100 V84 Q50 74 57 84 V100Z" fill={DK} opacity=".45" />
    </>
  ),
  colosseum: (
    <>
      <path d="M2 100 V60 Q50 46 98 60 V100Z" fill={L} />
      <path d="M50 52 Q82 54 98 60 V100 H50Z" fill={S} opacity=".4" />
      {[64, 77, 90].map((y) =>
        [10, 20, 30, 40, 50, 60, 70, 80].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="7" height="9" rx="3.5" fill={DK} opacity=".45" />),
      )}
    </>
  ),
  opera: (
    <>
      <rect x="0" y="94" width="100" height="6" fill={S} />
      <path d="M4 94 Q6 52 38 46 Q27 72 36 94Z" fill={L} />
      <path d="M30 94 Q32 34 72 26 Q55 62 63 94Z" fill={L} />
      <path d="M58 94 Q62 56 97 52 Q86 76 92 94Z" fill={L} />
      <path d="M38 46 Q27 72 36 94 M72 26 Q55 62 63 94 M97 52 Q86 76 92 94" stroke={S} strokeWidth="2.2" fill="none" />
    </>
  ),
  pisa: (
    <g transform="rotate(7 50 100)">
      <rect x="28" y="95" width="44" height="5" fill={S} />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <g key={k}>
          <rect x="36" y={84 - k * 12.5} width="28" height="12" fill={k % 2 ? S : L} />
          {[40, 47, 54].map((x) => (
            <rect key={x} x={x} y={87 - k * 12.5} width="4" height="6" rx="2" fill={DK} opacity=".4" />
          ))}
        </g>
      ))}
      <rect x="40" y="12" width="20" height="8" fill={A} />
      <path d="M44 12 Q50 2 56 12Z" fill={L} />
    </g>
  ),
};

/**
 * 20 slot melingkar (jarak 18°), monumen berulang, jadi di layar selalu ada 3–4 monumen yang rapat.
 * Slot 1–4 terlihat saat halaman dibuka: Eiffel di kiri-tengah, tidak tertutup apa pun.
 */
const ORDER: Key[] = ["pisa", "bigben", "eiffel", "taj", "liberty", "opera", "colosseum", "pyramids", "eiffel", "pisa", "liberty", "taj", "bigben", "colosseum", "opera", "pyramids", "eiffel", "liberty", "taj", "bigben"];
const SLOT = 360 / ORDER.length;

const easeOutBack = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const norm180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 + r} V${y1 - r} Q${x1} ${y1} ${x1 - r} ${y1} H${x0 + r} Q${x0} ${y1} ${x0} ${y1 - r} V${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0}Z`;

export function FlightScene() {
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

  // bingkai jendela (kabin gelap, lis krem, kaca di dalamnya)
  const lx = narrow ? 18 : Math.max(30, w * 0.035);
  const trim = narrow ? 10 : 16;
  const top = narrow ? 74 : 92;
  const bottom = h - (narrow ? 40 : Math.max(46, h * 0.055));
  const winH = bottom - top;
  const hr = narrow ? 56 : Math.min(130, w * 0.09);
  const hole = rr(lx, top, w - lx, bottom, hr);
  const outer = rr(lx - trim, top - trim, w - lx + trim, bottom + trim, hr + trim);

  // bumi
  const R = Math.max(w * 0.62, 340);
  const cx = w / 2;
  const horizon = bottom - winH * (narrow ? 0.27 : 0.3);
  const cy = horizon + R;
  const phiMax = (Math.asin(Math.min(1, (w / 2 - lx) / R)) * 180) / Math.PI;
  const mSize = Math.min(160, Math.max(80, w * 0.11));
  const speed = narrow ? 3 : 2.6; // derajat per detik (pelan), kepadatan monumen yang membuatnya terasa ramai

  const landRef = useRef<SVGGElement>(null);
  const cloudRef = useRef<SVGGElement>(null);
  const mons = useRef<(SVGGElement | null)[]>([]);

  const place = (angle: number, tSec: number) => {
    landRef.current?.setAttribute("transform", `rotate(${-angle} ${cx} ${cy})`);
    cloudRef.current?.setAttribute("transform", `rotate(${-angle * 1.22 + 40} ${cx} ${cy})`);
    for (let i = 0; i < ORDER.length; i++) {
      const g = mons.current[i];
      if (!g) continue;
      const phi = norm180(i * SLOT - 54 - angle);
      const edge = Math.min(1, Math.max(0, (phiMax - Math.abs(phi)) / (phiMax * 0.28)));
      // muncul cepat saat halaman dibuka: tiap monumen "tumbuh" bergantian dalam ±1 detik
      const intro = reduce ? 1 : Math.min(1, Math.max(0, (tSec - 0.15 - 0.09 * ((i * 5) % 9)) / 0.55));
      const e = Math.min(edge, 1) * 1;
      if (e <= 0 || intro <= 0) {
        g.setAttribute("visibility", "hidden");
        continue;
      }
      const rad = (phi * Math.PI) / 180;
      const x = cx + R * Math.sin(rad);
      const y = cy - R * Math.cos(rad) + 3;
      const k = (mSize / 100) * easeOutBack(e) * easeOutBack(intro);
      g.setAttribute("visibility", "visible");
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${phi.toFixed(2)}) scale(${Math.max(0, k).toFixed(3)}) translate(-50 -100)`);
    }
  };

  useAnimationFrame((t) => {
    if (!inView) return;
    place(reduce ? 0 : (t / 1000) * speed, t / 1000);
  });
  useEffect(() => {
    place(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  const patch = (p: Patch, k: string) => {
    const rad = R - p.depth;
    const a = (p.a * Math.PI) / 180;
    const x = cx + rad * Math.sin(a);
    const y = cy - rad * Math.cos(a);
    return <path key={k} d={p.d} fill={p.fill} opacity={p.op} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${p.a.toFixed(1)}) scale(${p.sx.toFixed(2)} ${p.sy.toFixed(2)})`} />;
  };
  const land = useMemo(() => LAND.map((p, i) => patch(p, `l${i}`)), [R, cx, cy]); // eslint-disable-line react-hooks/exhaustive-deps
  const clouds = useMemo(() => CLOUDS.map((p, i) => patch(p, `c${i}`)), [R, cx, cy]); // eslint-disable-line react-hooks/exhaustive-deps

  // sayap: pangkal di kiri, ujung (winglet + lampu merah) naik ke kanan
  const wy = (f: number) => top + f * winH;
  const tipX = w * 0.24;
  const rootL: [number, number] = [lx - 30, wy(0.86)];
  const tipL: [number, number] = [tipX, wy(0.72)];
  const rootT: [number, number] = [lx - 30, wy(1.06)];
  const tipT: [number, number] = [w * 0.19, wy(0.8)];
  const wing = `M${rootL} L${tipL} L${tipX + 5} ${wy(0.6)} L${tipX + 16} ${wy(0.72)} L${tipX + 11} ${wy(0.75)} L${tipT} L${rootT} Z`;
  const lerp = (a: [number, number], b: [number, number], f: number) => `${(a[0] + (b[0] - a[0]) * f).toFixed(0)} ${(a[1] + (b[1] - a[1]) * f).toFixed(0)}`;
  const rimStop = (v: number) => `${Math.min(100, Math.max(0, (v / (R + 120)) * 100)).toFixed(2)}%`;

  return (
    <motion.div
      ref={root}
      aria-hidden
      className="absolute inset-0 z-[6] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.8 }}
      style={{ background: "#14183C" }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fl-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1C2250" />
            <stop offset="100%" stopColor="#10143A" />
          </linearGradient>
          <linearGradient id="fl-trim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4F1EA" />
            <stop offset="100%" stopColor="#C9C4BA" />
          </linearGradient>
          <linearGradient id="fl-sky" gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={bottom}>
            <stop offset="0%" stopColor="#070A26" />
            <stop offset="45%" stopColor="#0E1450" />
            <stop offset="100%" stopColor="#20308F" />
          </linearGradient>
          <radialGradient id="fl-atm" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R + 120}>
            <stop offset={rimStop(R - 4)} stopColor="rgba(170,225,255,0)" />
            <stop offset={rimStop(R + 2)} stopColor="rgba(190,235,255,0.95)" />
            <stop offset={rimStop(R + 30)} stopColor="rgba(80,160,255,0.45)" />
            <stop offset="100%" stopColor="rgba(40,80,220,0)" />
          </radialGradient>
          <linearGradient id="fl-sea" gradientUnits="userSpaceOnUse" x1="0" y1={horizon} x2="0" y2={horizon + 460}>
            <stop offset="0%" stopColor="#4C86EE" />
            <stop offset="45%" stopColor="#2C55C8" />
            <stop offset="100%" stopColor="#172782" />
          </linearGradient>
          <radialGradient id="fl-dawn" gradientUnits="userSpaceOnUse" cx={w * 0.14} cy={horizon + 6} r={w * 0.5}>
            <stop offset="0%" stopColor="rgba(255,190,140,0.75)" />
            <stop offset="35%" stopColor="rgba(255,150,120,0.28)" />
            <stop offset="100%" stopColor="rgba(255,150,120,0)" />
          </radialGradient>
          <linearGradient id="fl-wing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6EBF8" />
            <stop offset="60%" stopColor="#AEB9DC" />
            <stop offset="100%" stopColor="#6C7AB0" />
          </linearGradient>
          <filter id="fl-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="fl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="fl-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <clipPath id="fl-earth">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
          <clipPath id="fl-glass">
            <path d={hole} />
          </clipPath>
        </defs>

        {/* dinding kabin + lis jendela krem */}
        <rect width={w} height={h} fill="url(#fl-wall)" />
        <path d={outer} fill="#000" opacity=".5" filter="url(#fl-shadow)" transform="translate(0 10)" />
        <path d={outer} fill="url(#fl-trim)" />
        <path d={rr(lx - 3, top - 3, w - lx + 3, bottom + 3, hr + 3)} fill="none" stroke="rgba(60,56,48,0.35)" strokeWidth="2" />

        {/* isi kaca */}
        <g clipPath="url(#fl-glass)">
          <rect x="0" y={top} width={w} height={winH} fill="url(#fl-sky)" />
          {STARS.map((st, i) => (
            <circle key={i} cx={st.x * w} cy={top + st.y * winH} r={st.s} fill="#fff" style={{ animation: `en-twinkle ${st.t}s ease-in-out ${st.d}s infinite` }} className="en-twinkle" />
          ))}
          <rect x="0" y={top} width={w} height={winH} fill="url(#fl-dawn)" />
          <circle cx={cx} cy={cy} r={R + 120} fill="url(#fl-atm)" />
          <circle cx={cx} cy={cy} r={R} fill="url(#fl-sea)" />
          <g clipPath="url(#fl-earth)">
            <g ref={landRef}>{land}</g>
            <g ref={cloudRef}>{clouds}</g>
            <circle cx={cx} cy={cy} r={R - 1} fill="none" stroke="rgba(200,235,255,0.85)" strokeWidth="2.5" filter="url(#fl-soft)" />
          </g>

          {/* sayap pesawat */}
          <path d={wing} fill="url(#fl-wing)" />
          <path d={`M${rootL} L${tipL}`} stroke="rgba(255,255,255,0.85)" strokeWidth="3" fill="none" />
          <path d={`M${rootT} L${tipT}`} stroke="rgba(30,40,110,0.35)" strokeWidth="3" fill="none" />
          {[0.18, 0.34, 0.5, 0.66, 0.82].map((f) => (
            <path key={f} d={`M${lerp(rootL, tipL, f)} L${lerp(rootT, tipT, f)}`} stroke="rgba(70,84,150,0.3)" strokeWidth="1.6" />
          ))}
          <circle cx={tipX + 5} cy={wy(0.61)} r="16" fill="#FF4A4A" opacity=".6" filter="url(#fl-soft)" className="en-blink" style={{ animation: "en-blink 2.4s linear infinite" }} />
          <circle cx={tipX + 5} cy={wy(0.61)} r="3.4" fill="#FF8A8A" className="en-blink" style={{ animation: "en-blink 2.4s linear infinite" }} />

          {/* monumen (di depan sayap supaya selalu jelas) */}
          {ORDER.map((key, i) => (
            <g
              key={i}
              ref={(el) => {
                mons.current[i] = el;
              }}
              visibility="hidden"
              filter="url(#fl-glow)"
            >
              {ART[key]}
            </g>
          ))}

          {/* pantulan kaca & bayangan tepi */}
          <path d={`M${w * 0.14} ${top} L${w * 0.26} ${top} L${w * 0.08} ${bottom} L${w * -0.04} ${bottom} Z`} fill="rgba(255,255,255,0.05)" />
          <path d={hole} fill="none" stroke="rgba(6,8,34,0.7)" strokeWidth="18" />
        </g>
        <path d={hole} fill="none" stroke="rgba(10,14,50,0.6)" strokeWidth="2" />
      </svg>

      <Passenger />
    </motion.div>
  );
}

/* ---------- penumpang berjas: tampak samping, menoleh ke jendela (kiri) ---------- */
function Passenger() {
  const SKIN = "#E3AE88";
  const SKIN_D = "#CC9672";
  return (
    <div
      className="pointer-events-none absolute right-[-7%] bottom-0 h-[36%] sm:right-[2%] sm:h-[60%]"
      style={{ aspectRatio: "400 / 520" }}
    >
      <svg viewBox="0 0 400 520" className="h-full w-full">
        {/* kursi */}
        <rect x="52" y="168" width="304" height="400" rx="64" fill="#2D3883" />
        <rect x="96" y="26" width="218" height="232" rx="82" fill="#3C4AA0" />
        <path d="M118 52 Q206 18 294 52" stroke="rgba(190,205,255,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M205 40 V250" stroke="rgba(10,16,70,0.25)" strokeWidth="3" />

        {/* jas */}
        <path d="M30 520 L46 410 Q60 322 150 304 L252 304 Q342 322 356 410 L372 520Z" fill="#16204F" />
        <path d="M46 410 Q60 322 150 304" stroke="rgba(150,205,255,0.7)" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* kemeja + dasi + lapel */}
        <path d="M158 304 L196 408 L238 304Z" fill="#F7F5F0" />
        <path d="M152 304 L190 412 L148 440 L118 340Z" fill="#26337F" />
        <path d="M244 304 L204 412 L246 440 L276 340Z" fill="#1E2A6E" />
        <path d="M186 312 H202 L205 326 H183Z" fill="#F4C77B" />
        <path d="M184 326 H204 L212 396 L194 418 L176 396Z" fill="#E9B65B" />
        <path d="M194 326 L212 396 L194 418Z" fill="#C99A3F" opacity=".55" />
        <rect x="262" y="330" width="22" height="4" rx="2" fill="#F7F5F0" opacity=".9" />

        {/* leher */}
        <path d="M172 232 H226 V310 Q199 322 172 310Z" fill={SKIN_D} />
        <path d="M160 300 Q199 326 238 300 L240 286 Q199 308 158 286Z" fill="#F7F5F0" />

        {/* kepala (profil menghadap kiri) */}
        <path
          d="M252 164 C254 110 222 80 184 82 C152 84 135 108 135 138 L129 152 L133 160 L118 186 C116 191 120 194 130 194 L128 206 L133 210 L129 216 L133 222 L130 234 C132 247 144 255 160 257 L202 257 C234 253 252 222 252 164Z"
          fill={SKIN}
        />
        <path d="M118 186 C116 191 120 194 130 194 L128 206" stroke={SKIN_D} strokeWidth="2" fill="none" />
        {/* rambut */}
        <path d="M136 138 C134 102 158 82 186 82 C226 80 258 106 254 164 C254 190 248 208 238 224 L228 198 C224 176 214 158 188 148 C168 140 150 144 136 138Z" fill="#241E26" />
        <path d="M150 112 Q172 92 200 94" stroke="rgba(190,215,255,0.5)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* telinga */}
        <ellipse cx="207" cy="198" rx="10" ry="16" fill={SKIN_D} />
        {/* kacamata + mata + alis */}
        <circle cx="153" cy="158" r="13" fill="rgba(190,225,255,0.22)" stroke="#1B1830" strokeWidth="3" />
        <path d="M166 156 L204 152" stroke="#1B1830" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="151" cy="158" rx="3.2" ry="4" fill="#1B1830" />
        <path d="M140 142 Q152 136 164 141" stroke="#241E26" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M131 210 Q141 214 150 211" stroke="#A96F55" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
