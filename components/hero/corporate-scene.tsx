"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": gedung perkantoran dipotong (dollhouse) dengan 6 ruangan bisnis, semuanya hidup bersamaan.
 *
 * Semua posisi memakai koordinat gambar asli (1672 x 941), jadi tetap menempel di benda yang sama
 * di ukuran layar berapa pun. Yang bergerak hanya transform dan opacity (ringan), kecuali beberapa
 * garis SVG kecil yang "digambar".
 *
 * Alur 3 detik pertama: lampu tiap ruangan menyala berurutan (0 - 1,1 detik), orang-orang muncul di kursinya,
 * gelembung pertama muncul, papan tulis mulai menulis, kartu kanban mulai berpindah, dashboard berjalan.
 * Setelah itu gelembung bergulir tiap 3 detik (siklus 12 detik) dan semua ruangan terus bergerak:
 *  - Ruang rapat   : pemimpin rapat berdiri membelakangi jendela, "Shall we begin?"
 *  - Video call    : garis koneksi dari Indonesia ke kota lain tergambar di peta, panel peserta menyala bergantian
 *  - Kelas English : frasa bisnis + artinya ditulis di papan tulis
 *  - Negosiasi     : dua dokumen bergeser ke meja, centang "Deal" muncul
 *  - Kantor tim    : kartu kanban To do -> Doing -> Done berpindah, rekan kerja duduk di kursi
 *  - Analitik      : dashboard terang dengan grafik, batang, dan jam dunia (Jakarta, London, New York)
 * Di luar gedung: awan beragam, bintang, pesawat berlampu kedip, burung, kereta layang jauh di skyline,
 * lampu lift naik-turun tepat di tiap lantai. Tanpa parallax kursor. Semua animasi berhenti saat hero
 * keluar layar atau gerak dikurangi.
 */

const IMG_W = 1672;
const IMG_H = 941;
const RATIO = IMG_W / IMG_H;
const SRC = { s: "/images/hero-corp-1280.webp", l: "/images/hero-corp-1672.webp" };
const EDGE = { l: "/images/hero-corp-edge-l.webp", r: "/images/hero-corp-edge-r.webp", t: "/images/hero-corp-edge-t.webp" };
const TOP_COLOR = "#4266EF";
const NEXT_BG = "#FBF6EE"; // warna section di bawah hero (SECTION_BG.adult)
const CYCLE = 12;

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

