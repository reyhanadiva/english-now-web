"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
const TOP_COLOR = "#3D5FE7";
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
  [90, 172, 488, 385], // 0 ruang rapat
  [1187, 172, 1585, 385], // 1 negosiasi
  [90, 400, 488, 585], // 2 video call
  [1187, 400, 1585, 585], // 3 kantor tim
  [90, 600, 488, 790], // 4 kelas English
  [1187, 603, 1585, 790], // 5 analitik
  [548, 605, 1127, 806], // 6 lobi
];

/** area langit di luar badan gedung (untuk awan rendah); awan rendah selalu di y >= 170 supaya tidak menyentuh atap */
const SKY_POLY = [
  [-900, -600], [2572, -600], [2572, 735], [1607, 735], [1607, 126], [1127, 126], [1127, 566],
  [548, 566], [548, 126], [65, 126], [65, 735], [-900, 735],
]
  .map(([x, y]) => `${((x / IMG_W) * 100).toFixed(2)}% ${((y / IMG_H) * 100).toFixed(2)}%`)
  .join(", ");
/** pita langit di atas atap gedung: awan tinggi dan burung/pesawat hanya di sini (tidak pernah memotong parapet) */
const HIGH_POLY = [[-900, -600], [2572, -600], [2572, 118], [-900, 118]]
  .map(([x, y]) => `${((x / IMG_W) * 100).toFixed(2)}% ${((y / IMG_H) * 100).toFixed(2)}%`)
  .join(", ");

