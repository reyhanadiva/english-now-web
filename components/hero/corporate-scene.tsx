"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": foto sinematik jalan bisnis di jam biru sebagai dasar (layar penuh),
 * dihidupkan dengan lapisan animasi di atasnya. Semua posisi dalam koordinat gambar (persen),
 * jadi tetap menempel di benda yang sama di ukuran layar berapa pun.
 *  - Kamera maju sangat pelan ke titik hilang jalan.
 *  - Lampu jalan meredup-menyala (satu berkedip), pantulannya di jalan basah ikut berdenyut.
 *  - Mobil: lampu putih mendekat, lampu belakang merah menjauh, mengikuti perspektif jalan.
 *  - Langit: bintang berkedip, awan tipis, pesawat, burung, bintang jatuh, halo bulan.
 *  - Kilap kaca menyapu menara kaca dan badan kereta layang.
 *  - Gelembung obrolan bahasa Inggris menempel di atas orang-orang di foto, tampil sejak detik pertama.
 * Tanpa parallax kursor. Semua animasi berhenti saat hero keluar layar atau gerak dikurangi.
 */

const IMG_W = 2720;
const IMG_H = 1536;
const RATIO = IMG_W / IMG_H;
const SRC = {
  s: "/images/hero-corporate-1280.webp",
  m: "/images/hero-corporate-1920.webp",
  l: "/images/hero-corporate-2720.webp",
};

/** panggil saat idle supaya foto sudah di cache sebelum toggle Corporate dipilih */
export function preloadCorporateHero() {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.src = window.innerWidth < 900 ? SRC.m : SRC.l;
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

/* ---------- titik penting di foto (pecahan lebar/tinggi gambar) ---------- */
const VP = { x: 0.515, y: 0.72 }; // titik hilang jalan
const LAMPS = [
  { x: 0.0615, y: 0.35, r: 120, ground: { x: 0.055, y: 0.86 } },
  { x: 0.927, y: 0.341, r: 120, ground: { x: 0.93, y: 0.872 } },
  { x: 0.794, y: 0.54, r: 70 },
  { x: 0.286, y: 0.624, r: 60 },
  { x: 0.722, y: 0.598, r: 60 },
  { x: 0.24, y: 0.664, r: 46 },
];
const PEOPLE = {
  leftMan: { x: 0.753, y: 0.682 },
  woman: { x: 0.797, y: 0.695 },
  rightMan: { x: 0.837, y: 0.684 },
  cyclist: { x: 0.153, y: 0.69 },
};

/* ---------- gelembung obrolan ---------- */
type Tone = "white" | "cobalt" | "sun";
function Say({ text, tone, delay, cycle, first, label, narrow, still, bx = "-50%" }: { text: string; tone: Tone; delay: number; cycle: number; first: boolean; label?: string; narrow: boolean; still: boolean; bx?: string }) {
  const cls = tone === "cobalt" ? "bg-[#405FDA] text-white" : tone === "sun" ? "bg-[#FFF275] text-[#1B2570]" : "bg-white/95 text-[#14206B]";
  return (
    <span
      className={`en-m-say pointer-events-none absolute left-0 z-10 rounded-xl px-2.5 py-1 font-semibold whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] ${cls}`}
      style={{
        bottom: "calc(0px + 7px)",
        opacity: still && first ? 1 : 0,
        transform: `translateX(${bx})`,
        ["--bx" as string]: bx,
        fontSize: narrow ? 10.5 : 13,
        animation: still ? undefined : `en-say ${cycle}s ease-out ${delay}s infinite`,
      } as React.CSSProperties}
    >
      {label && <span className="mb-0.5 block text-[8.5px] font-bold tracking-[0.14em] uppercase opacity-70">{label}</span>}
      {text}
      <span className="absolute -bottom-1 size-2 rotate-45 bg-inherit" style={{ left: `calc(${bx.replace("-", "")} * 1)`, marginLeft: -4 }} />
    </span>
  );
}

/** titik jangkar di atas kepala seseorang (ukuran nol); gelembung muncul di atasnya */
function Anchor({ at, children }: { at: { x: number; y: number }; children: React.ReactNode }) {
  return (
    <div className="absolute" style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: 0, height: 0 }}>
      {children}
    </div>
  );
}

