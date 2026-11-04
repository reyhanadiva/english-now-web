"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": gedung perkantoran dipotong (dollhouse) dengan 6 ruangan bisnis, dihidupkan lapis demi lapis.
 *
 * Semua posisi memakai koordinat gambar asli (1672 x 941), jadi tetap menempel di benda yang sama
 * di ukuran layar berapa pun. Yang bergerak hanya transform dan opacity (ringan), kecuali beberapa
 * garis SVG kecil yang "digambar".
 *
 * Cerita gerak (siklus 36 detik, 6 detik per ruangan, tiap ruangan disorot bergantian):
 *  1 Ruang rapat  : gelembung "Shall we begin?", lampu gantung berdenyut
 *  2 Video call   : garis koneksi Indonesia ke kota lain tergambar di peta, panel peserta menyala bergantian
 *  3 Kelas English: frasa bisnis ditulis di papan tulis baris demi baris
 *  4 Negosiasi    : dokumen bergeser, tanda tangan tergores, stempel centang muncul
 *  5 Kantor tim   : diagram alur tergambar di papan, rekan kerja duduk di kursi masing-masing
 *  6 Analitik     : dashboard hidup (grafik, batang, jam dunia live)
 *  Lift kaca naik-turun, awan/pesawat/drone/burung di langit, mobil dan trem di jalan.
 * Tanpa parallax kursor. Semua animasi berhenti saat hero keluar layar atau gerak dikurangi.
 */

const IMG_W = 1672;
const IMG_H = 941;
const RATIO = IMG_W / IMG_H;
const SRC = { s: "/images/hero-corp-1280.webp", l: "/images/hero-corp-1672.webp" };
const EDGE = { l: "/images/hero-corp-edge-l.webp", r: "/images/hero-corp-edge-r.webp", t: "/images/hero-corp-edge-t.webp" };
const TOP_COLOR = "#3D5FE7";
const CYCLE = 36;
const SLOT = 6;

