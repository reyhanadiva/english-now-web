"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BUSINESS_OFFER, CTA, HI, PROGRAMS, consultHref, programContent, registerFor, wa, type Program } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { Butterfly, KidsClouds } from "./ornaments";
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
  // sorotan dari asisten pilih kelas (event "en:program")
  const [hi, setHi] = useState<string | null>(null);
  useEffect(() => {
    let t = 0;
    const on = (e: Event) => {
      setHi((e as CustomEvent<string>).detail);
      window.clearTimeout(t);
      t = window.setTimeout(() => setHi(null), 3200);
    };
    window.addEventListener("en:program", on);
    return () => {
      window.removeEventListener("en:program", on);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <section id="biaya" className="relative overflow-x-clip" style={{ background: SECTION_BG[audience] }}>
      {kids && <KidsClouds />}
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
            <Rail count={list.length} kids reduce={reduce} className="md:grid-cols-3 md:gap-6">
              {list.map((p, i) => (
                <Spotlight key={p.id} id={p.id} on={hi === p.id} kids className={SLIDE}>
                  <KidsCard p={p} i={i} reduce={reduce} />
                </Spotlight>
              ))}
            </Rail>
          ) : (
            <Rail count={list.length} reduce={reduce} className="md:grid-cols-2 md:gap-5">
              <Spotlight id={list[0].id} on={hi === list[0].id} className={`${SLIDE} md:col-span-2`}>
                <AdultFeatured p={list[0]} reduce={reduce} />
              </Spotlight>
              {list.slice(1).map((p, i) => (
                <Spotlight key={p.id} id={p.id} on={hi === p.id} className={SLIDE}>
                  <AdultCard p={p} i={i} reduce={reduce} />
                </Spotlight>
              ))}
            </Rail>
          )}

          {c.extra && <p className="mt-8 text-center text-sm text-ink/60">{c.extra}</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/** lebar tiap kartu di HP (kartu berikutnya mengintip di kanan, tanda bisa digeser) */
const SLIDE = "w-[84%] shrink-0 snap-center md:w-auto";

/**
 * HP: kartu harga berjajar mendatar dan bisa digeser (scroll-snap), dengan
 * label "Geser untuk lihat N pilihan", titik penanda posisi, dan sekali "intip" otomatis
 * saat pertama terlihat supaya jelas bisa digeser. Desktop: grid biasa.
 */
function Rail({ count, kids = false, reduce, className = "", children }: { count: number; kids?: boolean; reduce: boolean; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const peeked = useRef(false);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    kids.forEach((k, i) => {
      if (Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid) < Math.abs(kids[best].offsetLeft + kids[best].offsetWidth / 2 - mid)) best = i;
    });
    setIdx(best);
  };

  // intip sekali: geser sedikit lalu kembali, hanya di HP
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || peeked.current || el.scrollWidth <= el.clientWidth + 4) return;
        peeked.current = true;
        el.scrollTo({ left: 70, behavior: "smooth" });
        window.setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 650);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const go = (i: number) => {
    const el = ref.current;
    const k = el?.children[i] as HTMLElement | undefined;
    if (el && k) el.scrollTo({ left: k.offsetLeft - (el.clientWidth - k.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="mt-10 md:mt-12">
      <p className={`mb-1 flex items-center gap-2 text-sm font-semibold md:hidden ${kids ? "text-cobalt" : "text-cobalt-900/70"}`}>
        Geser untuk lihat {count} pilihan
        <motion.span aria-hidden animate={reduce ? undefined : { x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
          →
        </motion.span>
      </p>
      <div
        ref={ref}
        onScroll={onScroll}
        className={`-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-4 [scrollbar-width:none] md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:py-0 [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
      {/* titik posisi + nomor */}
      <div className="mt-2 flex items-center justify-center gap-2 md:hidden" role="tablist" aria-label="Pilihan program">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={`Pilihan ${i + 1}`}
            onClick={() => go(i)}
            className={`h-2.5 rounded-full transition-all ${i === idx ? `w-7 ${kids ? "bg-cobalt" : "bg-cobalt-900"}` : "w-2.5 bg-ink/20"}`}
          />
        ))}
        <span className="ml-2 text-xs font-semibold text-ink/50">
          {idx + 1}/{count}
        </span>
      </div>
    </div>
  );
}

/** bingkai sorotan saat kartu dipilih asisten: cincin berdenyut */
function Spotlight({ id, on, kids = false, className = "", children }: { id: string; on: boolean; kids?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div id={`program-${id}`} className={`relative flex scroll-mt-28 flex-col *:flex-1 ${className}`}>
      {children}
      <AnimatePresence>
        {on && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: [0, 1, 0.6, 1], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className={`pointer-events-none absolute -inset-2 ${kids ? "rounded-[2.4rem] ring-4 ring-sun" : "rounded-[1.9rem] ring-2 ring-cobalt"}`}
          />
        )}
      </AnimatePresence>
    </div>
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
          <Button href={registerFor(p.id, p.name).href} variant="cobalt" size="md" className="w-full text-base">
            {registerFor(p.id, p.name).label}
          </Button>
          <a
            href={consultHref(p.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-sm font-semibold text-cobalt-900/70 underline-offset-4 hover:text-cobalt hover:underline"
          >
            atau {CTA.consult.label.toLowerCase()} dulu
          </a>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- Dewasa ---------- */

function AdultFeatured({ p, reduce }: { p: Program; reduce: boolean }) {
  const o = BUSINESS_OFFER;
  const [showPrice, setShowPrice] = useState(false);
  return (
    <motion.article
      {...rise(reduce, 0)}
      className="grid overflow-hidden rounded-3xl bg-cobalt-900 text-white md:col-span-2 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="relative aspect-[4/3] md:aspect-auto">
        <Image src={p.photo} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover object-top" />
        <span className="absolute top-4 left-4 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-cobalt-900">{p.name}</span>
      </div>
      <div className="flex flex-col p-7 sm:p-10">
        <span className="self-start rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-sun ring-1 ring-sun/40">{o.tag}</span>
        <h3 className="mt-4 text-3xl leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-4xl">{o.title}</h3>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/70">{o.sub}</p>

        <ul className="mt-6 space-y-2.5">
          {o.perks.map((pk) => (
            <li key={pk.label} className="flex items-center gap-3 rounded-xl bg-white/[0.07] px-3.5 py-2.5 text-[15px] font-semibold text-white">
              <Check className="text-sun [&_path]:stroke-cobalt-900" />
              {pk.label}
              <span className="ml-auto rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold text-cobalt-900">{pk.badge}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60">
          {p.points.slice(0, 3).map((pt) => (
            <li key={pt}>· {pt}</li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button href={wa(`${HI} saya ingin berdiskusi mengenai ${p.name} untuk tim/perusahaan kami.`)} variant="sunPill" size="md" className="text-base">
            Diskusikan kebutuhan tim
          </Button>
        </div>

        {/* harga sengaja kecil & belakangan: dibuka hanya kalau pengunjung memintanya */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowPrice((v) => !v)}
            aria-expanded={showPrice}
            className="text-xs font-medium text-white/50 underline-offset-4 transition hover:text-white/80 hover:underline"
          >
            {o.priceLink} {showPrice ? "▴" : "▾"}
          </button>
          <AnimatePresence initial={false}>
            {showPrice && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.25 }}
                className="overflow-hidden text-xs leading-relaxed text-white/45"
              >
                <span className="mt-2 block">
                  {programContent.from} {p.price} · {p.unit}. {o.priceNote}
                </span>
              </motion.p>
            )}
          </AnimatePresence>
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
          <li className="-mx-3 flex items-center gap-2.5 rounded-xl bg-sun/40 px-3 py-2 text-[15px] font-semibold text-cobalt-900">
            <Check className="text-cobalt-900" />
            {programContent.free.adult}
            <span className="ml-auto rounded-full bg-cobalt-900 px-2 py-0.5 text-[11px] font-semibold text-sun">Gratis</span>
          </li>
          {p.points.map((pt) => (
            <li key={pt} className="flex gap-2.5 text-[15px] text-ink/80">
              <Check className="text-cobalt" />
              {pt}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-7">
          <Button href={registerFor(p.id, p.name).href} variant="dark" size="md" className="w-full text-base">
            {registerFor(p.id, p.name).label}
          </Button>
          <a
            href={consultHref(p.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-sm font-semibold text-ink/55 underline-offset-4 hover:text-cobalt-900 hover:underline"
          >
            atau {CTA.consult.label.toLowerCase()} dulu
          </a>
        </div>
      </div>
    </motion.article>
  );
}
