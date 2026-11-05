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

function SampleTag({ className = "" }: { className?: string }) {
  return <span className={`rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase ${className}`}>Contoh</span>;
}

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
          className="relative py-20 sm:py-28"
        >
          {kids ? <KidsTrio c={c} reduce={reduce} /> : <Editorial c={c} reduce={reduce} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

type C = (typeof articleContent)["kids"];

/* ---------------- ANAK: tiga kartu foto, tengah lebih besar ---------------- */
function KidCard({ a, big, reduce, delay }: { a: Article; big?: boolean; reduce: boolean; delay: number }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay }}
      className="h-full"
    >
      <Link
        href={a.href}
        className="group relative block h-full overflow-hidden rounded-[1.6rem] bg-mist shadow-[0_22px_40px_-22px_rgba(30,47,120,0.6)] ring-4 ring-white transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-sky"
      >
        <SafeImage src={a.cover} alt="" fill sizes="(min-width:768px) 360px, 80vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/96 p-4 shadow-[0_10px_24px_-12px_rgba(30,47,120,0.5)] backdrop-blur">
          <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-wider text-cobalt uppercase">
            <span className="size-2 rounded-full bg-sun ring-2 ring-sun-600/40" />
            {a.category}
            {a.sample && <SampleTag className="ml-auto" />}
          </p>
          <h3 className={`mt-1.5 font-display leading-[1.12] text-cobalt-900 ${big ? "text-[1.45rem]" : "text-[1.2rem]"}`}>{a.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink/60">{a.excerpt}</p>
        </div>
      </Link>
    </motion.div>
  );
}

function KidsTrio({ c, reduce }: { c: C; reduce: boolean }) {
  const list = c.list;
  const center = list.find((a) => a.featured) ?? list[Math.min(1, list.length - 1)];
  const others = list.filter((a) => a !== center);
  const trio = [others[0], center, others[1]].filter(Boolean) as Article[];
  return (
    <>
      <div className="mx-auto max-w-6xl px-5 text-center">
        <h2 className="font-display text-4xl leading-[1.05] text-balance sm:text-[3.4rem]">
          <span className="text-cobalt-900/35">{c.titleSoft}</span>
          <br />
          <span className="text-cobalt-900">{c.title}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink/65">{c.sub}</p>
      </div>

      {/* desktop: tiga kartu, tengah lebih besar */}
      <div className="mx-auto mt-12 hidden max-w-5xl grid-cols-[1fr_1.18fr_1fr] items-center gap-5 px-5 md:grid">
        {trio.map((a, i) => {
          const mid = a === center && trio.length === 3;
          return (
            <div key={a.id} className={mid ? "h-[27rem]" : "h-[22rem]"}>
              <KidCard a={a} big={mid} reduce={reduce} delay={i * 0.08} />
            </div>
          );
        })}
      </div>

      {/* HP: semua kartu bisa digeser */}
      <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pt-2 pb-6 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {list.map((a, i) => (
          <li key={a.id} className="h-[23rem] w-[78vw] max-w-[20rem] shrink-0 snap-center">
            <KidCard a={a} reduce={reduce} delay={Math.min(i, 3) * 0.06} />
          </li>
        ))}
      </ul>

      <div className="mt-8 text-center">
        <Link href={c.all.href} className="inline-flex rounded-full bg-cobalt px-6 py-3 font-display text-base tracking-wide text-white shadow-[0_4px_0_0_var(--color-cobalt-900)] transition-transform hover:-translate-y-0.5">
          {c.all.label}
        </Link>
      </div>
    </>
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
            {lead.sample && <SampleTag className="absolute bottom-4 left-4" />}
          </div>
          <div className="flex flex-col p-6 sm:p-9">
            <span className="w-fit rounded-full bg-[#14206B] px-3 py-1 text-[11px] font-bold tracking-wide text-white">Pilihan</span>
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
                {a.sample && <SampleTag className="absolute right-3 bottom-3" />}
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