/** panggil saat idle supaya gambar sudah di cache sebelum toggle Corporate dipilih */
export function preloadCorporateHero() {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.src = window.innerWidth < 900 ? SRC.s : SRC.l;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- helper koordinat (piksel gambar asli -> persen) ---------- */
const pw = (v: number) => `${((v / IMG_W) * 100).toFixed(3)}%`;
const ph = (v: number) => `${((v / IMG_H) * 100).toFixed(3)}%`;
const cq = (v: number) => `${((v / IMG_W) * 100).toFixed(3)}cqw`;
const box = (x0: number, y0: number, x1: number, y1: number): CSSProperties => ({
  position: "absolute",
  left: pw(x0),
  top: ph(y0),
  width: pw(x1 - x0),
  height: ph(y1 - y0),
});
/** jeda animasi ruangan ke-i (siklus 36 detik; ruangan 0 aktif di detik 0-6, ruangan 1 di 6-12, dst) */
const slotDelay = (i: number, extra = 0) => `${(i === 0 ? 0 : -(CYCLE - SLOT * i)) + extra}s`;

/** ukuran asli tiap sprite [lebar, tinggi] */
const N: Record<string, [number, number]> = {
  "cloud-a": [570, 199],
  "cloud-b": [432, 119],
  "cloud-c": [228, 79],
  plane: [416, 140],
  drone: [284, 162],
  birds: [327, 190],
  "car-a": [348, 138],
  "car-b": [342, 153],
  "car-c": [368, 156],
  tram: [573, 246],
  cab: [202, 264],
  "sit-a": [129, 219],
  "sit-b": [149, 215],
  "sit-c": [148, 218],
  "sit-d": [124, 220],
  "stand-a": [122, 309],
  "stand-b": [116, 300],
};
const hOf = (n: string, w: number) => (w * N[n][1]) / N[n][0];

function Sp({ n, x, y, w, style, className = "" }: { n: string; x: number; y: number; w: number; style?: CSSProperties; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/corp/${n}.webp`}
      alt=""
      draggable={false}
      decoding="async"
      className={`pointer-events-none absolute max-w-none select-none ${className}`}
      style={{ left: pw(x), top: ph(y), width: pw(w), height: "auto", ...style }}
    />
  );
}

/* ---------- ruangan ---------- */
const ROOMS: { r: [number, number, number, number]; focus: string }[] = [
  { r: [90, 172, 488, 385], focus: "50% 45%" },
  { r: [90, 400, 488, 585], focus: "50% 50%" },
  { r: [90, 600, 488, 790], focus: "50% 50%" },
  { r: [1187, 172, 1585, 385], focus: "50% 55%" },
  { r: [1187, 400, 1585, 585], focus: "50% 60%" },
  { r: [1187, 603, 1585, 790], focus: "50% 55%" },
];

/* area langit yang boleh dilewati awan/pesawat (di luar badan gedung); koordinat melebar ke luar gambar */
const SKY_POLY = [
  [-900, -600], [2572, -600], [2572, 735], [1607, 735], [1607, 126], [1127, 126], [1127, 566],
  [548, 566], [548, 126], [65, 126], [65, 735], [-900, 735],
]
  .map(([x, y]) => `${((x / IMG_W) * 100).toFixed(2)}% ${((y / IMG_H) * 100).toFixed(2)}%`)
  .join(", ");

/* ---------- gelembung bahasa Inggris ---------- */
function Bubble({ x, y, slot, text, label, still }: { x: number; y: number; slot: number; text: string; label?: string; still: boolean }) {
  return (
    <div className="pointer-events-none absolute z-20" style={{ left: pw(x), top: ph(y), transform: "translate(-50%, -100%)", width: "max-content" }}>
      <span
        className="en-m-say relative block rounded-[0.7em] bg-white/95 px-[0.8em] py-[0.36em] font-semibold whitespace-nowrap text-[#14206B] shadow-[0_8px_22px_-8px_rgba(5,10,60,0.7)]"
        style={{
          fontSize: `max(11px, ${cq(16.5)})`,
          opacity: still ? (slot === 0 ? 1 : 0) : 0,
          transformOrigin: "50% 100%",
          animation: still ? undefined : `en-s-say ${CYCLE}s ease-out ${slotDelay(slot, 0.5)} infinite both`,
        }}
      >
        {label && <span className="block text-[0.58em] font-bold tracking-[0.14em] uppercase opacity-60">{label}</span>}
        {text}
        <span className="absolute top-full left-1/2 -mt-[0.28em] size-[0.55em] -translate-x-1/2 rotate-45 bg-white/95" />
      </span>
    </div>
  );
}

/* ---------- siluet gedung di tepi kiri/kanan (langit di luar gedung) ---------- */
function Skyline({ x0, x1, seed }: { x0: number; x1: number; seed: number }) {
  const { far, near, winA, winB } = useMemo(() => {
    const r = rng(seed);
    const far: { x: number; w: number; h: number }[] = [];
    const near: { x: number; w: number; h: number }[] = [];
    const winA: { x: number; y: number }[] = [];
    const winB: { x: number; y: number }[] = [];
    for (let x = x0; x < x1; ) {
      const w = 16 + r() * 22;
      far.push({ x, w, h: 24 + r() * 58 });
      x += w - 2;
    }
    for (let x = x0 + 8; x < x1; ) {
      const w = 18 + r() * 26;
      const h = 22 + r() * 92;
      near.push({ x, w, h });
      for (let k = 0; k < Math.floor(h / 15); k++) {
        if (r() < 0.55) (r() < 0.5 ? winA : winB).push({ x: x + 4 + r() * Math.max(2, w - 10), y: 735 - 10 - k * 13 - r() * 4 });
      }
      x += w + 2 + r() * 8;
    }
    return { far, near, winA, winB };
  }, [x0, x1, seed]);
  const H = 175;
  return (
    <svg
      className="absolute"
      style={{ left: pw(x0), top: ph(560), width: pw(x1 - x0), height: ph(H) }}
      viewBox={`${x0} 560 ${x1 - x0} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {far.map((b, i) => (
        <rect key={`f${i}`} x={b.x} y={735 - b.h} width={b.w} height={b.h + 1} fill="#7E86E6" opacity="0.55" />
      ))}
      {near.map((b, i) => (
        <rect key={`n${i}`} x={b.x} y={735 - b.h} width={b.w} height={b.h + 1} fill="#5B66D8" opacity="0.8" />
      ))}
      <g className="en-m-tw" style={{ animation: "en-twinkle 3.4s ease-in-out infinite" }}>
        {winA.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width="2.4" height="3.2" fill="#FFE9A0" />
        ))}
      </g>
      <g className="en-m-tw" style={{ animation: "en-twinkle 4.1s ease-in-out -1.7s infinite" }}>
        {winB.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width="2.4" height="3.2" fill="#FFE9A0" />
        ))}
      </g>
    </svg>
  );
}

