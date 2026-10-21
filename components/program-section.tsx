"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, PROGRAMS, programContent, wa, type Program } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { Bokeh, Butterfly, KidsClouds } from "./ornaments";
import { useAudience } from "./audience-provider";
import { Button } from "./ui/button";

/**
 * Section Program & Biaya. Semua harga tampil sekaligus (tanpa tab), supaya mudah dibandingkan.
 *  - Anak: Kids, Teens, Private dalam tiga kartu chunky berwarna.
 *  - Dewasa: Business Class sebagai kartu utama yang lebar, lalu Private & Exam di bawahnya.
 */
export function ProgramSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = programContent[audience];
  const list = c.list.map((id) => PROGRAMS[id]);

  return (
    <section id="biaya" className="relative overflow-x-clip" style={{ background: SECTION_BG[audience] }}>
      {kids ? <KidsClouds /> : <Bokeh reduce={reduce} count={8} className="inset-0" />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="mx-auto max-w-6xl px-5 pt-8 pb-24 sm:pb-32"
        >
          <div className={kids ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
            <h2
              className={
                kids
                  ? "font-display text-4xl leading-[1.05] text-balance text-cobalt-900 sm:text-[3.25rem]"
                  : "text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-cobalt-900 sm:text-5xl"
              }
            >
              {c.title}
            </h2>
            <p className="mt-4 text-base text-ink/70">{c.sub}</p>
          </div>

          {kids ? (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {list.map((p, i) => (
                <KidsCard key={p.id} p={p} i={i} reduce={reduce} />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <AdultFeatured p={list[0]} reduce={reduce} />
              {list.slice(1).map((p, i) => (
                <AdultCard key={p.id} p={p} i={i} reduce={reduce} />
              ))}
            </div>
          )}

          {c.extra && <p className="mt-8 text-center text-sm text-ink/60">{c.extra}</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

const rise = (reduce: boolean, i: number) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
      };

function Check({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" className={`mt-0.5 shrink-0 ${className}`} aria-hidden>
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path d="M6 10.3l2.6 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Anak ---------- */

const KIDS_TONE = [
  { card: "bg-sun shadow-[0_6px_0_0_var(--color-sun-600)]", price: "text-cobalt", check: "text-cobalt", tilt: -2 },
  { card: "bg-white border-2 border-mist shadow-[0_6px_0_0_var(--color-mist)]", price: "text-cobalt", check: "text-sky", tilt: 2 },
  { card: "bg-sky/15 border-2 border-sky/30 shadow-[0_6px_0_0_rgba(7,169,248,0.3)]", price: "text-cobalt", check: "text-cobalt", tilt: -1.5 },
];

function KidsCard({ p, i, reduce }: { p: Program; i: number; reduce: boolean }) {
  const t = KIDS_TONE[i % 3];
  return (
    <motion.article
      {...rise(reduce, i)}
      whileHover={reduce ? undefined : { y: -6 }}
      className={`relative flex flex-col rounded-[2rem] p-4 pb-6 ${t.card}`}
    >
      {i === 1 && <Butterfly tone={1} rest reduce={reduce} className="pointer-events-none absolute -top-8 -right-5 z-10 w-20 rotate-12" />}
      <div
        className="relative aspect-[4/3.2] overflow-hidden rounded-[1.5rem] border-4 border-white shadow-[0_10px_24px_-14px_rgba(30,47,120,0.5)]"
        style={{ rotate: `${t.tilt}deg` }}
      >
        <Image src={p.photo} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover object-top" />
      </div>
      <div className="flex flex-1 flex-col px-2 pt-5">
        <span className="self-start rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-cobalt-900 ring-1 ring-cobalt-900/10">{p.who}</span>
        <h3 className="mt-3 font-display text-3xl text-cobalt-900">{p.name}</h3>
        <p className="mt-3 text-xs font-semibold text-ink/55">{programContent.from}</p>
        <p className={`font-display text-5xl leading-none ${t.price}`}>{p.price}</p>
        <p className="mt-1 text-sm text-ink/60">{p.unit}</p>
        <ul className="mt-5 space-y-2.5">
          <li className="flex gap-2.5 text-[15px] font-semibold text-cobalt-900">
            <Check className={t.check} />
            {programContent.free.kids}
          </li>
          {p.points.map((pt) => (
            <li key={pt} className="flex gap-2.5 text-[15px] text-ink/80">
              <Check className={t.check} />
              {pt}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-7">
          <Button href={wa(`Halo English Now, saya ingin konsultasi ${p.name}.`)} variant="cobalt" size="md" className="w-full text-base">
            {CTA.consult.label}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- Dewasa ---------- */

function AdultFeatured({ p, reduce }: { p: Program; reduce: boolean }) {
  return (
    <motion.article
      {...rise(reduce, 0)}
      className="grid overflow-hidden rounded-3xl bg-cobalt-900 text-white md:col-span-2 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="relative aspect-[4/3] md:aspect-auto">
        <Image src={p.photo} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover object-top" />
      </div>
      <div className="flex flex-col p-7 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sun px-3 py-1 text-xs font-semibold text-cobalt-900">{p.who}</span>
        </div>
        <h3 className="mt-4 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{p.name}</h3>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-sm text-white/60">{programContent.from}</span>
          <span className="text-5xl font-semibold tracking-tight">{p.price}</span>
        </div>
        <p className="mt-1 text-sm text-white/60">{p.unit}</p>
        <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          <li className="flex gap-2.5 text-[15px] font-medium text-sun">
            <Check className="text-sun [&_path]:stroke-cobalt-900" />
            {programContent.free.adult}
          </li>
          {p.points.map((pt) => (
            <li key={pt} className="flex gap-2.5 text-[15px] text-white/85">
              <Check className="text-white/25" />
              {pt}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href={wa(`Halo English Now, saya ingin diskusi ${p.name} untuk tim kami.`)} variant="sunPill" size="md" className="text-base">
            Diskusikan kebutuhan tim
          </Button>
          <span className="text-sm text-white/55">Harga final mengikuti kebutuhan & jumlah peserta.</span>
        </div>
      </div>
    </motion.article>
  );
}

function AdultCard({ p, i, reduce }: { p: Program; i: number; reduce: boolean }) {
  return (
    <motion.article
      {...rise(reduce, i + 1)}
      className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-36px_rgba(54,54,54,0.4)] ring-1 ring-ink/10"
    >
      <div className="relative aspect-[16/8] overflow-hidden">
        <Image src={p.photo} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[50%_30%]" />
      </div>
      <div className="flex flex-1 flex-col p-7">
        <p className="text-sm text-ink/55">{p.who}</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-cobalt-900">{p.name}</h3>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-sm text-ink/55">{programContent.from}</span>
          <span className="text-4xl font-semibold tracking-tight text-cobalt-900">{p.price}</span>
        </div>
        <p className="mt-1 text-sm text-ink/55">{p.unit}</p>
        <ul className="mt-5 space-y-2.5">
          <li className="flex gap-2.5 text-[15px] font-medium text-cobalt-900">
            <Check className="text-cobalt" />
            {programContent.free.adult}
          </li>
          {p.points.map((pt) => (
            <li key={pt} className="flex gap-2.5 text-[15px] text-ink/75">
              <Check className="text-ink/20" />
              {pt}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-7">
          <Button href={wa(`Halo English Now, saya ingin konsultasi ${p.name}.`)} variant="dark" size="md" className="w-full text-base">
            {CTA.consult.label}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
