"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { articleContent, type Article } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { Butterfly, Stars } from "./ornaments";
import { SafeImage } from "./ui/safe-image";

/**
 * Section Artikel (showcase). Isi dan tata letaknya berbeda untuk tiap dunia:
 *  - Anak: "rak cerita", kartu bergambar yang bisa digeser, sedikit miring, stiker kategori.
 *  - Dewasa: editorial, satu artikel utama besar di kiri dan daftar ringkas bergaris di kanan.
 * Data dari `articleContent` (nanti dari admin); kolom opsional yang kosong tidak ditampilkan.
 */

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(+d) ? "" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
};

const meta = (a: Article) => [a.author, fmtDate(a.date), a.readMin ? `${a.readMin} menit baca` : ""].filter(Boolean).join(" · ");

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
          {kids ? <KidsShelf c={c} reduce={reduce} /> : <Editorial c={c} reduce={reduce} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

type C = (typeof articleContent)["kids"];

/* ---------------- ANAK: rak cerita ---------------- */
const TILTS = [-2.2, 1.6, -1.2, 2.2, -1.8, 1.2];
const STICKERS = ["bg-sun text-ink", "bg-sky text-white", "bg-cobalt text-white", "bg-[#FFB48F] text-ink", "bg-[#9BE3A0] text-ink", "bg-[#C9B8FF] text-ink"];

function KidsShelf({ c, reduce }: { c: C; reduce: boolean }) {
  return (
    <>
      <Butterfly tone={1} reduce={reduce} className="absolute top-12 right-[10%] hidden w-14 md:block" delay={0.4} />
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="inline-block -rotate-2 rounded-full bg-sun px-4 py-1 font-display text-sm tracking-wide text-ink shadow-[0_3px_0_0_var(--color-sun-600)]">{c.eyebrow}</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-balance text-cobalt-900 sm:text-[3.25rem]">{c.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink/70">{c.sub}</p>
      </div>

      <div className="mt-10 [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]">
        <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1.25rem,calc((100vw-72rem)/2))] pt-6 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {c.list.map((a, i) => (
            <motion.li
              key={a.id}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: Math.min(i, 4) * 0.07 }}
              className="w-[17rem] shrink-0 snap-start sm:w-[18.5rem]"
            >
              <a
                href={a.href}
                className="group block rounded-[1.75rem] bg-white p-3 ring-4 ring-white shadow-[0_18px_34px_-18px_rgba(30,47,120,0.55)] transition-transform duration-300 hover:-translate-y-2 hover:!rotate-0 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-sky"
                style={{ transform: `rotate(${TILTS[i % TILTS.length]}deg)` }}
              >
                <div className="relative aspect-[4/3.1] overflow-hidden rounded-[1.25rem] bg-mist">
                  <SafeImage src={a.cover} alt="" fill sizes="300px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className={`absolute top-3 left-3 -rotate-3 rounded-full px-3 py-1 font-display text-[13px] tracking-wide shadow-[0_3px_0_0_rgba(0,0,0,0.12)] ${STICKERS[i % STICKERS.length]}`}>{a.category}</span>
                  {a.sample && <SampleTag className="absolute right-3 bottom-3" />}
                </div>
                <div className="px-2 pt-4 pb-2">
                  <h3 className="font-display text-[1.35rem] leading-[1.12] text-cobalt-900">{a.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/65">{a.excerpt}</p>
                  <p className="mt-3 flex items-center justify-between text-[13px] font-semibold text-cobalt">
                    <span>{a.readMin ? `${a.readMin} menit baca` : "Baca"}</span>
                    <span aria-hidden className="grid size-8 place-items-center rounded-full bg-sun text-ink transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </p>
                </div>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="text-center">
        <a href={c.all.href} className="inline-flex rounded-full bg-cobalt px-6 py-3 font-display text-base tracking-wide text-white shadow-[0_4px_0_0_var(--color-cobalt-900)] transition-transform hover:-translate-y-0.5">
          {c.all.label}
        </a>
      </div>
    </>
  );
}

/* ---------------- DEWASA: editorial ---------------- */
function Editorial({ c, reduce }: { c: C; reduce: boolean }) {
  const lead = c.list.find((a) => a.featured) ?? c.list[0];
  const rest = c.list.filter((a) => a !== lead).slice(0, 3);
  return (
    <div className="relative mx-auto max-w-6xl px-5">
      <Stars reduce={reduce} count={8} className="absolute -top-8 right-0 h-28 w-1/3" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cobalt uppercase">{c.eyebrow}</p>
          <h2 className="mt-3 text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-cobalt-900 sm:text-5xl">{c.title}</h2>
          <p className="mt-3 max-w-xl text-base text-ink/70">{c.sub}</p>
        </div>
        <a href={c.all.href} className="group text-sm font-bold text-cobalt">
          {c.all.label} <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </a>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <motion.a
          href={lead.href}
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
          className="group block lg:col-span-7"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-mist">
            <SafeImage src={lead.cover} alt="" fill sizes="(min-width:1024px) 640px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14206B]/45 via-transparent to-transparent" />
            <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold tracking-wide text-cobalt-900">{lead.category}</span>
            {lead.sample && <SampleTag className="absolute right-4 bottom-4" />}
          </div>
          <h3 className="mt-5 text-2xl leading-[1.15] font-semibold tracking-[-0.025em] text-cobalt-900 transition-colors group-hover:text-cobalt sm:text-[1.9rem]">{lead.title}</h3>
          {lead.excerpt && <p className="mt-3 max-w-xl text-base text-ink/70">{lead.excerpt}</p>}
          <p className="mt-3 text-[13px] text-ink/55">{meta(lead)}</p>
        </motion.a>

        <ul className="flex flex-col divide-y divide-cobalt-900/10 border-y border-cobalt-900/10 lg:col-span-5 lg:self-start">
          {rest.map((a, i) => (
            <motion.li
              key={a.id}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.08 }}
            >
              <a href={a.href} className="group flex gap-4 py-5">
                <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-mist sm:w-32">
                  <SafeImage src={a.cover} alt="" fill sizes="140px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.14em] text-cobalt uppercase">
                    {a.category}
                    {a.sample && <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[9px] text-ink/60">Contoh</span>}
                  </p>
                  <h3 className="mt-1.5 text-[1.05rem] leading-snug font-semibold tracking-[-0.01em] text-cobalt-900 transition-colors group-hover:text-cobalt">{a.title}</h3>
                  <p className="mt-1.5 text-[13px] text-ink/55">{meta(a)}</p>
                </div>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
