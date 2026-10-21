"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LOGOS, testimonialContent, type Testimonial } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { Petals, Stars as Twinkles } from "./ornaments";
import { SafeImage as Image } from "./ui/safe-image";

/**
 * Section Testimoni.
 *  - Desktop: deretan foto yang "membuka". Satu foto lebar menampilkan kutipan pendek
 *    yang besar; foto lain menyempit & buram. Berganti otomatis, berhenti saat disorot.
 *    "Baca cerita lengkap" membuka testimoni utuh di atas foto.
 *  - HP: kartu foto yang bisa digeser (scroll-snap), masing-masing dengan kutipan pendek.
 *  - Dewasa: di atasnya ada strip logo institusi yang berjalan pelan.
 */
const CYCLE_MS = 6500;

export function TestimonialSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = testimonialContent[audience];

  return (
    <section id="testimoni" className="relative overflow-hidden" style={{ background: SECTION_BG[audience] }}>
      {kids && <Petals reduce={reduce} count={6} />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="pt-6 pb-24 sm:pt-8 sm:pb-32"
        >
          {!kids && <LogoWall />}

          <div className={`relative mx-auto max-w-6xl px-5 ${kids ? "text-center" : ""}`}>
            {!kids && <Twinkles reduce={reduce} count={9} className="absolute -top-6 right-0 h-32 w-1/3" />}
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

          <Stage list={c.list} kids={kids} reduce={reduce} />
          <Swipe list={c.list} kids={kids} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ---------- desktop: foto yang membuka ---------- */

function Stage({ list, kids, reduce }: { list: Testimonial[]; kids: boolean; reduce: boolean }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (reduce || paused || open) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % list.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused, open, list.length]);

  const radius = kids ? "rounded-[2rem]" : "rounded-3xl";

  return (
    <div
      className="mx-auto mt-12 hidden h-[34rem] max-w-6xl gap-3 px-5 md:flex"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((t, i) => {
        const on = i === active;
        return (
          <motion.figure
            key={t.id}
            layout
            onClick={() => {
              if (!on) {
                setActive(i);
                setOpen(false);
              }
            }}
            animate={{ flexGrow: on ? 5 : 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
            className={`relative min-w-0 basis-0 overflow-hidden ${radius} ${on ? "" : "cursor-pointer"} ${
              kids && on ? "ring-4 ring-white shadow-[0_10px_0_0_var(--color-mist)]" : ""
            }`}
          >
            <Image
              src={t.photo}
              alt={t.name}
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className={`object-cover object-top transition-[filter,transform] duration-700 ${on ? "" : "scale-110 blur-[3px] grayscale-[35%]"}`}
            />
            <div className={`absolute inset-0 transition-opacity duration-500 opacity-100 bg-gradient-to-t from-cobalt-900/90 via-cobalt-900/20 to-transparent`} />

            {/* nama di kartu yang menyempit, ditulis vertikal */}
            {/* kartu yang menyempit: nama & bintang, mendatar */}
            {!on && (
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <Stars small />
                <p className="mt-1.5 text-sm leading-tight font-semibold">{t.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/70">{t.program}</p>
              </div>
            )}
            <SampleBadge t={t} />

            <AnimatePresence mode="wait">
              {on && (
                <motion.figcaption
                  key={open ? "full" : "short"}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: reduce ? 0 : 0.35, delay: open ? 0 : 0.2 }}
                  className="absolute inset-x-0 bottom-0 p-8 text-white lg:p-10"
                >
                  <Stars />
                  {open ? (
                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/90">{t.full}</p>
                  ) : (
                    <blockquote
                      className={
                        kids
                          ? "mt-3 max-w-2xl font-display text-[2.4rem] leading-[1.08] text-balance lg:text-5xl"
                          : "mt-3 max-w-2xl text-[2.1rem] leading-[1.12] font-semibold tracking-[-0.02em] text-balance lg:text-[2.6rem]"
                      }
                    >
                      <span className="text-sun">“</span>
                      {t.quote}
                      <span className="text-sun">”</span>
                    </blockquote>
                  )}
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">{t.name}</p>
                      <p className="text-sm text-white/70">{t.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">{t.program}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen((o) => !o);
                        }}
                        className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-cobalt-900 transition hover:bg-sun"
                      >
                        {open ? "Tutup" : "Baca cerita lengkap"}
                      </button>
                    </div>
                  </div>
                </motion.figcaption>
              )}
            </AnimatePresence>

            {/* garis waktu tipis */}
            {on && !paused && !open && !reduce && (
              <motion.span
                key={`bar-${active}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                className="absolute inset-x-0 top-0 h-1 origin-left bg-sun"
              />
            )}
          </motion.figure>
        );
      })}
    </div>
  );
}

/* ---------- HP: kartu yang digeser ---------- */

function Swipe({ list, kids }: { list: Testimonial[]; kids: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:hidden">
      {list.map((t) => (
        <figure
          key={t.id}
          className={`relative h-[30rem] w-[82%] shrink-0 snap-center overflow-hidden ${kids ? "rounded-[2rem]" : "rounded-3xl"}`}
        >
          <Image src={t.photo} alt={t.name} fill sizes="85vw" className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-cobalt-900/95 via-cobalt-900/25 to-transparent" />
          <SampleBadge t={t} />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
            <Stars small />
            {open === t.id ? (
              <p className="mt-3 text-sm leading-relaxed text-white/90">{t.full}</p>
            ) : (
              <blockquote className={kids ? "mt-2 font-display text-[1.7rem] leading-[1.1]" : "mt-2 text-2xl leading-[1.15] font-semibold tracking-tight"}>
                <span className="text-sun">“</span>
                {t.quote}
                <span className="text-sun">”</span>
              </blockquote>
            )}
            <p className="mt-4 text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-white/70">
              {t.role} · {t.program}
            </p>
            <button
              type="button"
              onClick={() => setOpen(open === t.id ? null : t.id)}
              className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-cobalt-900"
            >
              {open === t.id ? "Tutup" : "Baca cerita lengkap"}
            </button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/* ---------- bintang & label contoh ---------- */

function Stars({ small = false }: { small?: boolean }) {
  return (
    <span className="flex gap-0.5 text-sun" role="img" aria-label="Rating 5 dari 5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={small ? "size-3.5" : "size-5"} fill="currentColor" aria-hidden>
          <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

/** label "Contoh" hanya saat development, supaya testimoni contoh tidak ikut tayang tanpa sengaja */
function SampleBadge({ t }: { t: Testimonial }) {
  if (!t.sample || process.env.NODE_ENV === "production") return null;
  return (
    <span className="absolute top-3 right-3 z-10 rounded-full bg-[#E8433F] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
      Contoh
    </span>
  );
}

/* ---------- dinding logo (Dewasa) ---------- */

function LogoWall() {
  return (
    <div className="mx-auto mb-20 grid max-w-6xl items-center gap-8 px-5 sm:mb-24 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <div>
        <p className="text-6xl font-semibold tracking-tight text-cobalt-900 sm:text-7xl">
          {/* TODO: sesuaikan dengan jumlah institusi sebenarnya */}
          11<span className="text-cobalt">+</span>
        </p>
        <p className="mt-2 max-w-xs text-base text-ink/70">perusahaan, instansi pemerintahan, kampus, sekolah, dan komunitas telah mempercayakan pelatihan bahasa Inggrisnya kepada kami.</p>
      </div>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10 ring-1 ring-ink/10 sm:grid-cols-3">
        {LOGOS.map((l) => (
          <li key={l.src} className="group relative grid h-28 place-items-center bg-white sm:h-32" title={l.name}>
            <div className="relative h-16 w-32 grayscale transition duration-300 group-hover:scale-105 group-hover:grayscale-0">
              <Image src={l.src} alt={l.name} fill sizes="128px" className="object-contain" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