/** ukuran asli tiap sprite [lebar, tinggi] */
const N: Record<string, [number, number]> = {
  "cloud-1": [745, 249],
  "cloud-2": [720, 205],
  "strat-1": [677, 71],
  "strat-2": [690, 44],
  "puff-1": [247, 124],
  "puff-2": [210, 89],
  "cirrus-1": [515, 144],
  "cirrus-2": [585, 137],
  pair: [315, 82],
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
const ROOMS: [number, number, number, number][] = [
  [70, 200, 398, 380], // 0 ruang rapat
  [1272, 200, 1602, 377], // 1 negosiasi
  [70, 395, 398, 547], // 2 video call
  [1272, 395, 1602, 548], // 3 kantor tim
  [70, 565, 398, 722], // 4 kelas English
  [1272, 565, 1602, 722], // 5 analitik
  [452, 590, 1222, 745], // 6 lobi
];

/** area langit di luar badan gedung (untuk awan rendah); awan rendah selalu di y >= 170 supaya tidak menyentuh atap */
const toPoly = (pts: number[][]) => pts.map(([x, y]) => `${((x / IMG_W) * 100).toFixed(2)}% ${((y / IMG_H) * 100).toFixed(2)}%`).join(", ");
const SKY_POLY = toPoly([
  [-900, -600], [2572, -600], [2572, 735], [1622, 735], [1622, 157], [1223, 157], [1223, 562],
  [447, 562], [447, 157], [50, 157], [50, 735], [-900, 735],
]);
/** pita langit di atas atap gedung: awan tinggi dan burung/pesawat hanya di sini (tidak pernah memotong parapet) */
const HIGH_POLY = toPoly([[-900, -600], [2572, -600], [2572, 150], [-900, 150]]);

/* ---------- gelembung bahasa Inggris + artinya ---------- */
function Bubble({ x, y, delay, text, sub, still, first }: { x: number; y: number; delay: number; label?: string; text: string; sub: string; still: boolean; first: boolean }) {
  return (
    <div className="pointer-events-none absolute z-20" style={{ left: pw(x), top: ph(y), transform: "translate(-50%, -100%)", width: "max-content" }}>
      <span
        className="en-m-say relative block rounded-[0.7em] bg-white/96 px-[0.7em] py-[0.42em] text-left whitespace-nowrap text-[#14206B] shadow-[0_8px_22px_-8px_rgba(5,10,60,0.7)]"
        style={{
          fontSize: `max(11px, ${cq(17)})`,
          opacity: still ? (first ? 1 : 0) : 0,
          transformOrigin: "50% 100%",
          animation: still ? undefined : `en-s-say ${CYCLE}s ease-out ${delay}s infinite both`,
        }}
      >
        <span className="block leading-tight font-bold">{text}</span>
        <span className="block text-[0.66em] leading-tight font-medium text-[#14206B]/60">{sub}</span>
        <span className="absolute top-full left-1/2 -mt-[0.28em] size-[0.55em] -translate-x-1/2 rotate-45 bg-white/96" />
      </span>
    </div>
  );
}

/* ---------- siluet gedung dengan jendela berkedip ---------- */
function Skyline({ x0, x1, seed, base, hMax, op = 1 }: { x0: number; x1: number; seed: number; base: number; hMax: number; op?: number }) {
  const { far, near, winA, winB } = useMemo(() => {
    const r = rng(seed);
    const far: { x: number; w: number; h: number }[] = [];
    const near: { x: number; w: number; h: number }[] = [];
    const winA: { x: number; y: number }[] = [];
    const winB: { x: number; y: number }[] = [];
    for (let x = x0; x < x1; ) {
      const w = 14 + r() * 20;
      far.push({ x, w, h: hMax * (0.35 + r() * 0.5) });
      x += w - 2;
    }
    for (let x = x0 + 6; x < x1; ) {
      const w = 16 + r() * 22;
      const h = hMax * (0.2 + r() * 0.8);
      near.push({ x, w, h });
      for (let k = 0; k < Math.floor(h / 13); k++) {
        if (r() < 0.55) (r() < 0.5 ? winA : winB).push({ x: x + 3 + r() * Math.max(2, w - 9), y: base - 9 - k * 12 - r() * 3 });
      }
      x += w + 2 + r() * 8;
    }
    return { far, near, winA, winB };
  }, [x0, x1, seed, base, hMax]);
  const H = hMax + 20;
  return (
    <svg
      className="absolute"
      style={{ left: pw(x0), top: ph(base - H), width: pw(x1 - x0), height: ph(H), opacity: op }}
      viewBox={`${x0} ${base - H} ${x1 - x0} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {far.map((b, i) => (
        <rect key={`f${i}`} x={b.x} y={base - b.h} width={b.w} height={b.h + 1} fill="#7E86E6" opacity="0.55" />
      ))}
      {near.map((b, i) => (
        <rect key={`n${i}`} x={b.x} y={base - b.h} width={b.w} height={b.h + 1} fill="#5B66D8" opacity="0.8" />
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

/* ---------- kereta layang kecil di kejauhan ---------- */
function Train() {
  return (
    <svg viewBox="0 0 260 14" className="block h-full w-full" aria-hidden>
      <path d="M2 11.5 V4.5 Q2 2 5 2 H214 Q246 2 258 9 Q259 10.2 257 11.5 Z" fill="#EEF1FF" />
      <rect x="2" y="9" width="256" height="2.6" fill="#405FDA" />
      {Array.from({ length: 14 }, (_, k) => (
        <rect key={k} x={10 + k * 15} y="4" width="9" height="3.2" rx="0.9" fill="#F2DC98" />
      ))}
      <path d="M222 4 L242 4 Q250 5 254 8.4 L222 8.4 Z" fill="#7C8BE0" />
      <circle cx="257" cy="9.4" r="1.3" fill="#FFF8C8" />
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

/** bayangan kontak di lantai di bawah sprite supaya tidak terlihat "ditempel" */
function Shadow({ cx, y, w, delay = 0, still }: { cx: number; y: number; w: number; delay?: number; still: boolean }) {
  return (
    <div
      className="en-m-in pointer-events-none"
      style={{
        ...box(cx - w / 2, y - 3.5, cx + w / 2, y + 3.5),
        background: "radial-gradient(closest-side, rgba(12,18,70,0.5), rgba(12,18,70,0))",
        opacity: still ? 1 : 0,
        animation: still ? undefined : `en-s-appear 0.5s ease-out ${delay}s both`,
      }}
    />
  );
}

const WARM = "sepia(0.16) saturate(1.08) brightness(0.98)";
const COOL = "saturate(0.92) brightness(0.94) hue-rotate(-6deg)";

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
    const s = Math.min(w / IMG_W, h / IMG_H) * 0.96;
    iw = IMG_W * s;
    ih = IMG_H * s;
  }
  const ox = (w - iw) / 2;
  const oy = h - ih;
  const pan = portrait ? Math.max(0, (iw - w) / 2) * 0.9 : 0;

  const A = (v: string) => (still ? undefined : v);
  const lampX = [76, 366, 553, 1122, 1307, 1596];

  /* posisi berhenti lampu lift tepat di lantai: bawah kabin = permukaan lantai (y) */
  const CAB_H = 38;
  const SHAFT_TOP = 200;
  const SHAFT_BOT = 725;
  const cabPct = (floorY: number) => `${(((floorY - CAB_H - SHAFT_TOP) / CAB_H) * 100).toFixed(1)}%`;

  /* ---- awan: 6 jenis, dua lapis kedalaman ---- */
  const highClouds = [
    { n: "cloud-1", w: 230, y: 20, dur: 240, d: -62, dir: "r", o: 0.95 },
    { n: "puff-2", w: 80, y: 46, dur: 130, d: -68, dir: "r", o: 0.9 },
    { n: "strat-2", w: 280, y: 80, dur: 200, d: -42, dir: "l", o: 0.8 },
    { n: "cloud-2", w: 170, y: 40, dur: 190, d: -119, dir: "l", o: 0.9 },
  ];
  const lowClouds = [
    { n: "cloud-2", w: 420, y: 250, dur: 300, d: -120, dir: "r", o: 0.8 },
    { n: "strat-1", w: 360, y: 470, dur: 240, d: -50, dir: "l", o: 0.75 },
    { n: "cirrus-2", w: 300, y: 340, dur: 260, d: -200, dir: "r", o: 0.7 },
    { n: "cloud-1", w: 360, y: 395, dur: 330, d: -250, dir: "l", o: 0.75 },
  ];
  const stars = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 16 }, (_, i) => ({ x: r() * IMG_W, y: 6 + r() * 70, r: 0.8 + r() * 0.9, set: i % 2 }));
  }, []);

  return (
    <motion.div
      ref={root}
      aria-hidden
      className={`absolute inset-0 z-[6] overflow-hidden ${inView ? "" : "en-paused"}`}
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
            animation: A("en-s-settle 1.6s cubic-bezier(0.2,0.7,0.2,1) both"),
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
            style={{ opacity: loaded ? 1 : 0, transition: "opacity .6s ease" }}
          />
          {/* eslint-enable @next/next/no-img-element */}

          {loaded && (
            <>
              {/* ================= LANGIT ATAS (di atas atap gedung): awan tinggi, bintang, pesawat, burung ================= */}
              <div className="absolute inset-0" style={{ clipPath: `polygon(${HIGH_POLY})` }}>
                <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${IMG_W} ${IMG_H}`} preserveAspectRatio="none" aria-hidden>
                  {[0, 1].map((set) => (
                    <g key={set} className="en-m-tw" style={{ animation: A(`en-twinkle ${3 + set * 1.3}s ease-in-out ${-set * 1.1}s infinite`) }}>
                      {stars.filter((s) => s.set === set).map((s, i) => (
                        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity="0.85" />
                      ))}
                    </g>
                  ))}
                </svg>

                {highClouds.map((c, i) => (
                  <div
                    key={i}
                    className="en-m-cloud absolute inset-0"
                    style={{ animation: A(`${c.dir === "r" ? "en-s-cloud" : "en-s-cloud-l"} ${c.dur}s linear ${c.d}s infinite both`), opacity: c.o, transform: still ? `translateX(${[10, 55, 100, 30][i]}cqw)` : undefined }}
                  >
                    <Sp n={c.n} x={0} y={c.y} w={c.w} />
                  </div>
                ))}

                {/* pesawat kecil dengan lampu merah/putih berkedip dan jejak tipis */}
                <div className="en-m-plane absolute inset-0" style={{ animation: A("en-s-fly-r 50s linear -3s infinite both"), opacity: still ? 0 : 1 }}>
                  <div className="absolute" style={{ left: pw(0), top: ph(70), width: pw(46), height: ph(17) }}>
                    <div className="absolute rounded-full" style={{ right: "92%", top: "46%", width: "230%", height: 2, background: "linear-gradient(270deg, rgba(255,255,255,0.5), rgba(255,255,255,0))" }} />
                    <svg viewBox="0 0 44 16" className="absolute inset-0 h-full w-full" aria-hidden>
                      <path d="M2 8 L8 6.6 L34 6.6 Q40 6.6 43 8 Q40 9.4 34 9.4 L8 9.4 Z" fill="#F2F4FF" />
                      <polygon points="17,7 27,7 21,1.4 18.6,1.4" fill="#D7DDFF" />
                      <polygon points="3,7 9,7 6.6,2.2 4.4,2.2" fill="#D7DDFF" />
                      <circle className="en-m-blink" cx="19.4" cy="1.5" r="1.3" fill="#FF4D4D" style={{ animation: A("en-blink 1.6s linear infinite") }} />
                      <circle className="en-m-blink" cx="5" cy="2.3" r="1.2" fill="#FFFFFF" style={{ animation: A("en-blink 1.6s linear -0.8s infinite") }} />
                    </svg>
                  </div>
                </div>

                {/* kawanan burung (bentuk V yang mengepak) */}
                <div className="en-m-birds absolute inset-0" style={{ animation: A("en-s-flock 70s linear -14s infinite both"), opacity: still ? 0 : 1 }}>
                  {[
                    { x: 0, y: 92, s: 15, d: 0 },
                    { x: 20, y: 82, s: 12, d: -0.2 },
                    { x: 38, y: 96, s: 13, d: -0.4 },
                    { x: 56, y: 86, s: 11, d: -0.1 },
                    { x: 72, y: 94, s: 12, d: -0.35 },
                  ].map((b, i) => (
                    <svg key={i} viewBox="0 0 16 8" className="en-m-flap absolute" style={{ left: pw(b.x), top: ph(b.y), width: pw(b.s), height: "auto", transformOrigin: "50% 100%", animation: A(`en-flap 0.9s ease-in-out ${b.d}s infinite`) }} aria-hidden>
                      <path d="M1 6 Q4.5 0.6 8 5 Q11.5 0.6 15 6" fill="none" stroke="#F4F6FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* ================= LANGIT RENDAH (celah tengah dan tepi): awan besar berlapis ================= */}
              <div className="absolute inset-0" style={{ clipPath: `polygon(${SKY_POLY})` }}>
                <Skyline x0={-900} x1={50} seed={11} base={735} hMax={110} />
                <Skyline x0={1622} x1={2572} seed={23} base={735} hMax={110} />
                {lowClouds.map((c, i) => (
                  <div
                    key={i}
                    className="en-m-cloud absolute inset-0"
                    style={{ animation: A(`${c.dir === "r" ? "en-s-cloud" : "en-s-cloud-l"} ${c.dur}s linear ${c.d}s infinite both`), opacity: c.o, transform: still ? `translateX(${[40, 70, 20, 85][i]}cqw)` : undefined }}
                  >
                    <Sp n={c.n} x={0} y={c.y} w={c.w} />
                  </div>
                ))}

                {/* lintasan layang panjang: kereta lewat di belakang gedung lalu muncul lagi di sisi lain */}
                <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${IMG_W} ${IMG_H}`} preserveAspectRatio="none" aria-hidden>
                  <rect x="-900" y="556" width="3472" height="3" fill="#2B3AA0" opacity="0.9" />
                  <rect x="-900" y="559" width="3472" height="5" fill="#1F2C8A" opacity="0.35" />
                  {[...Array.from({ length: 5 }, (_, k) => -820 + k * 200), ...Array.from({ length: 5 }, (_, k) => 1700 + k * 200)].map((x) => (
                    <path key={x} d="M0 0 H12 L10 176 H2 Z" transform={`translate(${x} 564)`} fill="#2F3CA8" opacity="0.8" />
                  ))}
                </svg>
                {[
                  { dir: "r", delay: 0.3 },
                  { dir: "l", delay: 12.3 },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="en-m-train absolute inset-0"
                    style={{
                      transform: still ? "translateX(34cqw)" : undefined,
                      opacity: still ? (i === 0 ? 1 : 0) : 1,
                      animation: A(`${t.dir === "r" ? "en-s-bullet-r" : "en-s-bullet-l"} 24s cubic-bezier(0.3,0.1,0.5,1) ${t.delay}s infinite both`),
                    }}
                  >
                    <div className="absolute" style={{ left: 0, top: ph(536), width: pw(352), height: ph(20) }}>
                      <div style={{ position: "relative", height: "100%", transform: t.dir === "r" ? undefined : "scaleX(-1)" }}>
                        {/* cahaya: pendar di sekitar kereta, sorot lampu depan, pantulan di rel */}
                        <div className="absolute" style={{ left: "-6%", right: "-6%", top: "-190%", bottom: "-190%", background: "radial-gradient(closest-side, rgba(255,228,140,0.2), rgba(255,228,140,0))" }} />
                        <div className="absolute" style={{ left: "97%", width: "70%", top: "-70%", height: "240%", background: "linear-gradient(90deg, rgba(255,246,205,0.34), rgba(255,246,205,0))", clipPath: "polygon(0 42%, 100% 0, 100% 100%, 0 62%)" }} />
                        <div className="absolute" style={{ left: "4%", right: "4%", top: "100%", height: "70%", background: "linear-gradient(rgba(255,226,140,0.18), rgba(255,226,140,0))" }} />
                        <Train />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* awan kecil di jendela ruang rapat dan ruang negosiasi */}
              {[
                { r: [141, 238, 346, 330] as const, y: 262, d: -18 },
                { r: [1326, 236, 1531, 330] as const, y: 258, d: -52 },
              ].map((wd, i) => (
                <div key={i} className="pointer-events-none absolute overflow-hidden" style={box(wd.r[0], wd.r[1], wd.r[2], wd.r[3])}>
                  <div className="en-m-wc absolute inset-0" style={{ animation: A(`en-s-wcloud 78s linear ${wd.d}s infinite both`), opacity: 0.6, transform: still ? "translateX(40%)" : undefined }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/corp/puff-2.webp"
                      alt=""
                      draggable={false}
                      className="absolute max-w-none"
                      style={{ left: 0, top: `${((wd.y - wd.r[1]) / (wd.r[3] - wd.r[1])) * 100}%`, width: `${(80 / (wd.r[2] - wd.r[0])) * 100}%`, height: "auto" }}
                    />
                  </div>
                </div>
              ))}

              {/* ================= LAMPU TIAP RUANGAN MENYALA BERURUTAN (0 - 1,1 detik) ================= */}
              {ROOMS.map((r, i) => (
                <div
                  key={`on${i}`}
                  className="en-m-on pointer-events-none"
                  style={{ ...box(...r), background: "#070D44", opacity: 0, animation: A(`en-s-on 0.55s ease-out ${i * 0.15}s both`) }}
                />
              ))}

              {/* ================= 1. RUANG RAPAT ================= */}
              <div
                className="en-m-pulse pointer-events-none"
                style={{
                  ...box(195, 226, 290, 264),
                  background: "radial-gradient(closest-side, rgba(255,214,120,0.85), rgba(255,214,120,0))",
                  opacity: still ? 0.7 : 0.5,
                  animation: A("en-s-pulse 3.2s ease-in-out infinite alternate"),
                }}
              />
              <Bubble x={734} y={664} delay={0.5} text="Nice to meet you." sub="Senang bertemu Anda." still={still} first />

              {/* ================= 2. VIDEO CALL ================= */}
              <svg style={box(184, 430, 316, 478)} viewBox="0 0 132 48" preserveAspectRatio="none">
                {[
                  { to: [66, 10], c: [88, 2] },
                  { to: [31, 7], c: [66, -6] },
                  { to: [43, 35], c: [72, 38] },
                  { to: [108, 40], c: [112, 30] },
                ].map((p, i) => (
                  <g key={i}>
                    <path
                      className="en-m-draw"
                      d={`M101 32 Q ${p.c[0]} ${p.c[1]} ${p.to[0]} ${p.to[1]}`}
                      fill="none"
                      stroke="#FFF275"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={still ? 0 : 1}
                      style={{ animation: A(`en-s-draw ${CYCLE}s ease-in-out ${3.5 + i * 0.35}s infinite both`) }}
                    />
                    <circle
                      className="en-m-draw"
                      cx={p.to[0]}
                      cy={p.to[1]}
                      r="2"
                      fill="#FFF275"
                      style={{ transformBox: "fill-box", transformOrigin: "center", opacity: still ? 1 : 0, animation: A(`en-s-pop ${CYCLE}s ease-out ${3.2 + i * 0.35}s infinite both`) }}
                    />
                  </g>
                ))}
                <circle cx="101" cy="32" r="2.6" fill="#FFF275" />
              </svg>
              {[
                [192, 478, 227, 498],
                [233, 478, 267, 498],
                [273, 478, 307, 498],
              ].map((t, i) => (
                <div
                  key={i}
                  className="en-m-spk pointer-events-none rounded-[3px]"
                  style={{
                    ...box(...(t as [number, number, number, number])),
                    border: "2px solid #FFF275",
                    boxShadow: "0 0 10px rgba(255,242,117,0.8)",
                    opacity: still ? (i === 1 ? 1 : 0) : 0,
                    animation: A(`en-s-spk 4.4s linear ${i * 1.5}s infinite both`),
                  }}
                />
              ))}
              <div
                className="en-m-pulse pointer-events-none"
                style={{
                  ...box(80, 450, 124, 494),
                  background: "radial-gradient(closest-side, rgba(255,226,130,0.9), rgba(255,226,130,0))",
                  opacity: still ? 0.8 : 0.45,
                  animation: A("en-s-pulse 2.4s ease-in-out infinite alternate"),
                }}
              />
              <Bubble x={250} y={426} delay={3.5} text="Can everyone hear me?" sub="Apakah suara saya terdengar?" still={still} first={false} />

              {/* ================= 3. KELAS ENGLISH: frasa + artinya ditulis cepat ================= */}
              <div className="pointer-events-none absolute" style={box(158, 603, 309, 658)}>
                {[
                  { t: "Good morning!", s: "Selamat pagi!" },
                  { t: "Could you clarify?", s: "Bisa tolong jelaskan?" },
                  { t: "Thank you!", s: "Terima kasih!" },
                ].map((l, i) => (
                  <div
                    key={i}
                    className="en-m-write absolute inset-0 flex flex-col items-center justify-center text-center"
                    style={{
                      color: "#26389F",
                      opacity: still ? (i === 0 ? 1 : 0) : 1,
                      animation: A(`en-s-write ${CYCLE}s linear ${i * 4}s infinite both`),
                    }}
                  >
                    <span className="font-sans font-extrabold" style={{ fontSize: cq(14.5), lineHeight: 1.15, boxShadow: "inset 0 -0.34em 0 rgba(255,235,90,0.85)", padding: "0 0.12em" }}>
                      {l.t}
                    </span>
                    <span className="font-sans font-medium" style={{ fontSize: cq(9.5), marginTop: cq(3), color: "#4B58B0" }}>
                      {l.s}
                    </span>
                  </div>
                ))}
              </div>

              {/* ================= 4. NEGOSIASI: dua dokumen bertemu, centang Deal ================= */}
              <svg style={box(1360, 260, 1540, 360)} viewBox="0 0 180 100" preserveAspectRatio="none">
                <g className="en-m-card" style={{ opacity: still ? 1 : 0, animation: A(`en-s-cardl ${CYCLE}s ease-out 6.4s infinite both`) }}>
                  <polygon points="30,84 56,84 62,76 36,76" fill="#F6F7FF" stroke="#BFC6EE" strokeWidth="0.8" />
                  <line x1="38" y1="80" x2="54" y2="80" stroke="#9AA4DD" strokeWidth="1" />
                </g>
                <g className="en-m-card" style={{ opacity: still ? 1 : 0, animation: A(`en-s-cardr ${CYCLE}s ease-out 6.4s infinite both`) }}>
                  <polygon points="104,84 130,84 136,76 110,76" fill="#F6F7FF" stroke="#BFC6EE" strokeWidth="0.8" />
                  <line x1="112" y1="80" x2="128" y2="80" stroke="#9AA4DD" strokeWidth="1" />
                </g>
                <g className="en-m-pop" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: still ? 1 : 0, animation: A(`en-s-pop ${CYCLE}s ease-out 6.4s infinite both`) }}>
                  <circle cx="90" cy="22" r="11" fill="#FFF275" stroke="#405FDA" strokeWidth="1.8" />
                  <path d="M84 22.5 l4.4 4.4 l8 -9" fill="none" stroke="#405FDA" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
              <Bubble x={1437} y={262} delay={6.5} text="We have a deal." sub="Kita sepakat." still={still} first={false} />

              {/* ================= 5. KANTOR TIM: kanban To do / Doing / Done ================= */}
              <svg style={box(1362, 439, 1514, 485)} viewBox="0 0 200 60" preserveAspectRatio="none">
                {[0, 1, 2].map((c) => (
                  <g key={c}>
                    <text x={8 + c * 64} y="9" fontSize="9.4" fontWeight="800" fill={c === 2 ? "#1B8A5A" : "#2B3FA8"} style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                      {["To do", "Doing", "Done"][c]}
                    </text>
                    <line x1={8 + c * 64} y1="12.5" x2={64 + c * 64} y2="12.5" stroke="#C9CEF0" strokeWidth="0.8" />
                    {c > 0 && <line x1={c * 64 + 2} y1="3" x2={c * 64 + 2} y2="58" stroke="#E4E7F7" strokeWidth="0.8" />}
                  </g>
                ))}
                {/* kartu diam di kolom To do */}
                {[18, 34].map((y) => (
                  <rect key={y} x="8" y={y} width="50" height="12" rx="2.4" fill="#E4E7F7" />
                ))}
                {/* dua kartu berpindah: To do -> Doing -> Done */}
                {[
                  { y: 46, c: "#405FDA", d: 0 },
                  { y: 18, c: "#FFD43B", d: -3 },
                ].map((k, i) => (
                  <g key={i} className="en-m-kan" style={{ opacity: still ? 1 : 0, transform: still ? `translateX(${i === 0 ? 128 : 64}px)` : undefined, animation: A(`en-s-kan 6s ease-in-out ${k.d}s infinite both`) }}>
                    <rect x="8" y={k.y} width="50" height="12" rx="2.4" fill={k.c} />
                    <rect x="12" y={k.y + 4.4} width="26" height="3" rx="1.5" fill="#FFFFFF" opacity="0.75" />
                  </g>
                ))}
              </svg>
              {[1308, 1375, 1471, 1532].map((x, i) => (
                <div
                  key={x}
                  className="en-m-pulse pointer-events-none"
                  style={{
                    ...box(x + 3, 484, x + 33, 501),
                    background: "rgba(140,185,255,0.5)",
                    opacity: still ? 0.5 : 0.3,
                    animation: A(`en-s-pulse ${2.4 + i * 0.4}s ease-in-out ${-i * 0.7}s infinite alternate`),
                  }}
                />
              ))}
              {[
                { n: "sit-a", cx: 1322 },
                { n: "sit-b", cx: 1388 },
                { n: "sit-c", cx: 1490 },
                { n: "sit-d", cx: 1555 },
              ].map((p, i) => {
                const wd = 44;
                return (
                  <Fragment key={p.n}>
                    <Shadow cx={p.cx} y={544} w={wd * 0.95} delay={0.7 + i * 0.28} still={still} />
                    <div
                      className="en-m-in absolute"
                      style={{ left: pw(p.cx - wd / 2), top: ph(545 - hOf(p.n, wd)), width: pw(wd), opacity: still ? 1 : 0, animation: A(`en-s-appear 0.5s ease-out ${0.7 + i * 0.28}s both`) }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/corp/${p.n}.webp`} alt="" draggable={false} className="block h-auto w-full max-w-none" style={{ filter: WARM }} />
                    </div>
                  </Fragment>
                );
              })}
              <Bubble x={1437} y={448} delay={9.5} text="Let's schedule a call." sub="Mari jadwalkan panggilan." still={still} first={false} />

              {/* ================= 6. ANALITIK: dashboard terang bergaya hero ================= */}
              <svg style={box(1339, 592, 1534, 659)} viewBox="0 0 233 81" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dash-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#F7F8FF" />
                    <stop offset="1" stopColor="#E2E7FF" />
                  </linearGradient>
                  <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#405FDA" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#405FDA" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="233" height="81" rx="3" fill="url(#dash-bg)" />
                <text x="10" y="14" fontSize="9" fontWeight="800" fill="#2B3FA8" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                  Growth
                </text>
                <rect x="196" y="5.5" width="28" height="12" rx="6" fill="#FFF275" />
                <path d="M205 13 l4 -4 l4 4 M209 9.4 v6.2" fill="none" stroke="#2B3FA8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                {[26, 38, 50].map((y) => (
                  <line key={y} x1="10" y1={y} x2="116" y2={y} stroke="#C9CEF0" strokeWidth="0.7" strokeDasharray="2 2" />
                ))}
                <path d="M10 54 L30 46 L48 50 L68 36 L88 30 L112 18 L112 58 L10 58 Z" fill="url(#dash-area)" />
                <path
                  className="en-m-line"
                  d="M10 54 L30 46 L48 50 L68 36 L88 30 L112 18"
                  fill="none"
                  stroke="#405FDA"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={still ? 0 : 1}
                  style={{ animation: A("en-s-line 7.4s ease-in-out infinite both") }}
                />
                <circle cx="112" cy="18" r="3.4" fill="#FFF275" stroke="#405FDA" strokeWidth="1.6" />
                {[14, 22, 18, 30, 26, 36].map((bh, i) => (
                  <rect
                    key={i}
                    className="en-m-bar"
                    x={128 + i * 9.4}
                    y={58 - bh}
                    width="6.4"
                    height={bh}
                    rx="1.4"
                    fill={i % 2 ? "#07A9F8" : "#405FDA"}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: A(`en-s-bar ${2.2 + (i % 3) * 0.5}s ease-in-out ${-i * 0.6}s infinite alternate both`) }}
                  />
                ))}
                <circle cx="206" cy="38" r="13" fill="none" stroke="#C9CEF0" strokeWidth="5" />
                <circle
                  className="en-m-ring"
                  cx="206"
                  cy="38"
                  r="13"
                  fill="none"
                  stroke="#405FDA"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={still ? 0.27 : 1}
                  transform="rotate(-90 206 38)"
                  style={{ animation: A("en-s-ring 6.2s ease-in-out infinite both") }}
                />
                <path d="M201 38.5 l3.4 3.4 l6 -7" fill="none" stroke="#2B3FA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="63" x2="225" y2="63" stroke="#C9CEF0" strokeWidth="0.8" />
                {[
                  { x: 10, l: "JKT", v: clocks?.jkt },
                  { x: 86, l: "LDN", v: clocks?.ldn },
                  { x: 162, l: "NYC", v: clocks?.nyc },
                ].map((c) => (
                  <text key={c.l} x={c.x} y="74.5" fontSize="8.6" fontWeight="800" fill="#2B3FA8" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                    {c.l}
                    <tspan fill="#363636" fontWeight="700" dx="4">
                      {c.v ?? "--:--"}
                    </tspan>
                  </text>
                ))}
              </svg>
              {[
                { n: "sit-b", cx: 1342 },
                { n: "sit-d", cx: 1537 },
              ].map((p, i) => {
                const wd = 44;
                return (
                  <Fragment key={p.cx}>
                    <Shadow cx={p.cx} y={721} w={wd * 0.95} delay={1.1 + i * 0.3} still={still} />
                    <div
                      className="en-m-in absolute"
                      style={{ left: pw(p.cx - wd / 2), top: ph(722 - hOf(p.n, wd)), width: pw(wd), opacity: still ? 1 : 0, animation: A(`en-s-appear 0.5s ease-out ${1.1 + i * 0.3}s both`) }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/corp/${p.n}.webp`} alt="" draggable={false} className="block h-auto w-full max-w-none" style={{ filter: COOL }} />
                    </div>
                  </Fragment>
                );
              })}

              {/* ================= LAMPU LIFT: naik-turun, berhenti tepat di tiap lantai ================= */}
              {[
                { x0: 410, x1: 440, dur: 20, d: -2 },
                { x0: 1229, x1: 1259, dur: 26, d: -13 },
              ].map((l, i) => (
                <div key={i} className="pointer-events-none absolute overflow-hidden" style={box(l.x0, SHAFT_TOP, l.x1, SHAFT_BOT)}>
                  <div
                    className="en-m-lift absolute"
                    style={
                      {
                        left: "10%",
                        top: 0,
                        width: "80%",
                        height: `${((CAB_H / (SHAFT_BOT - SHAFT_TOP)) * 100).toFixed(2)}%`,
                        borderRadius: 3,
                        background: "linear-gradient(#FFF8D8, #FFD36B)",
                        boxShadow: "0 0 10px 2px rgba(255,214,120,0.75), inset 0 0 0 1px rgba(255,255,255,0.7)",
                        ["--y0" as string]: cabPct(722),
                        ["--y1" as string]: cabPct(547),
                        ["--y2" as string]: cabPct(380),
                        transform: still ? `translateY(${cabPct(547)})` : undefined,
                        animation: A(`en-s-lift ${l.dur}s cubic-bezier(0.45,0,0.25,1) ${l.d}s infinite both`),
                      } as CSSProperties
                    }
                  >
                    <div className="absolute inset-y-[8%] left-1/2 w-px bg-[#C99A2E]/60" />
                  </div>
                </div>
              ))}

              {/* ================= LOBI ================= */}
              <div
                className="en-m-pulse pointer-events-none"
                style={{
                  ...box(700, 615, 972, 765),
                  background: "radial-gradient(closest-side, rgba(255,214,130,0.55), rgba(255,214,130,0))",
                  opacity: still ? 0.7 : 0.4,
                  animation: A("en-s-pulse 4.2s ease-in-out infinite alternate"),
                }}
              />
              <div className="pointer-events-none overflow-hidden" style={box(452, 600, 1222, 742)}>
                <div
                  className="en-m-glint absolute top-0 h-full"
                  style={{
                    left: 0,
                    width: "20%",
                    background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))",
                    transform: still ? "translateX(-130%)" : undefined,
                    animation: A("en-s-glint 17s ease-in-out infinite both"),
                  }}
                />
              </div>
              {/* dua profesional menunggu di depan pintu, dilihat dari belakang */}
              <Shadow cx={734} y={751} w={30} still={still} />
              <Sp n="stand-a" x={718} y={752 - hOf("stand-a", 32)} w={32} style={{ filter: WARM }} />
              <Shadow cx={955} y={751} w={28} still={still} />
              <Sp n="stand-b" x={940} y={752 - hOf("stand-b", 30)} w={30} style={{ filter: WARM }} />
              {/* bendera English Now berkibar di atap menara kanan: kain 16 potong tipis yang bergelombang berurutan supaya mulus */}
              {[1480].map((px) => (
                <div key={px} className="pointer-events-none">
                  <div style={{ ...box(px - 1.5, 90, px + 1.5, 160), background: "linear-gradient(90deg,#E8E4EE,#9A96A8)", borderRadius: 2 }} />
                  <div style={{ ...box(px - 3.5, 86, px + 3.5, 93), background: "#FFF275", borderRadius: 999 }} />
                  <div style={{ ...box(px + 1.5, 96, px + 85.5, 142), filter: still ? undefined : "drop-shadow(0 2px 2px rgba(8,14,70,0.3))" }}>
                    {Array.from({ length: 16 }, (_, i) => (
                      <div
                        key={i}
                        className="en-m-flag absolute"
                        style={{
                          left: `${(i * 100) / 16}%`,
                          top: 0,
                          width: "6.9%",
                          height: "100%",
                          backgroundColor: "#2B3FA8",
                          backgroundImage: "url(/brand/logo-full-white.png), linear-gradient(90deg, rgba(8,14,70,0.0), rgba(8,14,70,0.0))",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "1138% 62%, 100% 100%",
                          backgroundPosition: `${(((i * 5.25 - 9) / 60.2) * 100).toFixed(2)}% 50%, 0 0`,
                          filter: `brightness(${(0.88 + 0.12 * Math.cos((i / 16) * Math.PI * 3)).toFixed(3)})`,
                          transformOrigin: "left center",
                          willChange: "transform",
                          animation: A(`en-s-wave2 2.8s ease-in-out ${(-i * 0.16).toFixed(2)}s infinite`),
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* ================= LAMPU TAMAN ================= */}
              {lampX.map((x, i) => (
                <div
                  key={x}
                  className="en-m-pulse pointer-events-none"
                  style={{
                    ...box(x - 30, 712, x + 30, 768),
                    background: "radial-gradient(closest-side, rgba(255,214,120,0.8), rgba(255,214,120,0))",
                    opacity: still ? 0.8 : 0.5,
                    animation: A(`en-s-pulse ${3 + (i % 3) * 0.6}s ease-in-out ${-i * 0.8}s infinite alternate`),
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* lapisan gelap tipis di belakang teks supaya judul dan tombol selalu terbaca */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(62% 40% at 50% 36%, rgba(24,38,150,0.42), rgba(24,38,150,0) 72%)" }}
      />
      {/* transisi halus ke section di bawah hero */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%]"
        style={{ background: `linear-gradient(to bottom, rgba(251,246,238,0) 0%, rgba(222,217,226,0.38) 42%, rgba(251,246,238,0.88) 82%, ${NEXT_BG} 100%)` }}
      />
      {/* butiran halus supaya tidak terlalu mulus (gambar kecil yang diulang, tanpa blend mode supaya ringan) */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "url(/images/grain.webp)", backgroundSize: "160px 160px", opacity: 0.55 }} />
    </motion.div>
  );
}
