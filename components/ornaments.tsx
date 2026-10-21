"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Ornamen kecil dari dunia hero yang muncul lagi di section-section bawah,
 * supaya halaman terasa satu dunia (seperti maskot yang muncul berulang).
 * Warna & bentuk mengikuti lukisan hero (paint/park.ts, paint/city.ts, ambient.ts).
 *  - Anak: layang-layang, kucing oranye, kupu-kupu, kelopak bunga.
 *  - Dewasa: bulan sabit, bintang, siluet kota tipis (tanpa karakter, tetap tenang).
 * Semua dekoratif (aria-hidden) dan diam jika pengguna memilih "kurangi animasi".
 */

/* ---------------- Anak ---------------- */

export function Kite({ className = "", reduce = false }: { className?: string; reduce?: boolean }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 80 150"
      className={className}
      animate={reduce ? undefined : { rotate: [-16, -8, -16], y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ originX: 0.5, originY: 0.35 }}
    >
      {/* ekor */}
      <motion.path
        d="M40 70 C 30 85, 50 95, 40 110 S 30 130, 42 146"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={reduce ? undefined : { d: ["M40 70 C 30 85, 50 95, 40 110 S 30 130, 42 146", "M40 70 C 50 85, 30 95, 42 110 S 52 130, 38 146", "M40 70 C 30 85, 50 95, 40 110 S 30 130, 42 146"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <ellipse cx="41" cy="96" rx="5" ry="2.6" fill="#405FDA" transform="rotate(35 41 96)" />
      <ellipse cx="39" cy="118" rx="5" ry="2.6" fill="#07A9F8" transform="rotate(35 39 118)" />
      <ellipse cx="41" cy="138" rx="5" ry="2.6" fill="#405FDA" transform="rotate(35 41 138)" />
      {/* badan layang-layang (warna sama dengan hero) */}
      <path d="M40 4 L64 36 L40 36 Z" fill="#FFE45C" />
      <path d="M40 4 L16 36 L40 36 Z" fill="#FFF39A" />
      <path d="M40 72 L64 36 L40 36 Z" fill="#405FDA" />
      <path d="M40 72 L16 36 L40 36 Z" fill="#5B78E6" />
      <path d="M40 4 V72 M16 36 H64" stroke="rgba(30,47,120,0.25)" strokeWidth="1" />
    </motion.svg>
  );
}

/**
 * Layang-layang yang "terbang" melintasi section mengikuti scroll,
 * dengan benang tipis ke bawah layar.
 */
export function KiteFlight({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-30%", "40%"]);
  const y = useTransform(scrollYProgress, [0, 1], ["35%", "-25%"]);
  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute ${className}`}>
      <motion.div style={reduce ? undefined : { x, y }} className="relative h-full w-full">
        <svg className="absolute top-[22%] left-[48%] h-[160%] w-[160%] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 Q 30 60, -60 140" fill="none" stroke="rgba(30,47,120,0.25)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        </svg>
        <Kite reduce={reduce} className="absolute inset-0 h-full w-full drop-shadow-[0_8px_10px_rgba(30,47,120,0.18)]" />
      </motion.div>
    </div>
  );
}

const WINGS = [
  { a: "#FFF7B0", b: "#FFC93C", edge: "#3A2A1A" },
  { a: "#FFFFFF", b: "#C9B8F5", edge: "#3B3566" },
  { a: "#FFE1EC", b: "#F79AC0", edge: "#5A2A44" },
  { a: "#E6F6FF", b: "#7CC8F8", edge: "#1E3A66" },
];

export function Butterfly({ tone = 0, className = "", reduce = false, delay = 0, rest = false }: { tone?: number; className?: string; reduce?: boolean; delay?: number; rest?: boolean }) {
  const w = WINGS[tone % WINGS.length];
  const id = `bf-${tone}`;
  const wing = () => (
    <motion.g
      style={{ originX: 0, originY: 0.5 }}
      animate={reduce ? undefined : rest ? { scaleX: [1, 1, 0.35, 1, 0.35, 1, 1] } : { scaleX: [1, 0.4, 1] }}
      transition={rest ? { duration: 3.6, repeat: Infinity, delay, times: [0, 0.6, 0.66, 0.72, 0.78, 0.84, 1] } : { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <path d="M50 49 C 54 22, 86 18, 82 40 C 80 47, 64 50, 50 49 Z" fill={`url(#${id})`} stroke={w.edge} strokeWidth="1.4" />
      <path d="M50 51 C 66 52, 74 66, 64 74 C 58 78, 52 64, 50 51 Z" fill={`url(#${id})`} stroke={w.edge} strokeWidth="1.4" />
      <circle cx="72" cy="34" r="2.6" fill="#fff" opacity="0.9" />
    </motion.g>
  );
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 100"
      className={className}
      animate={reduce || rest ? undefined : { y: [0, -10, 0], x: [0, 6, 0], rotate: [-8, 6, -8] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <defs>
        <linearGradient id={id} x1="0.5" y1="0.5" x2="1" y2="0">
          <stop offset="0" stopColor={w.b} />
          <stop offset="0.55" stopColor={w.a} />
          <stop offset="1" stopColor={w.b} />
        </linearGradient>
      </defs>
      {wing()}
      <g transform="matrix(-1 0 0 1 100 0)">{wing()}</g>
      <ellipse cx="50" cy="52" rx="2.4" ry="11" fill={w.edge} />
      <path d="M49 42 Q 44 30 40 28 M51 42 Q 56 30 60 28" stroke={w.edge} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}

/**
 * Kucing oranye dari hero yang rebahan di atas sebuah kartu: badan & kepala di tepi atas,
 * kaki depan menjuntai, ekor menggantung di sisi kanan kartu dan bergoyang pelan.
 * Letakkan di dalam elemen ber-`relative` (kartunya); kucing menempel di pojok kanan atas.
 */
export function CatOnCard({ reduce = false }: { reduce?: boolean }) {
  const body = "#F2A65A";
  const stripe = "#D9833A";
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -top-[54px] right-3 block h-[66px] w-[128px]"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: "spring", stiffness: 160, damping: 13, delay: 0.3 }}
    >
      {/* ekor: dari pantat kucing, melewati tepi kanan kartu, menggantung ke bawah */}
      <motion.svg
        viewBox="0 0 60 130"
        className="absolute top-[30px] -right-[36px] h-[130px] w-[60px] overflow-visible"
        style={{ originX: 0.2, originY: 0.12 }}
        animate={reduce ? undefined : { rotate: [0, 7, 0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M6 22 C 26 14, 40 22, 42 40 C 44 62, 38 84, 40 100 C 42 114, 30 120, 24 112" fill="none" stroke={body} strokeWidth="11" strokeLinecap="round" />
        <path d="M41 56 h4 M40 72 h4 M40 88 h4" stroke={stripe} strokeWidth="3" strokeLinecap="round" />
      </motion.svg>
      <svg viewBox="0 0 140 72" className="absolute inset-0 h-full w-full overflow-visible">
        {/* badan rebahan (roti tawar) */}
        <ellipse cx="90" cy="50" rx="46" ry="18" fill={body} />
        <path d="M78 34 Q 82 42 78 50 M94 33 Q 98 42 94 50 M110 35 Q 114 43 110 51" stroke={stripe} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        {/* dada & leher: menyambungkan kepala dengan kaki depan */}
        <ellipse cx="40" cy="52" rx="23" ry="14" fill={body} />
        <ellipse cx="40" cy="55" rx="12" ry="8" fill="#FFF3E2" />
        {/* kaki depan menjuntai di tepi kartu */}
        <ellipse cx="31" cy="63" rx="8.5" ry="7" fill={body} />
        <ellipse cx="49" cy="63" rx="8.5" ry="7" fill={body} />
        <path d="M27 66 v3 M32 66 v3 M47 66 v3 M52 66 v3" stroke={stripe} strokeWidth="1.3" strokeLinecap="round" />
        {/* kepala */}
        <g transform="translate(-4 -7) scale(0.72)">
          <motion.g
            style={{ originX: 0.6, originY: 1 }}
            animate={reduce ? undefined : { rotate: [0, 0, -14, 0, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.7, 0.75, 0.82, 1] }}
          >
            <path d="M24 34 L30 6 L48 24 Z" fill={body} />
            <path d="M29 28 L32 13 L42 24 Z" fill="#FFB3C1" />
          </motion.g>
          <path d="M96 34 L90 6 L72 24 Z" fill={body} />
          <path d="M91 28 L88 13 L78 24 Z" fill="#FFB3C1" />
          <ellipse cx="60" cy="44" rx="40" ry="30" fill={body} />
          <path d="M52 16 Q 54 26 50 32 M60 14 V 30 M68 16 Q 66 26 70 32" stroke={stripe} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <ellipse cx="60" cy="56" rx="17" ry="12" fill="#FFF3E2" />
          <motion.g
            style={{ originY: 0.5 }}
            animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
          >
            <ellipse cx="45" cy="44" rx="4" ry="5" fill="#2B1D12" />
            <ellipse cx="75" cy="44" rx="4" ry="5" fill="#2B1D12" />
            <circle cx="46.3" cy="42.4" r="1.4" fill="#fff" />
            <circle cx="76.3" cy="42.4" r="1.4" fill="#fff" />
          </motion.g>
          <path d="M57 52 L63 52 L60 55.5 Z" fill="#E77A8A" />
          <path d="M60 55.5 Q 57 59 54 58 M60 55.5 Q 63 59 66 58" stroke="#2B1D12" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M38 53 L22 50 M38 57 L23 59 M82 53 L98 50 M82 57 L97 59" stroke="#FFF3E2" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="36" cy="55" rx="5" ry="3" fill="#FFB3C1" opacity="0.55" />
          <ellipse cx="84" cy="55" rx="5" ry="3" fill="#FFB3C1" opacity="0.55" />
        </g>
      </svg>
    </motion.span>
  );
}

/** awan putih lembut (bentuk awan hero) yang bergeser pelan di latar section Anak */
export function KidsClouds({ className = "inset-0" }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;
  const clouds = [
    { top: "6%", left: "4%", w: 150, o: 0.9, d: 38 },
    { top: "18%", left: "82%", w: 110, o: 0.8, d: 46 },
    { top: "62%", left: "-2%", w: 90, o: 0.7, d: 52 },
    { top: "78%", left: "88%", w: 130, o: 0.75, d: 42 },
  ];
  return (
    <div aria-hidden className={`pointer-events-none absolute overflow-hidden ${className}`}>
      {clouds.map((c, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 120 50"
          className="absolute drop-shadow-[0_6px_10px_rgba(64,95,218,0.08)]"
          style={{ top: c.top, left: c.left, width: c.w, opacity: c.o }}
          animate={reduce ? undefined : { x: [0, 40, 0] }}
          transition={{ duration: c.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M15 40 a14 14 0 0 1 10-22 a18 18 0 0 1 33-6 a16 16 0 0 1 30 4 a12 12 0 0 1 17 24 z" fill="#fff" />
        </motion.svg>
      ))}
    </div>
  );
}

/** kelopak bunga sakura yang melayang pelan di latar section */
export function Petals({ count = 8, reduce = false }: { count?: number; reduce?: boolean }) {
  if (reduce) return null;
  const items = Array.from({ length: count }, (_, i) => ({
    left: (i * 37 + 11) % 100,
    delay: (i * 1.7) % 9,
    dur: 11 + ((i * 3) % 7),
    size: 9 + ((i * 5) % 7),
    color: i % 3 === 0 ? "#FFFFFF" : i % 3 === 1 ? "#FFD3E0" : "#F7B7CC",
  }));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -top-6 block rounded-[60%_0_60%_0]"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.75, background: p.color, boxShadow: "0 1px 2px rgba(200,120,150,0.25)" }}
          animate={{ y: ["0vh", "120vh"], x: [0, 40, -20, 30], rotate: [0, 180, 320] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* ---------------- Dewasa ---------------- */

/** bulan sabit dengan pendar hangat, sama seperti di langit kota hero */
export function Moon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="moon-glow">
          <stop offset="0" stopColor="rgba(255,226,170,0.55)" />
          <stop offset="1" stopColor="rgba(255,226,170,0)" />
        </radialGradient>
        <mask id="moon-cut">
          <rect width="100" height="100" fill="#fff" />
          <circle cx="60" cy="42" r="17" fill="#000" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#moon-glow)" />
      <circle cx="50" cy="50" r="19" fill="#F6D99A" mask="url(#moon-cut)" />
    </svg>
  );
}

/** titik-titik bintang yang berkelip pelan (posisi persen, bentuk tidak ikut melar) */
export function Stars({ count = 14, className = "", reduce = false, color = "#B9AAF2" }: { count?: number; className?: string; reduce?: boolean; color?: string }) {
  const pts = Array.from({ length: count }, (_, i) => ({ x: (i * 53 + 7) % 100, y: (i * 29 + 13) % 100, r: 3 + ((i * 7) % 3) * 1.5, d: (i * 0.37) % 3 }));
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      {pts.map((p, i) =>
        i % 4 === 0 ? (
          <motion.svg
            key={i}
            viewBox="0 0 20 20"
            className="absolute size-4"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 3, repeat: Infinity, delay: p.d }}
          >
            <path d="M10 0 L11.6 8.4 L20 10 L11.6 11.6 L10 20 L8.4 11.6 L0 10 L8.4 8.4 Z" fill="#F4C77B" />
          </motion.svg>
        ) : (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.r, height: p.r, background: color }}
            animate={reduce ? undefined : { opacity: [0.25, 0.8, 0.25] }}
            transition={{ duration: 2.4 + (i % 3), repeat: Infinity, delay: p.d }}
          />
        ),
      )}
    </div>
  );
}

/**
 * Titik-titik cahaya kota yang buram (bokeh), seperti lampu kota senja di hero.
 * Melayang & berdenyut pelan. Taruh di dalam elemen ber-`relative`.
 */
export function Bokeh({ count = 9, className = "", reduce = false }: { count?: number; className?: string; reduce?: boolean }) {
  const cols = ["255,200,140", "244,180,143", "185,170,242", "255,226,170"];
  const items = Array.from({ length: count }, (_, i) => ({
    x: (i * 41 + 9) % 100,
    y: (i * 67 + 23) % 100,
    s: 40 + ((i * 37) % 90),
    c: cols[i % cols.length],
    d: 7 + (i % 5) * 2,
  }));
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      {items.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.s,
            height: b.s,
            background: `radial-gradient(circle, rgba(${b.c},0.55) 0%, rgba(${b.c},0.22) 45%, rgba(${b.c},0) 70%)`,
          }}
          animate={reduce ? undefined : { y: [0, -18, 0], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        />
      ))}
    </div>
  );
}