/* ---------- adegan ---------- */
export function CorporateScene() {
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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
  const narrow = w < 640;

  // gambar menutupi layar (cover), fokus bergantung ukuran layar
  const iw = Math.max(w, h * RATIO);
  const ih = iw / RATIO;
  const fx = narrow ? 0.72 : 0.5;
  const fy = 0.5;
  const ox = Math.min(0, Math.max(w - iw, w / 2 - fx * iw));
  const oy = Math.min(0, Math.max(h - ih, h / 2 - fy * ih));
  const U = iw / IMG_W; // 1 piksel gambar asli = U piksel layar

  // bintang di dalam langit yang kosong (antara menara kiri dan menara kanan)
  const stars = useMemo(() => {
    const r = rng(44);
    const pts: { x: number; y: number; s: number; set: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const upper = i < 16;
      pts.push({
        x: upper ? 0.315 + r() * 0.32 : 0.39 + r() * 0.23,
        y: upper ? 0.01 + r() * 0.14 : 0.15 + r() * 0.15,
        s: 0.8 + r() * 1.3,
        set: i % 2,
      });
    }
    return pts;
  }, []);

  const cars = useMemo(() => {
    // dx, dy dalam persen gambar dari titik hilang ke tepi bawah
    return [
      { kind: "head", tx: 0.3, dur: 13, delay: -2 },
      { kind: "head", tx: 0.4, dur: 15, delay: -9 },
      { kind: "head", tx: 0.34, dur: 17, delay: -13 },
      { kind: "tail", tx: 0.52, dur: 12, delay: -5 },
      { kind: "tail", tx: 0.6, dur: 14, delay: -11 },
      { kind: "tail", tx: 0.56, dur: 16, delay: -1 },
    ] as const;
  }, []);

  const ov = (dur: number, delay: number): React.CSSProperties => ({
    animation: reduce ? undefined : `en-twinkle ${dur}s ease-in-out ${delay}s infinite`,
    willChange: reduce ? undefined : "opacity",
  });

  const px = (v: number) => `${(v * U).toFixed(1)}px`;

  return (
    <motion.div
      ref={root}
      aria-hidden
      className={`absolute inset-0 z-[6] overflow-hidden ${inView ? "" : "en-paused"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.8 }}
      style={{ background: "linear-gradient(#1A3A9C, #3E5CB8 55%, #C98A8A 72%, #2A2438)" }}
    >
      {/* panggung gambar: semua anak memakai koordinat persen gambar */}
      <div
        className="en-m-push absolute"
        style={{
          left: ox,
          top: oy,
          width: iw,
          height: ih,
          transformOrigin: `${VP.x * 100}% ${VP.y * 100}%`,
          animation: reduce ? undefined : "en-push 40s ease-in-out infinite alternate",
          willChange: reduce ? undefined : "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={SRC.m}
          srcSet={`${SRC.s} 1280w, ${SRC.m} 1920w, ${SRC.l} 2720w`}
          sizes={`${Math.round(iw)}px`}
          alt=""
          draggable={false}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full max-w-none select-none"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity .8s ease" }}
        />

        {/* halo bulan */}
        <div
          className="en-m-pulse absolute rounded-full"
          style={{
            left: `${0.65 * 100}%`,
            top: `${0.077 * 100}%`,
            width: px(420),
            height: px(420),
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(255,246,214,.35) 0%, rgba(190,208,255,.12) 40%, transparent 70%)",
            animation: reduce ? undefined : "en-pulse 9s ease-in-out infinite",
            mixBlendMode: "screen",
          }}
        />

        {/* langit hidup: dipotong ke area langit yang kosong */}
        <div className="absolute overflow-hidden" style={{ left: "30.5%", top: 0, width: "34%", height: "30%" }}>
          {[0, 1].map((set) => (
            <svg key={set} viewBox="0 0 340 300" preserveAspectRatio="none" className="en-m-ov absolute inset-0 h-full w-full" style={ov(3.2 + set * 1.7, set * 1.2)}>
              {stars
                .filter((s) => s.set === set)
                .map((s, i) => (
                  <circle key={i} cx={((s.x - 0.305) / 0.34) * 340} cy={(s.y / 0.3) * 300} r={s.s} fill="#fff" />
                ))}
            </svg>
          ))}
          {!reduce && (
            <>
              {/* awan tipis berjalan */}
              {[
                { y: 0.35, dur: 120, d: -20, o: 0.16, wd: 1.1 },
                { y: 0.7, dur: 160, d: -90, o: 0.12, wd: 1.5 },
              ].map((c, i) => (
                <div
                  key={i}
                  className="en-m-cloud absolute"
                  style={{
                    top: `${c.y * 100}%`,
                    left: 0,
                    width: `${c.wd * 100}%`,
                    height: "14%",
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(255,205,200,.9) 0%, rgba(255,205,200,0) 70%)",
                    opacity: c.o,
                    animation: `en-cloud-box ${c.dur}s linear ${c.d}s infinite`,
                  }}
                />
              ))}
              {/* pesawat melintas */}
              <div className="en-m-plane absolute left-0" style={{ top: "34%", animation: "en-plane-box 46s linear 3s infinite", width: "100%" }}>
                <svg width="150" height="14" viewBox="-130 -7 150 14" style={{ overflow: "visible" }}>
                  <path d="M0 0 L-120 0" stroke="#fff" strokeOpacity=".2" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M0 0 L9 -1.2 L12 0 L9 1.2Z M3.5 0 L1 -4.5 L2.6 -4.5 L6 0Z M3.5 0 L1 4.5 L2.6 4.5 L6 0Z" fill="#E8EDFF" opacity=".9" />
                  <circle className="en-m-blink" cx="0" cy="0" r="1.5" fill="#FF5A5A" style={{ animation: "en-blink 1.6s linear infinite" }} />
                </svg>
              </div>
              {/* sekawanan burung */}
              <div className="en-m-bird absolute left-0" style={{ top: "58%", animation: "en-plane-box 58s linear -20s infinite", width: "100%" }}>
                <svg width="90" height="30" viewBox="0 0 90 30">
                  {[0, 1, 2, 3].map((j) => (
                    <path
                      key={j}
                      className="en-m-flap"
                      d={`M${8 + j * 18} ${14 + (j % 2 ? 6 : -3)} q3 -4 6 0 q3 -4 6 0`}
                      fill="none"
                      stroke="#0B1445"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: `en-flap 0.55s ease-in-out ${j * 0.1}s infinite` }}
                    />
                  ))}
                </svg>
              </div>
              {/* bintang jatuh */}
              <div className="en-m-shoot absolute" style={{ left: "62%", top: "8%", opacity: 0, animation: "en-shoot 19s linear 4s infinite" }}>
                <svg width="56" height="28" viewBox="0 0 56 28">
                  <path d="M54 2 L6 26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".9" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* kilap kaca menyapu menara kiri & kanan, dan badan kereta layang */}
        {!reduce &&
          [
            { l: 0, t: 0, w: 0.3, h: 0.5, d: 0, dur: 12 },
            { l: 0.75, t: 0, w: 0.25, h: 0.46, d: -5, dur: 14 },
            { l: 0.268, t: 0.527, w: 0.475, h: 0.04, d: -2, dur: 9 },
          ].map((g, i) => (
            <div key={i} className="absolute overflow-hidden" style={{ left: `${g.l * 100}%`, top: `${g.t * 100}%`, width: `${g.w * 100}%`, height: `${g.h * 100}%` }}>
              <div
                className="en-m-glint absolute inset-y-0 left-0"
                style={{
                  width: "30%",
                  background: "linear-gradient(90deg, transparent, rgba(190,215,255,.28), transparent)",
                  mixBlendMode: "screen",
                  animation: `en-glint ${g.dur}s ease-in-out ${g.d}s infinite`,
                }}
              />
            </div>
          ))}

        {/* lampu jalan: meredup-menyala, pantulannya ikut berdenyut */}
        {LAMPS.map((l, i) => {
          const anim = reduce ? undefined : i % 3 === 2 ? `en-flicker ${7 + i}s linear ${-i}s infinite` : `en-lamp ${4 + (i % 3) * 1.4}s ease-in-out ${-i * 0.8}s infinite`;
          return (
            <div key={i} className="en-m-lamp" style={{ animation: anim, willChange: reduce ? undefined : "opacity" }}>
              <div
                className="absolute rounded-full"
                style={{
                  left: `${l.x * 100}%`,
                  top: `${l.y * 100}%`,
                  width: px(l.r * 3),
                  height: px(l.r * 3),
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(255,226,150,.65) 0%, rgba(255,200,110,.22) 38%, transparent 70%)",
                  mixBlendMode: "screen",
                }}
              />
              {l.ground && (
                <div
                  className="absolute"
                  style={{
                    left: `${l.ground.x * 100}%`,
                    top: `${l.ground.y * 100}%`,
                    width: px(70),
                    height: px(360),
                    transform: "translateX(-50%)",
                    background: "linear-gradient(to bottom, rgba(255,205,120,.4), rgba(255,205,120,0))",
                    mixBlendMode: "screen",
                    filter: "blur(6px)",
                  }}
                />
              )}
            </div>
          );
        })}

        {/* mobil di jalan: lampu putih mendekat, lampu belakang merah menjauh (mengikuti perspektif) */}
        {!reduce &&
          cars.map((c, i) => {
            const dx = (c.tx - VP.x) * iw;
            const dy = (1.02 - VP.y) * ih;
            const head = c.kind === "head";
            const col = head ? "255,244,210" : "255,60,60";
            return (
              <div
                key={i}
                className="en-m-car absolute"
                style={{
                  left: `${VP.x * 100}%`,
                  top: `${VP.y * 100}%`,
                  width: 0,
                  height: 0,
                  ["--dx" as string]: `${dx}px`,
                  ["--dy" as string]: `${dy}px`,
                  animation: `${head ? "en-approach" : "en-recede"} ${c.dur}s ${head ? "cubic-bezier(.55,.1,.9,.55)" : "cubic-bezier(.1,.45,.45,.95)"} ${c.delay}s infinite`,
                  willChange: "transform, opacity",
                } as React.CSSProperties}
              >
                {[-1, 1].map((s) => (
                  <div
                    key={s}
                    className="absolute rounded-full"
                    style={{
                      left: px(s * 56),
                      top: 0,
                      width: px(46),
                      height: px(46),
                      transform: "translate(-50%, -50%)",
                      background: `radial-gradient(circle, rgba(${col},1) 0%, rgba(${col},.55) 35%, rgba(${col},0) 70%)`,
                      mixBlendMode: "screen",
                    }}
                  />
                ))}
                <div
                  className="absolute"
                  style={{
                    left: 0,
                    top: px(20),
                    width: px(150),
                    height: px(260),
                    transform: "translateX(-50%)",
                    background: `radial-gradient(ellipse 50% 100% at 50% 0%, rgba(${col},.42), rgba(${col},0) 72%)`,
                    filter: "blur(4px)",
                    mixBlendMode: "screen",
                  }}
                />
              </div>
            );
          })}

        {/* obrolan bahasa Inggris di atas orang-orang di foto (tampil sejak detik pertama) */}
        <Anchor at={PEOPLE.leftMan}>
          <Say text={narrow ? "Shall we start?" : "Shall we review the proposal?"} tone="white" delay={-0.8} cycle={16} first narrow={narrow} still={reduce} bx={narrow ? "-50%" : "-82%"} />
        </Anchor>
        <Anchor at={PEOPLE.woman}>
          <Say text={narrow ? "Of course!" : "Of course. I've sent the draft."} tone="cobalt" delay={3.4} cycle={16} first={false} narrow={narrow} still={reduce} />
          <Say text="Polite & clear: “Shall we…?”" label="English Now tip" tone="sun" delay={11.8} cycle={16} first={false} narrow={narrow} still={reduce} />
        </Anchor>
        {!narrow && (
          <>
            <Anchor at={PEOPLE.rightMan}>
              <Say text="Great. Let's finalize it today." tone="white" delay={7.6} cycle={16} first={false} narrow={narrow} still={reduce} bx="-18%" />
            </Anchor>
            <Anchor at={PEOPLE.cyclist}>
              <Say text="Excuse me!" tone="white" delay={-0.3} cycle={10} first narrow={narrow} still={reduce} />
            </Anchor>
          </>
        )}
      </div>

      {/* menjaga keterbacaan teks: gelap tipis di atas & di belakang kolom teks, vinyet halus */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(4,8,38,.55) 0%, rgba(4,8,38,.12) 34%, transparent 52%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 46% 34% at 50% 36%, rgba(5,10,50,.38), transparent 72%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(0,0,0,.4) 100%)" }} />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          opacity: 0.07,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")",
        }}
      />
    </motion.div>
  );
}
