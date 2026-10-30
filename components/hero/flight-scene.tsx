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
const MONUMENTS: { name: string; art: React.ReactNode }[] = [
  {
    name: "Statue of Liberty",
    art: (
      <>
        <rect x="30" y="92" width="40" height="8" fill={S} />
        <path d="M38 92 L41 70 H59 L62 92Z" fill={L} />
        <path d="M42 70 L45 46 Q50 40 55 46 L58 70Z" fill={L} />
        <path d="M50 42 L58 70 H55 L50 46Z" fill={S} opacity=".5" />
        <circle cx="50" cy="38" r="5" fill={L} />
        <path d="M45.5 35 L41 30 M47.5 33 L45.5 27 M50 32 V25 M52.5 33 L54.5 27 M54.5 35 L59 30" stroke={L} strokeWidth="2" strokeLinecap="round" />
        <path d="M55 46 L62 30 L63 18" stroke={L} strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M60 17 H66 L65 13 L63 4 L61 13Z" fill={A} />
        <rect x="41" y="50" width="5" height="9" rx="1" fill={S} />
      </>
    ),
  },
  {
    name: "Eiffel Tower",
    art: (
      <>
        <path d="M50 2 L52.5 28 L57 46 L66 98 L57 98 L53.5 80 H46.5 L43 98 H34 L43 46 L47.5 28Z" fill={L} />
        <path d="M50 2 L52.5 28 L57 46 L66 98 L57 98 L53.5 80 H50Z" fill={S} opacity=".45" />
        <rect x="38" y="44" width="24" height="4" fill={L} />
        <rect x="45" y="26" width="10" height="3" fill={L} />
        <path d="M46.5 80 Q50 71 53.5 80Z" fill={DK} opacity=".35" />
      </>
    ),
  },
  {
    name: "Big Ben",
    art: (
      <>
        <rect x="12" y="80" width="76" height="20" fill={S} />
        <rect x="12" y="76" width="76" height="4" fill={L} />
        {[20, 32, 62, 74].map((x) => (
          <rect key={x} x={x} y="84" width="5" height="9" fill={DK} opacity=".4" />
        ))}
        <rect x="40" y="30" width="20" height="70" fill={L} />
        <rect x="50" y="30" width="10" height="70" fill={S} opacity=".45" />
        <path d="M38 30 H62 L50 5Z" fill={A} />
        <circle cx="50" cy="42" r="7.5" fill="#fff" />
        <path d="M50 42 V37 M50 42 L54 44" stroke={DK} strokeWidth="1.6" strokeLinecap="round" />
        <rect x="45" y="58" width="3" height="10" fill={DK} opacity=".4" />
        <rect x="52" y="58" width="3" height="10" fill={DK} opacity=".4" />
      </>
    ),
  },
  {
    name: "Colosseum",
    art: (
      <>
        <path d="M4 100 V62 Q50 50 96 62 V100Z" fill={L} />
        <path d="M50 54 Q80 56 96 62 V100 H50Z" fill={S} opacity=".4" />
        {[66, 78, 90].map((y) =>
          [12, 22, 32, 42, 52, 62, 72, 82].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" rx="3" fill={DK} opacity=".45" />),
        )}
      </>
    ),
  },
  {
    name: "Pyramids",
    art: (
      <>
        <path d="M0 100 L38 36 L76 100Z" fill={L} />
        <path d="M38 36 L76 100 H38Z" fill={S} />
        <path d="M56 100 L80 62 L100 100Z" fill={L} />
        <path d="M80 62 L100 100 H80Z" fill={S} />
      </>
    ),
  },
  {
    name: "Taj Mahal",
    art: (
      <>
        <rect x="26" y="66" width="48" height="34" fill={L} />
        <rect x="50" y="66" width="24" height="34" fill={S} opacity=".4" />
        <path d="M33 66 Q50 26 67 66Z" fill={L} />
        <path d="M50 36 Q62 44 67 66 H50Z" fill={S} opacity=".4" />
        <path d="M50 36 V25" stroke={A} strokeWidth="2" />
        <circle cx="50" cy="23" r="2.4" fill={A} />
        <rect x="11" y="54" width="6" height="46" fill={L} />
        <rect x="83" y="54" width="6" height="46" fill={S} />
        <path d="M10 54 Q14 44 18 54Z" fill={A} />
        <path d="M82 54 Q86 44 90 54Z" fill={A} />
        <path d="M44 100 V84 Q50 75 56 84 V100Z" fill={DK} opacity=".45" />
      </>
    ),
  },
  {
    name: "Borobudur",
    art: (
      <>
        <rect x="4" y="88" width="92" height="12" fill={S} />
        <rect x="12" y="78" width="76" height="10" fill={L} />
        <rect x="20" y="68" width="60" height="10" fill={S} />
        <rect x="28" y="58" width="44" height="10" fill={L} />
        {[20, 32, 44, 56, 68, 80].map((x) => (
          <path key={x} d={`M${x - 3.5} 78 Q${x} 70 ${x + 3.5} 78Z`} fill={A} />
        ))}
        <path d="M36 58 Q50 36 64 58Z" fill={L} />
        <path d="M50 42 Q60 46 64 58 H50Z" fill={S} opacity=".4" />
        <rect x="49" y="28" width="2" height="12" fill={A} />
        <circle cx="50" cy="26" r="2.2" fill={A} />
      </>
    ),
  },
  {
    name: "Sydney Opera House",
    art: (
      <>
        <rect x="2" y="94" width="96" height="6" fill={S} />
        <path d="M6 94 Q8 56 38 50 Q28 74 36 94Z" fill={L} />
        <path d="M30 94 Q32 40 70 32 Q54 64 62 94Z" fill={L} />
        <path d="M58 94 Q62 60 94 56 Q84 76 90 94Z" fill={L} />
        <path d="M38 50 Q28 74 36 94 M70 32 Q54 64 62 94 M94 56 Q84 76 90 94" stroke={S} strokeWidth="2" fill="none" />
      </>
    ),
  },
];