/* ---------- jam dunia untuk layar analitik ---------- */
function useClocks() {
  const [t, setT] = useState<{ jkt: string; ldn: string; nyc: string } | null>(null);
  useEffect(() => {
    const fmt = (tz: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date());
    const tick = () => setT({ jkt: fmt("Asia/Jakarta"), ldn: fmt("Europe/London"), nyc: fmt("America/New_York") });
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

/* ---------- adegan ---------- */
export function CorporateScene() {
  const reduce = useReducedMotion() ?? false;
  const still = reduce;
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const clocks = useClocks();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => setSize({ w: el.clientWidth || 1440, h: el.clientHeight || 900 });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  const { w, h } = size;
  const portrait = w / h < 1.2;
  let ih: number;
  let iw: number;
  if (portrait) {
    ih = Math.max(Math.min(h * 0.58, (w * 1.9) / RATIO), (w * 1.25) / RATIO);
    iw = ih * RATIO;
  } else {
    const s = Math.min(w / IMG_W, h / IMG_H);
    iw = IMG_W * s;
    ih = IMG_H * s;
  }
  const ox = (w - iw) / 2;
  const oy = h - ih;
  const pan = portrait ? Math.max(0, (iw - w) / 2) * 0.9 : 0;

  const A = (v: string) => (still ? undefined : v);

  const lampX = [98, 442, 568, 1105, 1267, 1580];
  const vehiclesL = [
    { n: "car-a", w: 150, bottom: 908, d: -5 },
    { n: "car-c", w: 158, bottom: 908, d: 19 },
    { n: "car-b", w: 150, bottom: 908, d: 33 },
  ];
  const vehiclesR = [
    { n: "tram", w: 250, bottom: 939, d: 4 },
    { n: "car-b", w: 150, bottom: 937, d: 20 },
    { n: "car-a", w: 150, bottom: 937, d: 36 },
  ];

  return (
    <motion.div
      ref={root}
      aria-hidden
      className={`absolute inset-0 z-[6] overflow-hidden ${inView ? "" : "en-paused"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.7 }}
      style={{ background: TOP_COLOR }}
    >
      {/* kamera menggeser pelan antar gedung hanya di layar sempit (HP) */}
      <div
        className="en-m-pan absolute inset-0"
        style={
          {
            ["--pan" as string]: `${pan}px`,
            animation: A(pan > 0 ? "en-s-pan 44s ease-in-out infinite alternate" : "none"),
          } as CSSProperties
        }
      >
        <div
          className="en-m-settle absolute"
          style={{
            left: ox,
            top: oy,
            width: iw,
            height: ih,
            containerType: "inline-size",
            transformOrigin: "50% 100%",
            animation: A("en-s-settle 2.4s cubic-bezier(0.2,0.7,0.2,1) both"),
          }}
        >
          {/* perpanjangan tepi gambar (layar lebih lebar / lebih tinggi dari rasio gambar) */}
          {/* eslint-disable @next/next/no-img-element */}
          <img src={EDGE.l} alt="" draggable={false} className="absolute top-0 h-full max-w-none" style={{ right: "100%", width: Math.max(ox, 0) + 2 }} />
          <img src={EDGE.r} alt="" draggable={false} className="absolute top-0 h-full max-w-none" style={{ left: "100%", width: Math.max(w - ox - iw, 0) + 2 }} />
          <img src={EDGE.t} alt="" draggable={false} className="absolute left-0 w-full max-w-none" style={{ bottom: "100%", height: Math.max(oy, 0) + 2 }} />

          <img
            ref={imgRef}
            src={SRC.l}
            srcSet={`${SRC.s} 1280w, ${SRC.l} 1672w`}
            sizes={`${Math.round(iw)}px`}
            alt=""
            draggable={false}
            fetchPriority="high"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className="absolute inset-0 h-full w-full max-w-none select-none"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity .7s ease" }}
          />
          {/* eslint-enable @next/next/no-img-element */}

          {loaded && (
            <>
              {/* ================= LANGIT (dipotong mengikuti bentuk gedung) ================= */}
              <div className="absolute inset-0" style={{ clipPath: `polygon(${SKY_POLY})` }}>
                <Skyline x0={-900} x1={65} seed={11} />
                <Skyline x0={1607} x1={2572} seed={23} />

                {/* awan tiga lapis kecepatan */}
                {[
                  { n: "cloud-c", y: 26, w: 120, dur: 170, d: -120, o: 0.9 },
                  { n: "cloud-a", y: 46, w: 250, dur: 150, d: -45, o: 0.95 },
                  { n: "cloud-b", y: 98, w: 190, dur: 110, d: -85, o: 0.92 },
                  { n: "cloud-b", y: 470, w: 170, dur: 135, d: -20, o: 0.85 },
                  { n: "cloud-a", y: 500, w: 210, dur: 190, d: -150, o: 0.8 },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="en-m-cloud absolute left-0 top-0 h-full w-full"
                    style={{ animation: A(`en-s-cloud ${c.dur}s linear ${c.d}s infinite both`), opacity: c.o, transform: still ? `translateX(${[28, 8, 52, 70, 38][i]}cqw)` : undefined }}
                  >
                    <Sp n={c.n} x={0} y={c.y} w={c.w} />
                  </div>
                ))}

                {/* pesawat dengan jejak, melintas tiap 60 detik */}
                <div className="en-m-plane absolute left-0 top-0 h-full w-full" style={{ animation: A("en-s-fly-l 60s linear -4s infinite both"), opacity: still ? 0 : 1 }}>
                  <div className="absolute" style={{ left: pw(0), top: ph(84), width: pw(110), height: ph(40) }}>
                    <div className="absolute rounded-full" style={{ left: "92%", top: "46%", width: "160%", height: 3, background: "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0))" }} />
                    <Sp n="plane" x={0} y={0} w={110} style={{ left: 0, top: 0, width: "100%" }} />
                  </div>
                </div>

                {/* drone pengantar paket */}
                <div className="en-m-drone absolute left-0 top-0 h-full w-full" style={{ animation: A("en-s-fly-r 95s linear -22s infinite both"), opacity: still ? 0 : 1 }}>
                  <div className="en-m-bob" style={{ animation: A("en-s-bob 2.2s ease-in-out infinite") }}>
                    <Sp n="drone" x={0} y={528} w={58} />
                  </div>
                </div>

                {/* kawanan burung */}
                <div className="en-m-birds absolute left-0 top-0 h-full w-full" style={{ animation: A("en-s-flock 75s linear -10s infinite both"), opacity: still ? 0 : 1 }}>
                  <div className="en-m-bob" style={{ animation: A("en-s-bob 1.4s ease-in-out infinite") }}>
                    <Sp n="birds" x={0} y={96} w={78} />
                  </div>
                </div>
              </div>

              {/* awan kecil di jendela ruang rapat dan ruang negosiasi */}
              {[
                { r: [172, 218, 425, 302] as const, y: 236, d: -18 },
                { r: [1252, 216, 1500, 300] as const, y: 232, d: -52 },
              ].map((wd, i) => (
                <div key={i} className="pointer-events-none absolute overflow-hidden" style={box(wd.r[0], wd.r[1], wd.r[2], wd.r[3])}>
                  <div className="en-m-wc absolute inset-0" style={{ animation: A(`en-s-wcloud 78s linear ${wd.d}s infinite both`), opacity: 0.6, transform: still ? "translateX(40%)" : undefined }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/corp/cloud-c.webp"
                      alt=""
                      draggable={false}
                      className="absolute max-w-none"
                      style={{ left: 0, top: `${((wd.y - wd.r[1]) / (wd.r[3] - wd.r[1])) * 100}%`, width: `${(88 / (wd.r[2] - wd.r[0])) * 100}%`, height: "auto" }}
                    />
                  </div>
                </div>
              ))}

              {/* ================= RUANGAN: sorotan bergantian ================= */}
              {ROOMS.map((rm, i) => (
                <div key={`dim${i}`}>
                  <div
                    className="en-m-dim pointer-events-none"
                    style={{
                      ...box(...rm.r),
                      background: "#0A1466",
                      opacity: still ? (i === 0 ? 0 : 0.26) : 0,
                      animation: A(`en-s-dim ${CYCLE}s linear ${slotDelay(i)} infinite both`),
                    }}
                  />
                  <div
                    className="en-m-glow pointer-events-none"
                    style={{
                      ...box(...rm.r),
                      background: `radial-gradient(ellipse at ${rm.focus}, rgba(255,205,110,0.30), rgba(255,205,110,0) 72%)`,
                      opacity: still ? (i === 0 ? 1 : 0) : 0,
                      animation: A(`en-s-glow ${CYCLE}s linear ${slotDelay(i)} infinite both`),
                    }}
                  />
                </div>
              ))}

              {/* 1. Ruang rapat: lampu gantung berdenyut */}
              <div
                className="en-m-pulse pointer-events-none"
                style={{
                  ...box(236, 206, 366, 260),
                  background: "radial-gradient(closest-side, rgba(255,214,120,0.85), rgba(255,214,120,0))",
                  opacity: still ? 0.7 : 0.5,
                  animation: A("en-s-pulse 3.2s ease-in-out infinite alternate"),
                }}
              />
              <Bubble x={300} y={118} slot={0} text="Shall we begin?" still={still} />

              {/* 2. Video call: garis koneksi Indonesia ke dunia, panel peserta menyala bergantian */}
              <svg style={box(219, 436, 394, 531)} viewBox="0 0 175 95" preserveAspectRatio="none">
                {[
                  { to: [85, 22], c: [110, 4] },
                  { to: [36, 26], c: [90, -6] },
                  { to: [56, 51], c: [105, 34] },
                  { to: [161, 56], c: [158, 40] },
                ].map((p, i) => (
                  <g key={i}>
                    <path
                      className="en-m-draw"
                      d={`M143 51 Q ${p.c[0]} ${p.c[1]} ${p.to[0]} ${p.to[1]}`}
                      fill="none"
                      stroke="#FFF275"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={still ? 0 : 1}
                      style={{ animation: A(`en-s-draw ${CYCLE}s ease-in-out ${slotDelay(1, 0.7 + i * 0.7)} infinite both`) }}
                    />
                    <circle cx={p.to[0]} cy={p.to[1]} r="2.2" fill="#FFF275" className="en-m-draw" style={{ animation: A(`en-s-in ${CYCLE}s ease-out ${slotDelay(1, 1.4 + i * 0.7)} infinite both`), opacity: still ? 1 : 0 }} />
                  </g>
                ))}
                <circle cx="143" cy="51" r="3" fill="#FFF275" />
              </svg>
              {[
                [237, 500, 280, 524],
                [286, 500, 330, 524],
                [335, 500, 376, 524],
              ].map((t, i) => (
                <div
                  key={i}
                  className="en-m-spk pointer-events-none rounded-[3px]"
                  style={{
                    ...box(...(t as [number, number, number, number])),
                    border: "2px solid #FFF275",
                    boxShadow: "0 0 10px rgba(255,242,117,0.8)",
                    opacity: still ? (i === 1 ? 1 : 0) : 0,
                    animation: A(`en-s-spk ${CYCLE}s linear ${slotDelay(1, 0.9 + i * 1.9)} infinite both`),
                  }}
                />
              ))}
              <div
                className="en-m-pulse pointer-events-none"
                style={{
                  ...box(94, 458, 162, 526),
                  background: "radial-gradient(closest-side, rgba(255,226,130,0.9), rgba(255,226,130,0))",
                  opacity: still ? 0.8 : 0.45,
                  animation: A("en-s-pulse 2.4s ease-in-out infinite alternate"),
                }}
              />
              <Bubble x={290} y={434} slot={1} text="Can everyone hear me?" still={still} />

              {/* 3. Kelas English: frasa ditulis baris demi baris di papan tulis */}
              <div className="pointer-events-none absolute font-hand" style={{ ...box(194, 648, 382, 714), color: "#26389F", lineHeight: 1.25 }}>
                {[
                  { t: "Good morning, team.", s: 15.5 },
                  { t: "Could you clarify that?", s: 14.5 },
                  { t: "– Sure, I'll follow up.", s: 14.5 },
                ].map((l, i) => (
                  <div
                    key={i}
                    className="en-m-type whitespace-nowrap"
                    style={{
                      fontSize: cq(l.s),
                      marginBottom: cq(4),
                      color: i === 2 ? "#B8860B" : undefined,
                      animation: A(`en-s-type ${CYCLE}s steps(28, end) ${slotDelay(2, 0.5 + i * 1.5)} infinite both`),
                    }}
                  >
                    {l.t}
                  </div>
                ))}
              </div>
              <Bubble x={290} y={632} slot={2} text="Let's practise together." label="English Now" still={still} />

              {/* 4. Negosiasi: dokumen bergeser, tanda tangan, stempel centang */}
              <svg style={box(1300, 290, 1470, 360)} viewBox="0 0 170 70" preserveAspectRatio="none">
                <g className="en-m-paper" style={{ animation: A(`en-s-paper ${CYCLE}s ease-out ${slotDelay(3, 0.3)} infinite both`) }}>
                  <polygon points="92,57 126,57 133,48 99,48" fill="#F6F7FF" stroke="#BFC6EE" strokeWidth="0.8" />
                  <line x1="100" y1="51" x2="118" y2="51" stroke="#9AA4DD" strokeWidth="1" />
                  <line x1="98" y1="54" x2="112" y2="54" stroke="#9AA4DD" strokeWidth="1" />
                </g>
                <path
                  className="en-m-draw"
                  d="M112 54.5 q2.5 -5 4.5 0 t4.5 0 t4 -2.2"
                  fill="none"
                  stroke="#1E2F78"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={still ? 0 : 1}
                  style={{ animation: A(`en-s-draw ${CYCLE}s ease-in-out ${slotDelay(3, 1.7)} infinite both`) }}
                />
                <g className="en-m-stamp" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: still ? 1 : 0, animation: A(`en-s-stamp ${CYCLE}s ease-out ${slotDelay(3, 0.2)} infinite both`) }}>
                  <circle cx="141" cy="14" r="10" fill="#FFF275" stroke="#405FDA" strokeWidth="1.6" />
                  <path d="M135.5 14.5 l4 4 l7 -8" fill="none" stroke="#405FDA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
              <Bubble x={1385} y={118} slot={3} text="We have a deal." still={still} />

              {/* 5. Kantor tim: diagram alur tergambar, rekan kerja duduk, monitor berdenyut */}
              <svg style={box(1285, 451, 1485, 511)} viewBox="0 0 200 60" preserveAspectRatio="none">
                {[
                  { d: "M10 17 h42 a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h-42 a4 4 0 0 1 -4 -4 v-18 a4 4 0 0 1 4 -4 z", t: 0 },
                  { d: "M60 30 H84 M79 25.5 L85 30 L79 34.5", t: 0.9 },
                  { d: "M90 17 h42 a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h-42 a4 4 0 0 1 -4 -4 v-18 a4 4 0 0 1 4 -4 z", t: 1.8 },
                  { d: "M142 40 Q 162 38 184 12 M174 11 L185 10 L184 21", t: 2.8 },
                ].map((p, i) => (
                  <path
                    key={i}
                    className="en-m-draw"
                    d={p.d}
                    fill="none"
                    stroke="#405FDA"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={still ? 0 : 1}
                    style={{ animation: A(`en-s-draw ${CYCLE}s ease-in-out ${slotDelay(4, 0.4 + p.t)} infinite both`) }}
                  />
                ))}
                {[
                  { x: 31, t: "Plan", s: 0.9 },
                  { x: 111, t: "Pitch", s: 2.1 },
                ].map((l, i) => (
                  <text
                    key={i}
                    className="en-m-in"
                    x={l.x}
                    y="34.5"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#2B3FA8"
                    style={{ fontFamily: "var(--font-sans), sans-serif", opacity: still ? 1 : 0, animation: A(`en-s-in ${CYCLE}s ease-out ${slotDelay(4, l.s)} infinite both`) }}
                  >
                    {l.t}
                  </text>
                ))}
              </svg>
              {[1229, 1309, 1426, 1500].map((x, i) => (
                <div
                  key={x}
                  className="en-m-pulse pointer-events-none"
                  style={{
                    ...box(x + 2, 507, x + 40, 527),
                    background: "rgba(140,185,255,0.5)",
                    opacity: still ? 0.5 : 0.3,
                    animation: A(`en-s-pulse ${2.4 + i * 0.4}s ease-in-out ${-i * 0.7}s infinite alternate`),
                  }}
                />
              ))}
              {[
                { n: "sit-a", cx: 1246 },
                { n: "sit-b", cx: 1327 },
                { n: "sit-c", cx: 1449 },
                { n: "sit-d", cx: 1524 },
              ].map((p, i) => {
                const wd = 52;
                return (
                  <div
                    key={p.n}
                    className="en-m-in absolute"
                    style={{ left: pw(p.cx - wd / 2), top: ph(584 - hOf(p.n, wd)), width: pw(wd), opacity: still ? 1 : 0, animation: A(`en-s-in ${CYCLE}s ease-out ${slotDelay(4, 0.3 + i * 0.7)} infinite both`) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/corp/${p.n}.webp`} alt="" draggable={false} className="block h-auto w-full max-w-none" />
                  </div>
                );
              })}
              <Bubble x={1385} y={446} slot={4} text="Let's schedule a call." still={still} />

              {/* 6. Analitik: dashboard hidup di layar lebar, dua operator */}
              <svg style={box(1269, 634, 1502, 715)} viewBox="0 0 233 81" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dash-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1B2C86" />
                    <stop offset="1" stopColor="#101C63" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="233" height="81" rx="3" fill="url(#dash-bg)" />
                {[14, 26, 38].map((y) => (
                  <line key={y} x1="8" y1={y} x2="112" y2={y} stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="0.8" />
                ))}
                <path
                  className="en-m-line"
                  d="M8 50 L28 42 L46 46 L66 32 L86 26 L108 12"
                  fill="none"
                  stroke="#07A9F8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={still ? 0 : 1}
                  style={{ animation: A("en-s-line 8s ease-in-out infinite both") }}
                />
                {[16, 25, 20, 33, 29, 41].map((bh, i) => (
                  <rect
                    key={i}
                    className="en-m-bar"
                    x={124 + i * 9.5}
                    y={52 - bh}
                    width="6.2"
                    height={bh}
                    rx="1"
                    fill={i % 2 ? "#FFF275" : "#07A9F8"}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: A(`en-s-bar ${2.6 + (i % 3) * 0.5}s ease-in-out ${-i * 0.6}s infinite alternate both`) }}
                  />
                ))}
                <circle cx="206" cy="30" r="14" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="5" />
                <circle
                  className="en-m-ring"
                  cx="206"
                  cy="30"
                  r="14"
                  fill="none"
                  stroke="#FFF275"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={still ? 0.27 : 1}
                  transform="rotate(-90 206 30)"
                  style={{ animation: A("en-s-ring 6s ease-in-out infinite both") }}
                />
                {[
                  { x: 10, l: "JKT", v: clocks?.jkt },
                  { x: 86, l: "LDN", v: clocks?.ldn },
                  { x: 162, l: "NYC", v: clocks?.nyc },
                ].map((c) => (
                  <text key={c.l} x={c.x} y="72" fontSize="9" fontWeight="800" fill="#FFF275" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                    {c.l}
                    <tspan fill="#FFFFFF" fontWeight="700" dx="4">
                      {c.v ?? "--:--"}
                    </tspan>
                  </text>
                ))}
              </svg>
              {[
                { n: "sit-b", cx: 1273 },
                { n: "sit-d", cx: 1503 },
              ].map((p, i) => {
                const wd = 52;
                return (
                  <div
                    key={p.cx}
                    className="en-m-in absolute"
                    style={{ left: pw(p.cx - wd / 2), top: ph(789 - hOf(p.n, wd)), width: pw(wd), opacity: still ? 1 : 0, animation: A(`en-s-in ${CYCLE}s ease-out ${slotDelay(5, 0.4 + i * 0.9)} infinite both`) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/corp/${p.n}.webp`} alt="" draggable={false} className="block h-auto w-full max-w-none" />
                  </div>
                );
              })}
              <Bubble x={1385} y={628} slot={5} text="The numbers look great." still={still} />

              {/* ================= LIFT KACA ================= */}
              {[
                { x0: 503, x1: 543, d: -6, dur: 28 },
                { x0: 1132, x1: 1172, d: -20, dur: 34 },
              ].map((l, i) => {
                const cw = l.x1 - l.x0 - 4;
                const top = 178;
                const bottom = 792;
                const rng = bottom - top - hOf("cab", cw);
                return (
                  <div key={i} className="pointer-events-none absolute overflow-hidden" style={box(l.x0, top, l.x1, bottom)}>
                    <div
                      className="en-m-lift absolute"
                      style={
                        {
                          left: "5%",
                          top: 0,
                          width: "90%",
                          ["--rng" as string]: cq(rng),
                          transform: still ? `translateY(${cq(rng * 0.45)})` : undefined,
                          animation: A(`en-s-lift ${l.dur}s cubic-bezier(0.45,0,0.25,1) ${l.d}s infinite both`),
                        } as CSSProperties
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/corp/cab.webp" alt="" draggable={false} className="block h-auto w-full max-w-none" />
                    </div>
                  </div>
                );
              })}

              {/* ================= LOBI ================= */}
              <div
                className="en-m-pulse pointer-events-none"
                style={{
                  ...box(690, 640, 985, 815),
                  background: "radial-gradient(closest-side, rgba(255,214,130,0.55), rgba(255,214,130,0))",
                  opacity: still ? 0.7 : 0.4,
                  animation: A("en-s-pulse 4.2s ease-in-out infinite alternate"),
                }}
              />
              <div className="pointer-events-none overflow-hidden" style={box(548, 632, 1127, 804)}>
                <div
                  className="en-m-glint absolute top-0 h-full"
                  style={{
                    left: 0,
                    width: "20%",
                    background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))",
                    transform: still ? "translateX(-130%)" : undefined,
                    animation: A("en-s-glint 13s ease-in-out infinite both"),
                  }}
                />
              </div>
              {/* dua profesional menunggu di depan pintu, dilihat dari belakang */}
              <Sp n="stand-a" x={676} y={838 - hOf("stand-a", 40)} w={40} />
              <Sp n="stand-b" x={958} y={838 - hOf("stand-b", 38)} w={38} />

              {/* ================= LAMPU TAMAN ================= */}
              {lampX.map((x, i) => (
                <div
                  key={x}
                  className="en-m-pulse pointer-events-none"
                  style={{
                    ...box(x - 34, 770, x + 34, 826),
                    background: "radial-gradient(closest-side, rgba(255,214,120,0.8), rgba(255,214,120,0))",
                    opacity: still ? 0.8 : 0.5,
                    animation: A(`en-s-pulse ${3 + (i % 3) * 0.6}s ease-in-out ${-i * 0.8}s infinite alternate`),
                  }}
                />
              ))}

              {/* ================= JALAN: mobil (lajur atas ke kiri) dan trem + mobil (lajur bawah ke kanan) ================= */}
              {still ? (
                <Sp n="car-a" x={620} y={908 - hOf("car-a", 150)} w={150} />
              ) : (
                <>
                  {vehiclesL.map((v, i) => (
                    <div key={`l${i}`} className="en-m-car absolute left-0" style={{ top: ph(v.bottom - hOf(v.n, v.w)), width: pw(v.w), animation: `en-s-pass-l 48s linear ${v.d}s infinite both` }}>
                      <div className="absolute rounded-full" style={{ left: "-16%", bottom: "4%", width: "34%", height: "30%", background: "radial-gradient(closest-side, rgba(255,230,150,0.55), rgba(255,230,150,0))" }} />
                      <div className="absolute rounded-full" style={{ left: "4%", bottom: "-5%", width: "92%", height: "14%", background: "radial-gradient(closest-side, rgba(8,14,70,0.4), rgba(8,14,70,0))" }} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/corp/${v.n}.webp`} alt="" draggable={false} className="relative block h-auto w-full max-w-none" />
                    </div>
                  ))}
                  {vehiclesR.map((v, i) => (
                    <div key={`r${i}`} className="en-m-car absolute left-0" style={{ top: ph(v.bottom - hOf(v.n, v.w)), width: pw(v.w), animation: `en-s-pass-r 48s linear ${v.d}s infinite both` }}>
                      <div className="absolute rounded-full" style={{ right: "-16%", bottom: "4%", width: "34%", height: "30%", background: "radial-gradient(closest-side, rgba(255,230,150,0.55), rgba(255,230,150,0))" }} />
                      <div className="absolute rounded-full" style={{ left: "4%", bottom: "-5%", width: "92%", height: "14%", background: "radial-gradient(closest-side, rgba(8,14,70,0.4), rgba(8,14,70,0))" }} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/corp/${v.n}.webp`} alt="" draggable={false} className="relative block h-auto w-full max-w-none" style={{ transform: "scaleX(-1)" }} />
                    </div>
                  ))}
                </>
              )}

              {/* lampu gedung menyala saat halaman dimuat */}
              <div
                className="en-m-intro pointer-events-none"
                style={{ ...box(0, 0, IMG_W, IMG_H), background: "#070D44", opacity: 0, animation: A("en-s-intro 1.8s ease-out 0.15s both") }}
              />
            </>
          )}
        </div>
      </div>

      {/* butiran halus supaya tidak terlalu mulus (gambar kecil yang diulang, tanpa blend mode supaya ringan) */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "url(/images/grain.webp)", backgroundSize: "160px 160px", opacity: 0.55 }} />
    </motion.div>
  );
}
