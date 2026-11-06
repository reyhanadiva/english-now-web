"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { articleContent, type Article } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { SafeImage } from "./ui/safe-image";

/**
 * Section Artikel (showcase). Tampil dalam satu layar di desktop; tata letak berbeda untuk tiap dunia:
 *  - Anak: panggung biru, tiga kartu foto (tengah paling besar) dengan panel putih di dalam foto,
 *    deretan kapsul kategori yang berjalan di belakang, awan bergeser, kartu miring mengikuti kursor.
 *  - Dewasa: artikel utama lebar dan tiga kartu; foto bergerak pelan, sorot cahaya mengikuti kursor.
 * Yang ditampilkan hanya 3 artikel (Anak) / 1 utama + 3 (Dewasa). Sisanya lewat tombol "Lihat semua".
 * Data dari `articleContent` (nanti dari admin).
 */
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(+d) ? "" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
};

export function ArticleSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = articleContent[audience];
  if (c.list.length === 0) return null;

  return (
    <section id="artikel" className="relative overflow-hidden" style={{ background: SECTION_BG[audience] }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="relative py-6 md:py-[3.5vh]"
        >
          {kids ? <KidsTrio c={c} reduce={reduce} /> : <Editorial c={c} reduce={reduce} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

type C = (typeof articleContent)["kids"];

/* ---------------- ANAK ---------------- */
function Arrow({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** kartu artikel: foto penuh, panel kaca kecil di bawah; kursor berubah jadi gelembung "Baca" supaya jelas bisa diklik */
function KidCard({ a, active, reduce, onPick }: { a: Article; active: boolean; reduce: boolean; onPick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, (v) => v * -7), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(px, (v) => v * 9), { stiffness: 140, damping: 16 });
  return (
    <motion.div
      ref={ref}
      className="h-full"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <Link
        href={a.href}
        data-sample={a.sample ? "true" : undefined}
        onClick={(e) => {
          if (!active) {
            e.preventDefault();
            onPick();
          }
        }}
        tabIndex={active ? 0 : -1}
        aria-label={a.title}
        className="group relative block h-full cursor-pointer overflow-hidden rounded-[1.5rem] bg-mist shadow-[0_28px_50px_-20px_rgba(8,14,70,0.75)] ring-4 ring-white/90 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-sun"
      >
        <SafeImage src={a.cover} alt="" fill sizes="(min-width:768px) 300px, 78vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute top-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[11px] font-extrabold tracking-wide text-cobalt-900 shadow-sm">{a.category}</span>
        <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/92 p-3 shadow-[0_12px_24px_-12px_rgba(8,14,70,0.6)] backdrop-blur-md">
          <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-bold tracking-[-0.01em] text-cobalt-900">{a.title}</h3>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink/55">{a.readMin ? `${a.readMin} menit baca` : ""}</span>
            <motion.span
              className="inline-flex items-center gap-1 rounded-full bg-cobalt px-3 py-1 text-[11px] font-bold text-white transition-colors group-hover:bg-cobalt-900"
              animate={active && !reduce ? { x: [0, 3, 0] } : undefined}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              Baca <Arrow className="size-3" />
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** awan yang melintas terus dari kiri ke kanan dengan kecepatan berbeda (CSS, otomatis berhenti di luar layar) */
const DRIFT = [
  { top: "30%", w: 150, o: 0.95, dur: 30, at: 0.1 },
  { top: "44%", w: 96, o: 0.7, dur: 44, at: 0.55 },
  { top: "52%", w: 120, o: 0.6, dur: 38, at: 0.8 },
  { top: "74%", w: 170, o: 0.8, dur: 34, at: 0.35 },
  { top: "88%", w: 100, o: 0.55, dur: 50, at: 0.9 },
];
function DriftClouds({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {DRIFT.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 120 50"
          className="en-m-drift absolute left-0 drop-shadow-[0_6px_10px_rgba(8,14,70,0.12)]"
          style={{ top: c.top, width: c.w, opacity: c.o, animation: reduce ? undefined : `en-drift ${c.dur}s linear ${-(c.dur * c.at).toFixed(1)}s infinite` }}
        >
          <path d="M15 40 a14 14 0 0 1 10-22 a18 18 0 0 1 33-6 a16 16 0 0 1 30 4 a12 12 0 0 1 17 24 z" fill="#fff" />
        </svg>
      ))}
    </div>
  );
}

/** unsur dari hero: pesawat berlampu kedip dan kawanan burung (memakai keyframe yang sama dengan hero, jadi pasti jalan) */
function SkyTraffic() {
  const birds = [
    { x: 0, y: 0, s: 26, d: 0 },
    { x: 34, y: -16, s: 21, d: -0.25 },
    { x: 66, y: 6, s: 23, d: -0.5 },
    { x: 98, y: -10, s: 19, d: -0.15 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
      <div className="en-m-plane absolute inset-0" style={{ animation: "en-s-fly-r 34s linear -6s infinite both" }}>
        <div className="absolute" style={{ left: 0, top: "33%", width: 92, height: 34 }}>
          <div className="absolute rounded-full" style={{ right: "92%", top: "46%", width: "230%", height: 2, background: "linear-gradient(270deg, rgba(255,255,255,0.55), rgba(255,255,255,0))" }} />
          <svg viewBox="0 0 44 16" className="absolute inset-0 h-full w-full">
            <path d="M2 8 L8 6.6 L34 6.6 Q40 6.6 43 8 Q40 9.4 34 9.4 L8 9.4 Z" fill="#F2F4FF" />
            <polygon points="17,7 27,7 21,1.4 18.6,1.4" fill="#D7DDFF" />
            <polygon points="3,7 9,7 6.6,2.2 4.4,2.2" fill="#D7DDFF" />
            <circle className="en-m-blink" cx="19.4" cy="1.5" r="1.3" fill="#FF4D4D" style={{ animation: "en-blink 1.6s linear infinite" }} />
            <circle className="en-m-blink" cx="5" cy="2.3" r="1.2" fill="#FFFFFF" style={{ animation: "en-blink 1.6s linear -0.8s infinite" }} />
          </svg>
        </div>
      </div>
      <div className="en-m-birds absolute inset-0" style={{ animation: "en-s-flock 40s linear -12s infinite both" }}>
        <div className="absolute" style={{ left: 0, top: "62%" }}>
          {birds.map((b, i) => (
            <svg key={i} viewBox="0 0 16 8" className="en-m-flap absolute" style={{ left: b.x, top: b.y, width: b.s, height: "auto", transformOrigin: "50% 100%", animation: `en-flap 0.9s ease-in-out ${b.d}s infinite` }}>
              <path d="M1 6 Q4.5 0.6 8 5 Q11.5 0.6 15 6" fill="none" stroke="#F4F6FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}

/** layang-layang (ikon merek): melayang naik-turun, ekor menempel di ujung bawah dan bergoyang (semua CSS) */
function FlyingKite() {
  return (
    <div aria-hidden className="pointer-events-none absolute top-[7%] right-[7%] hidden w-16 md:block lg:w-20">
      <div className="en-m-kite origin-bottom" style={{ animation: "en-kite 5s ease-in-out infinite" }}>
        <svg viewBox="0 0 40 80" className="w-full overflow-visible drop-shadow-[0_8px_10px_rgba(8,14,70,0.35)]">
          <g className="en-m-tail" style={{ transformOrigin: "20px 46px", animation: "en-tail 1.8s ease-in-out infinite" }}>
            <path d="M20 46 C12 52 28 58 20 64 C12 70 26 74 20 78" fill="none" stroke="#07A9F8" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M14 56 L20 59 L14 62 Z M26 68 L20 71 L26 74 Z" fill="#FFF275" />
          </g>
          <path d="M20 0 L35 17 L20 46 L5 17 Z" fill="#FFF275" stroke="#1E2F78" strokeWidth="2" strokeLinejoin="round" />
          <path d="M20 0 V46 M5 17 H35" stroke="#1E2F78" strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}

/** Batas tampilan: yang tampil selalu artikel TERBARU (urut tanggal), tidak peduli berapa banyak artikel yang ada. */
const KIDS_MAX = 5;
const ADULT_MAX = 4;
function newest(list: Article[], max: number) {
  return [...list].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, max);
}

function KidsTrio({ c: full, reduce }: { c: C; reduce: boolean }) {
  const c = { ...full, list: newest(full.list, KIDS_MAX) };
  const n = c.list.length;
  const start = Math.max(0, c.list.findIndex((a) => a.featured));
  const [active, setActive] = useState(start);
  const [paused, setPaused] = useState(false);
  const [mob, setMob] = useState(0);

  // putar otomatis tiap 5 detik; berhenti saat kursor di atas kartu atau gerak dikurangi
  useEffect(() => {
    if (reduce || paused || n < 2) return;
    const id = window.setInterval(() => setActive((v) => (v + 1) % n), 5000);
    return () => window.clearInterval(id);
  }, [reduce, paused, n]);

  const half = Math.floor(n / 2);
  const off = (i: number) => ((i - active + n + half) % n) - half;

  return (
    <div className="relative mx-3 max-w-6xl overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#3552D0] to-[#1E2F78] [container-type:inline-size] py-10 sm:mx-6 md:py-[clamp(1.5rem,4.5vh,3.2rem)] lg:mx-auto">
      <DriftClouds reduce={reduce} />
      <SkyTraffic />
      <FlyingKite />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-[2.4rem] leading-[1.03] text-balance md:text-[clamp(2rem,5.6vh,3.7rem)]">
          <span className="text-sun">{c.titleSoft}</span>
          <br />
          <span className="text-white [text-shadow:0_2px_0_rgba(8,14,70,0.35)]">{c.title}</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-white/85 md:mt-[1.2vh]">{c.sub}</p>
      </div>

      {/* desktop: kartu berputar, yang di tengah paling besar. Klik kartu samping untuk memajukannya. */}
      <div className="relative mt-8 hidden md:mt-[3.5vh] md:block" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        {/* cahaya lembut di belakang kartu fokus */}
        <motion.span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sun/25 blur-3xl" animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative mx-auto h-[clamp(17rem,45vh,26rem)] max-w-4xl">
          {n > 1 && (
            <>
              <button type="button" onClick={() => setActive((v) => (v - 1 + n) % n)} aria-label="Artikel sebelumnya" className="absolute top-1/2 left-1 z-10 grid size-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-cobalt-900 shadow-[0_8px_20px_-6px_rgba(8,14,70,0.6)] transition hover:scale-110 lg:-left-4">
                <Arrow className="size-5 rotate-180" />
              </button>
              <button type="button" onClick={() => setActive((v) => (v + 1) % n)} aria-label="Artikel berikutnya" className="absolute top-1/2 right-1 z-10 grid size-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-cobalt-900 shadow-[0_8px_20px_-6px_rgba(8,14,70,0.6)] transition hover:scale-110 lg:-right-4">
                <Arrow className="size-5" />
              </button>
            </>
          )}
          {c.list.map((a, i) => {
            const d = off(i);
            const vis = Math.abs(d) <= 1;
            return (
              <motion.div
                key={a.id}
                className="absolute top-0 left-1/2 h-full w-[clamp(14.5rem,23vw,17.5rem)]"
                initial={false}
                animate={{ x: `${-50 + d * 112}%`, scale: d === 0 ? 1 : 0.84, opacity: vis ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }}
                style={{ zIndex: d === 0 ? 3 : vis ? 2 : 0, pointerEvents: vis ? "auto" : "none" }}
                aria-hidden={!vis}
              >
                <div className="en-m-bob h-full" style={{ animation: `en-card-bob ${(3 + (i % 3) * 0.5).toFixed(1)}s ease-in-out ${(-i * 0.9).toFixed(1)}s infinite` }}>
                  <KidCard a={a} active={d === 0} reduce={reduce} onPick={() => setActive(i)} />
                </div>
              </motion.div>
            );
          })}
        </div>
        {n > 1 && (
          <div className="relative mt-4 flex justify-center gap-2" role="tablist" aria-label="Pilih artikel">
            {c.list.map((a, i) => (
              <button key={a.id} type="button" role="tab" aria-selected={i === active} aria-label={a.title} onClick={() => setActive(i)} className={`h-2.5 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-sun" : "w-2.5 bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
        )}
      </div>

      {/* HP: kartu bisa digeser */}
      <ul
        onScroll={(e) => {
          const el = e.currentTarget;
          const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
          setMob(Math.round(el.scrollLeft / (w + 16)));
        }}
        className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[14vw] pt-3 pb-4 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
      >
        {c.list.map((a) => (
          <li key={a.id} className="h-[22rem] w-[72vw] max-w-[17rem] shrink-0 snap-center">
            <KidCard a={a} active reduce={reduce} onPick={() => undefined} />
          </li>
        ))}
      </ul>

      <div className="relative flex justify-center gap-2 pb-3 md:hidden" aria-hidden>
        {c.list.map((a, i) => (
          <span key={a.id} className={`h-2.5 rounded-full transition-all duration-300 ${i === mob ? "w-7 bg-sun" : "w-2.5 bg-white/40"}`} />
        ))}
      </div>

      <div className="relative mt-2 text-center md:mt-[2.6vh]">
        <Link href={c.all.href} className="inline-flex rounded-full bg-sun px-7 py-3 font-display text-lg tracking-wide text-ink shadow-[0_5px_0_0_var(--color-sun-600)] transition-transform hover:-translate-y-0.5">
          {c.all.label}
        </Link>
      </div>
    </div>
  );
}

/* ---------------- DEWASA ---------------- */
const PILLS = ["bg-cobalt text-white", "bg-sky text-white", "bg-sun text-ink"];

/** pojok tanda bidik tipis di foto, bergaya editorial */
function Corners() {
  const k = "absolute size-3.5 border-white/80";
  return (
    <span aria-hidden className="pointer-events-none absolute inset-3">
      <span className={`${k} top-0 left-0 border-t-2 border-l-2`} />
      <span className={`${k} top-0 right-0 border-t-2 border-r-2`} />
      <span className={`${k} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${k} right-0 bottom-0 border-r-2 border-b-2`} />
    </span>
  );
}

/** sorot cahaya lembut yang mengikuti kursor di atas foto */
const trackSpot = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
const Spot = () => (
  <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.32), transparent 65%)" } as CSSProperties} />
);

function Editorial({ c, reduce }: { c: C; reduce: boolean }) {
  const list = newest(c.list, ADULT_MAX);
  const lead = list.find((a) => a.featured) ?? list[0];
  const rest = list.filter((a) => a !== lead).slice(0, ADULT_MAX - 1);
  const leadMeta = [lead.author && `Oleh ${lead.author}`, fmtDate(lead.date), lead.readMin ? `${lead.readMin} menit baca` : ""].filter(Boolean).join(" · ");
  return (
    <div className="relative mx-auto max-w-6xl px-5">
      {/* bola warna lembut yang melayang pelan di belakang */}
      <motion.span aria-hidden className="pointer-events-none absolute -top-10 -left-24 size-80 rounded-full bg-[#F4B48F]/25 blur-3xl" animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.span aria-hidden className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-cobalt/10 blur-3xl" animate={reduce ? undefined : { x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance md:text-[clamp(2rem,5.2vh,3.3rem)]">
            <span className="text-cobalt">{c.titleSoft}</span> <span className="text-cobalt-900">{c.title}</span>
          </h2>
          <p className="mt-2 max-w-xl text-base text-ink/65">{c.sub}</p>
        </div>
        <Link href={c.all.href} className="group inline-flex items-center gap-2 rounded-full bg-[#14206B] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
          {c.all.label}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="relative mt-6 md:mt-[2.6vh]"
      >
        <Link href={lead.href} onPointerMove={trackSpot} className="group relative grid overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_-30px_rgba(20,32,107,0.45)] ring-1 ring-cobalt-900/8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-28px_rgba(20,32,107,0.6)] hover:ring-cobalt/40 md:h-[clamp(13rem,35vh,21rem)] md:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden bg-mist md:aspect-auto">
            <div className="en-m-kb absolute inset-0" style={{ animation: reduce ? undefined : "en-kb 20s ease-in-out infinite alternate" }}>
              <SafeImage src={lead.cover} alt="" fill sizes="(min-width:768px) 560px, 100vw" className="object-cover" />
            </div>
            <Spot />
            <Corners />
          </div>
          <div className="relative flex flex-col overflow-hidden p-6 md:p-[clamp(1.25rem,3.4vh,2.4rem)]">
            <span className="relative flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-cobalt uppercase"><span aria-hidden className="h-px w-7 bg-cobalt" />Pilihan</span>
            <h3 className="relative mt-3 text-[1.6rem] leading-[1.12] font-semibold tracking-[-0.03em] text-cobalt-900 md:text-[clamp(1.5rem,3.6vh,2.2rem)]">{lead.title}</h3>
            {lead.excerpt && <p className="relative mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink/65">{lead.excerpt}</p>}
            <span className="relative mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#14206B] px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-cobalt">
              Baca artikel <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
            <div className="relative mt-auto flex items-end justify-between gap-3 pt-4">
              <p className="text-[13px] text-ink/55">{leadMeta}</p>
              <span className="shrink-0 rounded-full bg-cobalt px-3 py-1 text-xs font-bold text-white">{lead.category}</span>
            </div>
          </div>
        </Link>
      </motion.div>

      <ul className="relative mt-5 grid gap-5 sm:grid-cols-3 md:mt-[2.4vh]">
        {rest.map((a, i) => (
          <motion.li
            key={a.id}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, delay: 0.08 + i * 0.09 }}
          >
            <Link href={a.href} onPointerMove={trackSpot} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist md:aspect-auto md:h-[clamp(8.5rem,21vh,12.5rem)]">
                <SafeImage src={a.cover} alt="" fill sizes="(min-width:640px) 360px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <Spot />
                <Corners />
                <span aria-hidden className="absolute right-3 bottom-3 translate-y-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-cobalt-900 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">Baca →</span>
              </div>
              <div className="mt-2.5 flex items-start justify-between gap-3">
                <h3 className="text-[1rem] leading-snug font-semibold tracking-[-0.01em] text-cobalt-900 transition-colors group-hover:text-cobalt">{a.title}</h3>
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${PILLS[i % PILLS.length]}`}>{a.category}</span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