const easeOutBack = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const norm180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

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
  const R = Math.max(w * 0.62, 340);
  const cx = w / 2;
  const horizon = h * (narrow ? 0.64 : 0.62);
  const cy = horizon + R;
  const phiMax = (Math.asin(Math.min(1, (w * 0.58) / R)) * 180) / Math.PI;
  const mSize = Math.min(104, Math.max(72, w * 0.07));
  const speed = narrow ? 3 : 2.4; // derajat per detik

  const landRef = useRef<SVGGElement>(null);
  const cloudRef = useRef<SVGGElement>(null);
  const mons = useRef<(SVGGElement | null)[]>([]);

  const place = (angle: number) => {
    landRef.current?.setAttribute("transform", `rotate(${angle} ${cx} ${cy})`);
    cloudRef.current?.setAttribute("transform", `rotate(${angle * 1.22 + 40} ${cx} ${cy})`);
    const n = MONUMENTS.length;
    for (let i = 0; i < n; i++) {
      const g = mons.current[i];
      if (!g) continue;
      const phi = norm180((i * 360) / n + angle - 135);
      const e = Math.min(1, Math.max(0, (phiMax - Math.abs(phi)) / (phiMax * 0.3)));
      if (e <= 0) {
        g.setAttribute("visibility", "hidden");
        continue;
      }
      const rad = (phi * Math.PI) / 180;
      const x = cx + R * Math.sin(rad);
      const y = cy - R * Math.cos(rad) + 3;
      const k = (mSize / 100) * easeOutBack(e);
      g.setAttribute("visibility", "visible");
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${phi.toFixed(2)}) scale(${k.toFixed(3)}) translate(-50 -100)`);
    }
  };

  useAnimationFrame((t) => {
    if (!inView) return;
    place(reduce ? 0 : (t / 1000) * speed);
  });
  // posisi awal (juga saat gerak dikurangi)
  useEffect(() => {
    place(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  const rim = R - 0; // jarak pusat → tepi
  const patch = (p: Patch, k: string) => {
    const rad = rim - p.depth;
    const a = (p.a * Math.PI) / 180;
    const x = cx + rad * Math.sin(a);
    const y = cy - rad * Math.cos(a);
    return <path key={k} d={p.d} fill={p.fill} opacity={p.op} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${p.a.toFixed(1)}) scale(${p.sx.toFixed(2)} ${p.sy.toFixed(2)})`} />;
  };
  const land = useMemo(() => LAND.map((p, i) => patch(p, `l${i}`)), [R, cx, cy]); // eslint-disable-line react-hooks/exhaustive-deps
  const clouds = useMemo(() => CLOUDS.map((p, i) => patch(p, `c${i}`)), [R, cx, cy]); // eslint-disable-line react-hooks/exhaustive-deps

  // bingkai jendela
  const lx = narrow ? 10 : Math.min(40, w * 0.026);
  const top = narrow ? 66 : 84;
  const hr = Math.min(120, w * 0.085);
  const hole = `M${lx} ${top + hr} Q${lx} ${top} ${lx + hr} ${top} H${w - lx - hr} Q${w - lx} ${top} ${w - lx} ${top + hr} V${h + 200} H${lx} Z`;
  const frame = `M0 0 H${w} V${h + 200} H0 Z ${hole}`;

  // sayap
  const wing = `M${-w * 0.05} ${h * 0.86} L${w * 0.335} ${h * 0.745} L${w * 0.342} ${h * 0.69} L${w * 0.352} ${h * 0.742} L${w * 0.345} ${h * 0.752} L${w * 0.28} ${h * 0.79} L${-w * 0.05} ${h * 1.02} Z`;
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
      style={{ background: "linear-gradient(#070A26 0%, #0E1450 38%, #1A2680 62%, #20308F 100%)" }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
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
            <stop offset="0%" stopColor="#C7D1EC" />
            <stop offset="100%" stopColor="#6F7DB2" />
          </linearGradient>
          <linearGradient id="fl-wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1D2350" />
            <stop offset="100%" stopColor="#12163A" />
          </linearGradient>
          <linearGradient id="fl-vig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(4,6,28,0.7)" />
            <stop offset="22%" stopColor="rgba(4,6,28,0)" />
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
          <clipPath id="fl-earth">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>

        {/* bintang */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x * w} cy={s.y * h} r={s.s} fill="#fff" className="en-twinkle" style={{ animation: `en-twinkle ${s.t}s ease-in-out ${s.d}s infinite` }} />
        ))}

        {/* fajar di cakrawala kiri */}
        <rect x="0" y="0" width={w} height={h} fill="url(#fl-dawn)" />

        {/* atmosfer */}
        <circle cx={cx} cy={cy} r={R + 120} fill="url(#fl-atm)" />

        {/* bumi */}
        <circle cx={cx} cy={cy} r={R} fill="url(#fl-sea)" />
        <g clipPath="url(#fl-earth)">
          <g ref={landRef}>{land}</g>
          <g ref={cloudRef}>{clouds}</g>
          {/* bayangan lembut menjauhi cakrawala & kilau tepi */}
          <circle cx={cx} cy={cy} r={R - 1} fill="none" stroke="rgba(200,235,255,0.85)" strokeWidth="2.5" filter="url(#fl-soft)" />
          <rect x="0" y={horizon} width={w} height="120" fill="rgba(160,215,255,0.12)" />
        </g>

        {/* monumen */}
        {MONUMENTS.map((m, i) => (
          <g
            key={m.name}
            ref={(el) => {
              mons.current[i] = el;
            }}
            visibility="hidden"
            filter="url(#fl-glow)"
          >
            {m.art}
          </g>
        ))}

        {/* sayap pesawat */}
        <path d={wing} fill="url(#fl-wing)" />
        <path d={`M${-w * 0.05} ${h * 0.86} L${w * 0.335} ${h * 0.745}`} stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" />
        <path d={`M${w * 0.06} ${h * 0.905} L${w * 0.3} ${h * 0.79}`} stroke="rgba(30,40,110,0.25)" strokeWidth="2" fill="none" />
        <circle cx={w * 0.343} cy={h * 0.71} r="14" fill="#FF4A4A" opacity=".55" filter="url(#fl-soft)" className="en-blink" style={{ animation: "en-blink 2.4s linear infinite" }} />
        <circle cx={w * 0.343} cy={h * 0.71} r="3.2" fill="#FF7A7A" className="en-blink" style={{ animation: "en-blink 2.4s linear infinite" }} />

        {/* pantulan kaca */}
        <path d={`M${w * 0.16} ${top} L${w * 0.3} ${top} L${w * 0.12} ${h} L${w * 0.0} ${h} Z`} fill="rgba(255,255,255,0.035)" />
        <path d={hole} fill="url(#fl-vig)" />

        {/* dinding kabin + bingkai jendela */}
        <path d={frame} fill="url(#fl-wall)" fillRule="evenodd" />
        <path d={hole} fill="none" stroke="rgba(140,160,240,0.38)" strokeWidth="3" />
        <path d={hole} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="9" transform="translate(0 0)" opacity=".35" style={{ mixBlendMode: "multiply" }} />
        <path
          d={`M${lx - 10} ${top + hr} Q${lx - 10} ${top - 10} ${lx + hr} ${top - 10} H${w - lx - hr} Q${w - lx + 10} ${top - 10} ${w - lx + 10} ${top + hr} V${h + 200}`}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="2"
        />
      </svg>

      {/* memudar ke warna section berikutnya (gading) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[17%]"
        style={{ background: "linear-gradient(to bottom, rgba(251,246,238,0) 0%, rgba(251,246,238,0.6) 55%, rgb(251,246,238) 100%)" }}
      />

      <Passenger />
    </motion.div>
  );
}

/* ---------- penumpang berjas, dilihat dari belakang, menoleh ke jendela ---------- */
function Passenger() {
  return (
    <div
      className="pointer-events-none absolute right-[-3%] bottom-0 h-[36%] sm:right-[1.5%] sm:h-[62%]"
      style={{ aspectRatio: "400 / 520", WebkitMaskImage: "linear-gradient(#000 70%, transparent 98%)", maskImage: "linear-gradient(#000 70%, transparent 98%)" }}
    >
      <svg viewBox="0 0 400 520" className="h-full w-full">
        {/* sandaran kursi */}
        <rect x="60" y="150" width="300" height="400" rx="60" fill="#262C62" />
        <rect x="108" y="36" width="204" height="200" rx="72" fill="#2F3874" />
        <path d="M120 60 Q210 28 300 60" stroke="rgba(150,170,255,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* jas */}
        <path d="M24 520 L36 392 Q48 302 132 286 L268 286 Q352 302 364 392 L376 520 Z" fill="#1E2A78" />
        <path d="M200 300 L200 520" stroke="rgba(0,0,0,0.28)" strokeWidth="3" />
        <path d="M36 392 Q48 302 132 286" stroke="rgba(140,200,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M132 286 Q160 310 200 316 Q240 310 268 286" fill="#18226A" />
        {/* leher & kerah */}
        <rect x="178" y="236" width="44" height="58" rx="16" fill="#C48A66" />
        <path d="M160 288 Q200 312 240 288 L240 276 Q200 296 160 276 Z" fill="#F4F1EA" />
        {/* kepala */}
        <ellipse cx="200" cy="184" rx="58" ry="68" fill="#C48A66" />
        <path d="M144 188 Q140 116 202 114 Q264 116 258 188 Q258 214 244 234 Q200 214 156 234 Q144 214 144 188Z" fill="#1B1820" />
        <path d="M150 170 Q158 128 202 122" stroke="rgba(150,200,255,0.45)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M146 196 Q130 214 146 238 Q160 232 162 214Z" fill="#C48A66" />
        <ellipse cx="240" cy="198" rx="8" ry="13" fill="#B67A58" />
      </svg>
    </div>
  );
}
