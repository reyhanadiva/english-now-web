"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { articleContent, type Article } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { SafeImage } from "./ui/safe-image";

/**
 * Section Artikel (showcase). Tata letak berbeda untuk tiap dunia:
 *  - Anak: tiga kartu foto berjajar, kartu tengah lebih besar; panel putih di bawah foto memuat judul.
 *  - Dewasa: artikel utama lebar (foto + teks) dan tiga kartu foto di bawahnya.
 * Data dari `articleContent` (nanti dari admin). Kolom opsional yang kosong tidak ditampilkan.
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
          className="relative pt-6 pb-14 sm:pt-8 sm:pb-20"
        >
          {kids ? <KidsTrio c={c} reduce={reduce} /> : <Editorial c={c} reduce={reduce} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

type C = (typeof articleContent)["kids"];

/* ---------------- ANAK: panggung biru, tiga kartu miring, tengah paling besar ---------------- */
const CHIP = ["bg-sun text-ink", "bg-sky text-white", "bg-[#FFB48F] text-ink"];

function KidCard({ a, i, big, reduce, delay }: { a: Article; i: number; big?: boolean; reduce: boolean; delay: number }) {
  const tilt = big ? 0 : i === 0 ? -2.5 : 2.5;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 36, rotate: tilt * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay }}
      className="h-full"
    >
      <Link
        href={a.href}
        data-sample={a.sample ? "true" : undefined}
        className="group relative block h-full overflow-hidden rounded-[1.9rem] bg-white shadow-[0_10px_0_0_rgba(8,14,70,0.35),0_30px_50px_-20px_rgba(8,14,70,0.7)] ring-[5px] ring-white transition-transform duration-300 hover:-translate-y-2 hover:!rotate-0 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-sun"
      >
        <SafeImage src={a.cover} alt="" fill sizes="(min-width:768px) 380px, 78vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 bg-white px-5 pt-5 pb-4">
          <span className={`absolute -top-4 left-5 -rotate-2 rounded-full px-3.5 py-1 font-display text-sm tracking-wide shadow-[0_3px_0_0_rgba(0,0,0,0.15)] ${CHIP[i % CHIP.length]}`}>{a.category}</span>
          <h3 className={`font-display leading-[1.1] text-cobalt-900 ${big ? "text-[1.55rem]" : "text-[1.25rem]"}`}>{a.title}</h3>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="line-clamp-2 text-[13px] leading-snug text-ink/60">{a.excerpt}</p>
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-lg font-bold text-ink shadow-[0_3px_0_0_var(--color-sun-600)] transition-transform duration-300 group-hover:translate-x-1">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Doodles({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className="absolute -top-24 -left-20 size-72 rounded-full bg-sky/40 blur-3xl" />
      <span className="absolute -right-24 -bottom-28 size-80 rounded-full bg-sun/25 blur-3xl" />
      {[
        { x: "8%", y: "16%", s: 26, d: 0 },
        { x: "90%", y: "12%", s: 20, d: -1.1 },
        { x: "5%", y: "70%", s: 18, d: -2 },
        { x: "94%", y: "62%", s: 28, d: -0.6 },
        { x: "76%", y: "88%", s: 16, d: -1.6 },
      ].map((st, i) => (
        <svg key={i} viewBox="0 0 24 24" className="en-m-tw absolute" style={{ left: st.x, top: st.y, width: st.s, height: st.s, animation: reduce ? undefined : `en-twinkle ${2.6 + (i % 3) * 0.7}s ease-in-out ${st.d}s infinite` }}>
          <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="#FFF275" />
        </svg>
      ))}
      <svg viewBox="0 0 120 20" className="absolute top-8 right-[16%] hidden w-28 md:block" fill="none" stroke="#FFF275" strokeWidth="4" strokeLinecap="round">
        <path d="M4 12 q10 -12 20 0 t20 0 t20 0 t20 0 t20 0" />
      </svg>
      <svg viewBox="0 0 120 20" className="absolute bottom-10 left-[14%] hidden w-24 md:block" fill="none" stroke="#7FD4FF" strokeWidth="4" strokeLinecap="round">
        <path d="M4 12 q10 -12 20 0 t20 0 t20 0 t20 0 t20 0" />
      </svg>
    </div>
  );
}