/* ---------- gelembung bahasa Inggris + artinya ---------- */
function Bubble({ x, y, delay, label, text, sub, still, first }: { x: number; y: number; delay: number; label: string; text: string; sub: string; still: boolean; first: boolean }) {
  return (
    <div className="pointer-events-none absolute z-20" style={{ left: pw(x), top: ph(y), transform: "translate(-50%, -100%)", width: "max-content" }}>
      <span
        className="en-m-say relative block rounded-[0.7em] bg-white/96 px-[0.7em] pt-[0.42em] pb-[0.46em] text-left whitespace-nowrap text-[#14206B] shadow-[0_8px_22px_-8px_rgba(5,10,60,0.7)]"
        style={{
          fontSize: `max(11px, ${cq(17)})`,
          opacity: still ? (first ? 1 : 0) : 0,
          transformOrigin: "50% 100%",
          animation: still ? undefined : `en-s-say ${CYCLE}s ease-out ${delay}s infinite both`,
        }}
      >
        <span className="mb-[0.3em] inline-block rounded-[0.35em] bg-[#405FDA] px-[0.5em] py-[0.08em] text-[0.5em] font-extrabold tracking-[0.14em] text-white uppercase">{label}</span>
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
    <svg viewBox="0 0 140 14" className="block h-full w-full" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${i * 28} 0)`}>
          <rect x="0" y="1" width="27" height="11" rx="2.4" fill="#E8ECFF" />
          <rect x="0" y="9.4" width="27" height="2.4" fill="#405FDA" />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={3 + k * 6} y="3" width="4" height="4" rx="0.8" fill="#FFE59A" />
          ))}
        </g>
      ))}
      <path d="M136 1 h2 q3 1 3 5 v5.4 h-5 z" fill="#E8ECFF" />
      <circle cx="139" cy="9" r="1.2" fill="#FFF8C8" />
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
    const s = Math.min(w / IMG_W, h / IMG_H) * 0.96;
    iw = IMG_W * s;
    ih = IMG_H * s;
  }
  const ox = (w - iw) / 2;
  const oy = h - ih;
  const pan = portrait ? Math.max(0, (iw - w) / 2) * 0.9 : 0;

  const A = (v: string) => (still ? undefined : v);
  const lampX = [98, 442, 568, 1105, 1267, 1580];

  /* posisi berhenti lampu lift tepat di lantai: bawah kabin = permukaan lantai (y) */
  const CAB_H = 46;
  const SHAFT_TOP = 178;
  const SHAFT_BOT = 792;
  const cabPct = (floorY: number) => `${(((floorY - CAB_H - SHAFT_TOP) / CAB_H) * 100).toFixed(1)}%`;

  /* ---- awan: 6 jenis, dua lapis kedalaman ---- */
  const highClouds = [
    { n: "cloud-1", w: 250, y: 20, dur: 240, d: -90, dir: "r", o: 0.95 },
    { n: "cirrus-1", w: 190, y: 52, dur: 170, d: -40, dir: "l", o: 0.85 },
    { n: "puff-2", w: 86, y: 48, dur: 130, d: -100, dir: "r", o: 0.9 },
    { n: "strat-2", w: 300, y: 78, dur: 200, d: -150, dir: "l", o: 0.8 },
    { n: "cloud-2", w: 200, y: 44, dur: 190, d: -60, dir: "l", o: 0.9 },
    { n: "pair", w: 120, y: 62, dur: 150, d: -20, dir: "r", o: 0.9 },
  ];
  const lowClouds = [
    { n: "cloud-2", w: 420, y: 250, dur: 300, d: -120, dir: "r", o: 0.82 },
    { n: "strat-1", w: 360, y: 470, dur: 240, d: -50, dir: "l", o: 0.78 },
    { n: "cirrus-2", w: 300, y: 340, dur: 260, d: -200, dir: "r", o: 0.72 },
    { n: "puff-1", w: 150, y: 210, dur: 200, d: -30, dir: "l", o: 0.88 },
    { n: "cloud-1", w: 360, y: 430, dur: 330, d: -250, dir: "l", o: 0.78 },
    { n: "strat-2", w: 260, y: 640, dur: 180, d: -90, dir: "r", o: 0.7 },
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.6 }}
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
                    style={{ animation: A(`${c.dir === "r" ? "en-s-cloud" : "en-s-cloud-l"} ${c.dur}s linear ${c.d}s infinite both`), opacity: c.o, transform: still ? `translateX(${[20, 60, 90, 40, 75, 10][i]}cqw)` : undefined }}
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
                <Skyline x0={-900} x1={65} seed={11} base={735} hMax={110} />
                <Skyline x0={1607} x1={2572} seed={23} base={735} hMax={110} />
                {lowClouds.map((c, i) => (
                  <div
                    key={i}
                    className="en-m-cloud absolute inset-0"
                    style={{ animation: A(`${c.dir === "r" ? "en-s-cloud" : "en-s-cloud-l"} ${c.dur}s linear ${c.d}s infinite both`), opacity: c.o, transform: still ? `translateX(${[40, 70, 20, 55, 85, 30][i]}cqw)` : undefined }}
                  >
                    <Sp n={c.n} x={0} y={c.y} w={c.w} />
                  </div>
                ))}
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
                      src="/images/corp/puff-2.webp"
                      alt=""
                      draggable={false}
                      className="absolute max-w-none"
                      style={{ left: 0, top: `${((wd.y - wd.r[1]) / (wd.r[3] - wd.r[1])) * 100}%`, width: `${(80 / (wd.r[2] - wd.r[0])) * 100}%`, height: "auto" }}
                    />
                  </div>
                </div>
              ))}

              {/* ================= KOTA JAUH DI CELAH TENGAH: skyline berkedip + kereta layang ================= */}
              <div className="pointer-events-none absolute overflow-hidden" style={box(548, 500, 1127, 604)}>
                <div className="absolute inset-0" style={{ transform: "none" }}>
                  <svg className="absolute inset-0 h-full w-full" viewBox="548 500 579 104" preserveAspectRatio="none" aria-hidden>
                    <rect x="548" y="597.6" width="579" height="2.4" fill="#3B4BB8" opacity="0.85" />
                  </svg>
                </div>
                <Skyline x0={556} x1={1119} seed={77} base={602} hMax={64} op={0.6} />
                {/* kereta A ke kanan, kereta B ke kiri */}
                {[
                  { dir: 1, delay: 1.5 },
                  { dir: -1, delay: 13.5 },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="en-m-train absolute"
                    style={
                      {
                        left: 0,
                        top: `${((584 - 500) / 104) * 100}%`,
                        width: `${(140 / 579) * 100}%`,
                        height: `${(14 / 104) * 100}%`,
                        ["--x0" as string]: t.dir === 1 ? "-110%" : "430%",
                        ["--x1" as string]: t.dir === 1 ? "430%" : "-110%",
                        transform: still ? (i === 0 ? "translateX(150%)" : "translateX(-300%)") : undefined,
                        opacity: still ? (i === 0 ? 1 : 0) : 1,
                        animation: A(`en-s-train 24s linear ${t.delay}s infinite both`),
                      } as CSSProperties
                    }
                  >
                    <div style={{ transform: t.dir === 1 ? undefined : "scaleX(-1)", height: "100%" }}>
                      <Train />
                    </div>
                  </div>
                ))}
              </div>

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
                  ...box(236, 206, 366, 260),
                  background: "radial-gradient(closest-side, rgba(255,214,120,0.85), rgba(255,214,120,0))",
                  opacity: still ? 0.7 : 0.5,
                  animation: A("en-s-pulse 3.2s ease-in-out infinite alternate"),
                }}
              />
              {/* pemimpin rapat berdiri di balik meja, menghadap jendela */}
              {(() => {
                const wd = 42;
                const hh = (wd * 309) / 122;
                return (
                  <div
                    className="en-m-in absolute"
                    style={{
                      left: pw(260 - wd / 2),
                      top: ph(345 - hh),
                      width: pw(wd),
                      clipPath: `inset(0 0 ${(((345 - 327) / hh) * 100).toFixed(1)}% 0)`,
                      opacity: still ? 1 : 0,
                      animation: A("en-s-appear 0.5s ease-out 0.4s both"),
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/corp/stand-a.webp" alt="" draggable={false} className="block h-auto w-full max-w-none" />
                  </div>
                );
              })()}
              <Bubble x={262} y={236} delay={0.5} label="Meeting" text="Shall we begin?" sub="Kita mulai sekarang?" still={still} first />

              {/* ================= 2. VIDEO CALL ================= */}
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
                      style={{ animation: A(`en-s-draw ${CYCLE}s ease-in-out ${3.5 + i * 0.35}s infinite both`) }}
                    />
                    <circle
                      className="en-m-draw"
                      cx={p.to[0]}
                      cy={p.to[1]}
                      r="2.3"
                      fill="#FFF275"
                      style={{ transformBox: "fill-box", transformOrigin: "center", opacity: still ? 1 : 0, animation: A(`en-s-pop ${CYCLE}s ease-out ${3.2 + i * 0.35}s infinite both`) }}
                    />
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
                    animation: A(`en-s-spk 3s linear ${i}s infinite both`),
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
              <Bubble x={290} y={438} delay={3.5} label="Video call" text="Can everyone hear me?" sub="Apakah suara saya terdengar?" still={still} first={false} />

              {/* ================= 3. KELAS ENGLISH: frasa + artinya ditulis cepat ================= */}
              <div className="pointer-events-none absolute" style={box(194, 648, 382, 714)}>
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
                    <span className="font-sans font-extrabold" style={{ fontSize: cq(17.5), lineHeight: 1.15, boxShadow: "inset 0 -0.34em 0 rgba(255,235,90,0.85)", padding: "0 0.12em" }}>
                      {l.t}
                    </span>
                    <span className="font-sans font-medium" style={{ fontSize: cq(10.5), marginTop: cq(5), color: "#4B58B0" }}>
                      {l.s}
                    </span>
                  </div>
                ))}
              </div>

              {/* ================= 4. NEGOSIASI: dua dokumen bertemu, centang Deal ================= */}
              <svg style={box(1300, 250, 1470, 360)} viewBox="0 0 170 110" preserveAspectRatio="none">
                <g className="en-m-card" style={{ opacity: still ? 1 : 0, animation: A(`en-s-cardl ${CYCLE}s ease-out 6.4s infinite both`) }}>
                  <polygon points="30,95 58,95 64,86 36,86" fill="#F6F7FF" stroke="#BFC6EE" strokeWidth="0.8" />
                  <line x1="38" y1="90" x2="55" y2="90" stroke="#9AA4DD" strokeWidth="1" />
                </g>
                <g className="en-m-card" style={{ opacity: still ? 1 : 0, animation: A(`en-s-cardr ${CYCLE}s ease-out 6.4s infinite both`) }}>
                  <polygon points="108,95 136,95 142,86 114,86" fill="#F6F7FF" stroke="#BFC6EE" strokeWidth="0.8" />
                  <line x1="116" y1="90" x2="133" y2="90" stroke="#9AA4DD" strokeWidth="1" />
                </g>
                <g className="en-m-pop" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: still ? 1 : 0, animation: A(`en-s-pop ${CYCLE}s ease-out 6.4s infinite both`) }}>
                  <circle cx="83" cy="22" r="11" fill="#FFF275" stroke="#405FDA" strokeWidth="1.8" />
                  <path d="M77 22.5 l4.4 4.4 l8 -9" fill="none" stroke="#405FDA" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
              <Bubble x={1385} y={238} delay={6.5} label="Negotiation" text="We have a deal." sub="Kita sepakat." still={still} first={false} />

              {/* ================= 5. KANTOR TIM: kanban To do / Doing / Done ================= */}
              <svg style={box(1285, 451, 1485, 511)} viewBox="0 0 200 60" preserveAspectRatio="none">
                {[0, 1, 2].map((c) => (
                  <g key={c}>
                    <text x={8 + c * 64} y="9" fontSize="7.6" fontWeight="800" fill={c === 2 ? "#1B8A5A" : "#2B3FA8"} style={{ fontFamily: "var(--font-sans), sans-serif" }}>
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
                    style={{ left: pw(p.cx - wd / 2), top: ph(584 - hOf(p.n, wd)), width: pw(wd), opacity: still ? 1 : 0, animation: A(`en-s-appear 0.5s ease-out ${0.7 + i * 0.28}s both`) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/corp/${p.n}.webp`} alt="" draggable={false} className="block h-auto w-full max-w-none" />
                  </div>
                );
              })}
              <Bubble x={1385} y={449} delay={9.5} label="Teamwork" text="Let's schedule a call." sub="Mari jadwalkan panggilan." still={still} first={false} />

              {/* ================= 6. ANALITIK: dashboard terang bergaya hero ================= */}
              <svg style={box(1269, 634, 1502, 715)} viewBox="0 0 233 81" preserveAspectRatio="none">
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
                  style={{ animation: A("en-s-line 5s ease-in-out infinite both") }}
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
                  style={{ animation: A("en-s-ring 5s ease-in-out infinite both") }}
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
                { n: "sit-b", cx: 1273 },
                { n: "sit-d", cx: 1503 },
              ].map((p, i) => {
                const wd = 52;
                return (
                  <div
                    key={p.cx}
                    className="en-m-in absolute"
                    style={{ left: pw(p.cx - wd / 2), top: ph(789 - hOf(p.n, wd)), width: pw(wd), opacity: still ? 1 : 0, animation: A(`en-s-appear 0.5s ease-out ${1.1 + i * 0.3}s both`) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/corp/${p.n}.webp`} alt="" draggable={false} className="block h-auto w-full max-w-none" />
                  </div>
                );
              })}

              {/* ================= LAMPU LIFT: naik-turun, berhenti tepat di tiap lantai ================= */}
              {[
                { x0: 503, x1: 543, dur: 20, d: -2 },
                { x0: 1132, x1: 1172, dur: 26, d: -13 },
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
                        ["--y0" as string]: cabPct(788),
                        ["--y1" as string]: cabPct(583),
                        ["--y2" as string]: cabPct(383),
                        transform: still ? `translateY(${cabPct(583)})` : undefined,
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
