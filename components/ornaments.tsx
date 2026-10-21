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

export function Butterfly({ tone = 0, className = "", reduce = false, delay = 0 }: { tone?: number; className?: string; reduce?: boolean; delay?: number }) {
  const w = WINGS[tone % WINGS.length];
  const id = `bf-${tone}`;
  const wing = () => (
    <motion.g
      style={{ originX: 0, originY: 0.5 }}
      animate={reduce ? undefined : { scaleX: [1, 0.4, 1] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay }}
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
      animate={reduce ? undefined : { y: [0, -10, 0], x: [0, 6, 0], rotate: [-8, 6, -8] }}
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
 * Kucing oranye dari hero, mengintip dari balik tepi atas sebuah elemen
 * (letakkan di dalam elemen ber-`relative`, di tepi atasnya). Telinga berkedut & mata berkedip.
 */
export function PeekingCat({ className = "", reduce = false }: { className?: string; reduce?: boolean }) {
  const body = "#F2A65A";
  const stripe = "#D9833A";
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 120 70"
      className={className}
      initial={reduce ? false : { y: 26 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.3 }}
    >
      {/* telinga */}
      <motion.g
        style={{ originX: "38px", originY: "30px" }}
        animate={reduce ? undefined : { rotate: [0, 0, -12, 0, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.7, 0.75, 0.82, 1] }}
      >
        <path d="M24 34 L30 6 L48 24 Z" fill={body} />
        <path d="M29 28 L32 13 L42 24 Z" fill="#FFB3C1" />
      </motion.g>
      <path d="M96 34 L90 6 L72 24 Z" fill={body} />
      <path d="M91 28 L88 13 L78 24 Z" fill="#FFB3C1" />
      {/* kepala */}
      <ellipse cx="60" cy="44" rx="40" ry="30" fill={body} />
      <path d="M52 16 Q 54 26 50 32 M60 14 V 30 M68 16 Q 66 26 70 32" stroke={stripe} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <ellipse cx="60" cy="56" rx="17" ry="12" fill="#FFF3E2" />
      {/* mata berkedip */}
      <motion.g
        style={{ originY: "44px" }}
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
      {/* kaki depan menggantung di tepi */}
      <ellipse cx="34" cy="70" rx="11" ry="7" fill={body} />
      <ellipse cx="86" cy="70" rx="11" ry="7" fill={body} />
      <path d="M30 70 V74 M35 70 V74 M82 70 V74 M87 70 V74" stroke={stripe} strokeWidth="1.4" strokeLinecap="round" />
    </motion.svg>
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

/** siluet kota tipis (garis + beberapa jendela menyala), untuk tepi bawah section Dewasa */
export function Skyline({ className = "" }: { className?: string }) {
  // gedung deterministik supaya tidak berubah tiap render
  const blocks: { x: number; w: number; h: number }[] = [];
  let x = 0;
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
  while (x < 1200) {
    const w = 26 + rnd() * 46;
    const tall = Math.exp(-(((x - 300) / 120) ** 2)) + Math.exp(-(((x - 880) / 140) ** 2));
    blocks.push({ x, w, h: 24 + rnd() * 50 + tall * 70 });
    x += w + 3;
  }
  return (
    <svg aria-hidden viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice" className={`pointer-events-none ${className}`}>
      <defs>
        <linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#405FDA" stopOpacity="0.10" />
          <stop offset="1" stopColor="#405FDA" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={160 - b.h} width={b.w} height={b.h} fill="url(#sky-fill)" stroke="rgba(64,95,218,0.18)" strokeWidth="1" />
          {Array.from({ length: Math.floor(b.h / 22) }, (_, k) =>
            (i + k) % 3 === 0 ? <rect key={k} x={b.x + 6 + ((k * 11) % Math.max(1, b.w - 14))} y={160 - b.h + 10 + k * 20} width="4" height="5" fill="#F4C77B" opacity="0.7" /> : null,
          )}
        </g>
      ))}
    </svg>
  );
}