function KidsTrio({ c, reduce }: { c: C; reduce: boolean }) {
  const list = c.list;
  const center = list.find((a) => a.featured) ?? list[Math.min(1, list.length - 1)];
  const others = list.filter((a) => a !== center);
  const trio = [others[0], center, others[1]].filter(Boolean) as Article[];
  return (
    <div className="relative mx-3 max-w-6xl overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#3552D0] to-[#1E2F78] py-14 sm:mx-6 sm:py-20 lg:mx-auto">
      <Doodles reduce={reduce} />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-[2.6rem] leading-[1.02] text-balance text-white sm:text-[4rem]">
          <span className="text-white/45">{c.titleSoft}</span>
          <br />
          <span className="relative inline-block">
            <span aria-hidden className="absolute inset-x-[-0.1em] bottom-[0.06em] -z-0 h-[0.34em] -rotate-1 rounded-full bg-sun/90" />
            <span className="relative text-white [text-shadow:0_2px_0_rgba(8,14,70,0.35)]">{c.title}</span>
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base text-white/80">{c.sub}</p>
      </div>

      {/* desktop: tiga kartu, tengah paling besar */}
      <div className="relative mx-auto mt-12 hidden max-w-5xl grid-cols-[1fr_1.2fr_1fr] items-center gap-6 px-8 md:grid">
        {trio.map((a, i) => {
          const mid = a === center && trio.length === 3;
          return (
            <div key={a.id} className={mid ? "h-[28rem]" : "h-[23rem]"}>
              <KidCard a={a} i={i} big={mid} reduce={reduce} delay={i * 0.1} />
            </div>
          );
        })}
      </div>

      {/* HP: semua kartu bisa digeser */}
      <ul className="relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-4 pb-8 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {list.map((a, i) => (
          <li key={a.id} className="h-[24rem] w-[78vw] max-w-[20rem] shrink-0 snap-center">
            <KidCard a={a} i={i} reduce={reduce} delay={Math.min(i, 3) * 0.06} />
          </li>
        ))}
      </ul>

      <div className="relative mt-4 text-center sm:mt-10">
        <Link href={c.all.href} className="inline-flex rounded-full bg-sun px-7 py-3.5 font-display text-lg tracking-wide text-ink shadow-[0_5px_0_0_var(--color-sun-600)] transition-transform hover:-translate-y-0.5">
          {c.all.label}
        </Link>
      </div>
    </div>
  );
}

/* ---------------- DEWASA: artikel utama lebar + tiga kartu ---------------- */
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

function Editorial({ c, reduce }: { c: C; reduce: boolean }) {
  const lead = c.list.find((a) => a.featured) ?? c.list[0];
  const rest = c.list.filter((a) => a !== lead).slice(0, 3);
  const leadMeta = [lead.author && `Oleh ${lead.author}`, fmtDate(lead.date), lead.readMin ? `${lead.readMin} menit baca` : ""].filter(Boolean).join(" · ");
  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-[3.4rem]">
            <span className="text-cobalt-900/35">{c.titleSoft}</span> <span className="text-cobalt-900">{c.title}</span>
          </h2>
          <p className="mt-3 max-w-xl text-base text-ink/65">{c.sub}</p>
        </div>
        <Link href={c.all.href} className="rounded-full bg-[#14206B] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
          {c.all.label}
        </Link>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="mt-10"
      >
        <Link href={lead.href} className="group grid overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_-30px_rgba(20,32,107,0.45)] ring-1 ring-cobalt-900/8 md:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-[4/3] bg-mist md:aspect-auto md:min-h-[22rem]">
            <SafeImage src={lead.cover} alt="" fill sizes="(min-width:768px) 560px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <Corners />
          </div>
          <div className="flex flex-col p-6 sm:p-9">
            <span className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-cobalt uppercase"><span aria-hidden className="h-px w-7 bg-cobalt" />Pilihan</span>
            <h3 className="mt-4 text-[1.75rem] leading-[1.12] font-semibold tracking-[-0.03em] text-cobalt-900 sm:text-[2.2rem]">{lead.title}</h3>
            {lead.excerpt && <p className="mt-4 text-base leading-relaxed text-ink/65">{lead.excerpt}</p>}
            <div className="mt-auto flex items-end justify-between gap-3 pt-8">
              <p className="text-[13px] text-ink/55">{leadMeta}</p>
              <span className="shrink-0 rounded-full bg-cobalt px-3 py-1 text-xs font-bold text-white">{lead.category}</span>
            </div>
          </div>
        </Link>
      </motion.div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        {rest.map((a, i) => (
          <motion.li
            key={a.id}
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: 0.06 + i * 0.08 }}
          >
            <Link href={a.href} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
                <SafeImage src={a.cover} alt="" fill sizes="(min-width:640px) 360px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <Corners />
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className="text-[1.02rem] leading-snug font-semibold tracking-[-0.01em] text-cobalt-900 transition-colors group-hover:text-cobalt">{a.title}</h3>
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${PILLS[i % PILLS.length]}`}>{a.category}</span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
