"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { articleContent, type Article } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { KidsClouds } from "./ornaments";
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
const ICON_BG = ["#EBDDFF", "#FFF1C9", "#DDEBFF"];
function CardIcon({ i }: { i: number }) {
  const p = { fill: "none", stroke: "#405FDA", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: ICON_BG[i % 3] }}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        {i % 3 === 0 && <path {...p} d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5v-15Zm16 0A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5v-15Z" />}
        {i % 3 === 1 && <path {...p} d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />}
        {i % 3 === 2 && <path {...p} d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />}
      </svg>
    </span>
  );
}

function KidCard({ a, i, reduce, delay }: { a: Article; i: number; reduce: boolean; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, (v) => v * -7), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(px, (v) => v * 9), { stiffness: 140, damping: 16 });
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 50, rotate: i % 2 ? 4 : -4 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 90, damping: 14, delay }}
      className="h-full"
      style={{ perspective: 900 }}
    >
      {/* melayang pelan, tiap kartu dengan irama sendiri */}
      <motion.div className="h-full" animate={reduce ? undefined : { y: [0, -7, 0] }} transition={{ duration: 4.2 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}>
        <motion.div
          ref={ref}
          className="h-full"
          style={{ rotateX: rx, rotateY: ry }}
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
            className="group relative block h-full overflow-hidden rounded-[1.5rem] bg-mist shadow-[0_28px_50px_-20px_rgba(8,14,70,0.75)] ring-4 ring-white/90 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-sun"
          >
            <SafeImage src={a.cover} alt="" fill sizes="(min-width:768px) 380px, 78vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute top-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[11px] font-extrabold tracking-wide text-cobalt-900 shadow-sm">{a.category}</span>
            <div className="absolute inset-x-3 bottom-3 flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-[0_12px_24px_-12px_rgba(8,14,70,0.6)]">
              <CardIcon i={i} />
              <div className="min-w-0">
                <h3 className="font-display text-[1.08rem] leading-[1.1] text-cobalt-900">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink/60">{a.excerpt}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const TONES = ["linear-gradient(135deg,#FFF275,#F5B83A)", "linear-gradient(135deg,#07A9F8,#405FDA)", "linear-gradient(135deg,#07A9F8,#7FD6A8)", "linear-gradient(135deg,#405FDA,#B9AAF2)"];

/** deretan kapsul kategori yang berjalan di belakang kartu (gaya yang sama dengan section Coba Gratis) */
function CapsuleBand({ words, reduce }: { words: string[]; reduce: boolean }) {
  const base = words.length ? words : ["Artikel"];
  const list = [...base, ...base, ...base, ...base];
  const row = (rev: boolean, off: number) => (
    <div className="flex w-max gap-3" style={{ animation: reduce ? undefined : `wall-${rev ? "right" : "left"} ${rev ? 70 : 56}s linear infinite` }}>
      {[...list, ...list].map((w, i) => (
        <span key={i} className={`flex h-11 shrink-0 items-center rounded-full px-6 font-display text-xl sm:h-14 sm:px-8 sm:text-2xl ${(i + off) % 4 === 0 ? "text-cobalt-900" : (i + off) % 4 === 2 ? "text-cobalt-900" : "text-white"}`} style={{ background: TONES[(i + off) % TONES.length] }}>
          {w}
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-[40%] -rotate-3 flex-col gap-3 opacity-80">
      {row(false, 0)}
      {row(true, 2)}
    </div>
  );
}

function KidsTrio({ c, reduce }: { c: C; reduce: boolean }) {
  const center = c.list.find((a) => a.featured) ?? c.list[Math.min(1, c.list.length - 1)];
  const others = c.list.filter((a) => a !== center).slice(0, 2);
  const trio = [others[0], center, others[1]].filter(Boolean) as Article[];
  const mobile = [center, ...others];
  const cats = Array.from(new Set(c.list.map((a) => a.category)));
  return (
    <div className="relative mx-3 max-w-6xl overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#3552D0] to-[#1E2F78] py-10 sm:mx-6 md:py-[clamp(1.5rem,4.5vh,3.2rem)] lg:mx-auto">
      <KidsClouds className="inset-0 opacity-90" />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-[2.4rem] leading-[1.03] text-balance md:text-[clamp(2rem,5.6vh,3.7rem)]">
          <span className="text-sun">{c.titleSoft}</span>
          <br />
          <span className="text-white [text-shadow:0_2px_0_rgba(8,14,70,0.35)]">{c.title}</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-white/85 md:mt-[1.2vh]">{c.sub}</p>
      </div>

      {/* desktop: tiga kartu, tengah paling besar, kapsul berjalan di belakang */}
      <div className="relative mt-8 hidden md:mt-[3.5vh] md:block">
        <CapsuleBand words={cats} reduce={reduce} />
        <div className="relative mx-auto grid h-[clamp(17rem,46vh,27rem)] max-w-4xl grid-cols-[1fr_1.18fr_1fr] items-center gap-6 px-8">
          {trio.map((a, i) => {
            const mid = a === center && trio.length === 3;
            return (
              <div key={a.id} className={mid ? "h-full" : "h-[84%]"}>
                <KidCard a={a} i={i} reduce={reduce} delay={i * 0.1} />
              </div>
            );
          })}
        </div>
      </div>

      {/* HP: kartu bisa digeser */}
      <ul className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-3 pb-6 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {mobile.map((a, i) => (
          <li key={a.id} className="h-[24rem] w-[76vw] max-w-[19rem] shrink-0 snap-center">
            <KidCard a={a} i={i} reduce={reduce} delay={Math.min(i, 3) * 0.06} />
          </li>
        ))}
      </ul>

      <div className="relative mt-2 text-center md:mt-[3.5vh]">
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
  const lead = c.list.find((a) => a.featured) ?? c.list[0];
  const rest = c.list.filter((a) => a !== lead).slice(0, 3);
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
        <Link href={lead.href} onPointerMove={trackSpot} className="group relative grid overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_-30px_rgba(20,32,107,0.45)] ring-1 ring-cobalt-900/8 md:h-[clamp(13rem,35vh,21rem)] md:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden bg-mist md:aspect-auto">
            <div className="en-m-kb absolute inset-0" style={{ animation: reduce ? undefined : "en-kb 20s ease-in-out infinite alternate" }}>
              <SafeImage src={lead.cover} alt="" fill sizes="(min-width:768px) 560px, 100vw" className="object-cover" />
            </div>
            <Spot />
            <Corners />
          </div>
          <div className="relative flex flex-col overflow-hidden p-6 md:p-[clamp(1.25rem,3.4vh,2.4rem)]">
            <span aria-hidden className="pointer-events-none absolute -right-2 -bottom-8 text-[8rem] leading-none font-bold tracking-tighter text-cobalt/[0.07] select-none">01</span>
            <span className="relative flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-cobalt uppercase"><span aria-hidden className="h-px w-7 bg-cobalt" />Pilihan</span>
            <h3 className="relative mt-3 text-[1.6rem] leading-[1.12] font-semibold tracking-[-0.03em] text-cobalt-900 md:text-[clamp(1.5rem,3.6vh,2.2rem)]">{lead.title}</h3>
            {lead.excerpt && <p className="relative mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink/65">{lead.excerpt}</p>}
            <div className="relative mt-auto flex items-end justify-between gap-3 pt-5">
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
