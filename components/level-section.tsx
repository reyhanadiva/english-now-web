"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { CTA, KIDS_LEVELS, LEVELS, LEVEL_SOURCE, levelContent } from "@/lib/content";
import { useAudience } from "./audience-provider";
import { Button } from "./ui/button";
import { SECTION_BG } from "@/lib/theme";
import { Butterfly } from "./ornaments";
import { ChatWindow } from "./chat-bubbles";

/**
 * Section 3: simulasi level.
 *  - Anak: jalur mendaki jenjang Cambridge (Starters → First).
 *  - Dewasa: tangga level CEFR A1 → C2 (makin ke kanan makin tinggi).
 */
export function LevelSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = levelContent[audience];

  return (
    <section id="level" className="relative overflow-hidden" style={{ background: SECTION_BG[audience] }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="relative mx-auto max-w-6xl px-5 pt-2 pb-24 sm:pb-32"
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={
              kids
                ? "rounded-[2rem] bg-cobalt p-6 text-white shadow-[0_6px_0_0_var(--color-cobalt-900)] sm:p-10"
                : "rounded-3xl bg-white p-6 shadow-[0_24px_60px_-36px_rgba(54,54,54,0.35)] ring-1 ring-ink/10 sm:p-10"
            }
          >
            <h2
              className={
                kids
                  ? "max-w-2xl font-display text-3xl leading-[1.08] text-balance sm:text-[2.6rem]"
                  : "max-w-2xl text-3xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-cobalt-900 sm:text-[2.6rem]"
              }
            >
              {c.title}
            </h2>
            <p className={`mt-3 max-w-lg text-[15px] leading-relaxed ${kids ? "text-white/80" : "text-ink/65"}`}>{c.sub}</p>
            {kids ? <AdventureMap reduce={reduce} cta={c.cta} /> : <CefrBar reduce={reduce} cta={c.cta} />}
            <p className={`mt-4 text-[11px] ${kids ? "text-white/55" : "text-ink/45"}`}>{LEVEL_SOURCE[audience]}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/**
 * Level berjalan sendiri dari yang terendah ke tertinggi saat section terlihat,
 * lalu mengulang. Berhenti begitu pengunjung memilih level sendiri.
 */
function useAutoStep(count: number, reduce: boolean, fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [sel, setSel] = useState(reduce ? fallback : 0);
  const [auto, setAuto] = useState(!reduce);
  useEffect(() => {
    if (!auto || !inView || reduce) return;
    const t = window.setTimeout(() => setSel((s) => (s + 1) % count), sel === count - 1 ? 4800 : 3400);
    return () => window.clearTimeout(t);
  }, [auto, inView, reduce, sel, count]);
  const pick = (i: number) => {
    setAuto(false);
    setSel(i);
  };
  const replay = () => {
    setSel(0);
    setAuto(true);
  };
  return { ref, sel, pick, auto, replay };
}

function Replay({ auto, onClick, light }: { auto: boolean; onClick: () => void; light?: boolean }) {
  if (auto) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold underline-offset-4 hover:underline ${light ? "text-white/70 hover:text-white" : "text-ink/50 hover:text-cobalt-900"}`}
    >
      ↻ Putar ulang dari awal
    </button>
  );
}

/* ---------- Anak: peta petualangan ---------- */

function AdventureMap({ reduce, cta }: { reduce: boolean; cta: string }) {
  const { ref, sel, pick, auto, replay } = useAutoStep(KIDS_LEVELS.length, reduce, 1);
  const setSel = pick;
  const lv = KIDS_LEVELS[sel];
  const ys = [80, 68, 56, 44, 32, 22]; // tinggi tiap pos (persen): jalur terus menanjak, tanda naik level

  return (
    <div ref={ref}>
      <div className="relative mt-6 h-64 sm:h-64">
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <path
            d={ys.reduce((d, y, i) => (i === 0 ? `M 50 ${y}` : `${d} C ${i * 100} ${ys[i - 1]}, ${i * 100} ${y}, ${50 + i * 100} ${y}`), "")}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="3"
            strokeDasharray="2 9"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* titik-titik jalur yang sudah dilalui berubah kuning satu per satu:
              jalur kuning yang sama persis, dipotong oleh kotak yang melebar ke pos terpilih */}
          <defs>
            <clipPath id="trail-clip">
              <motion.rect
                x="0"
                y="0"
                height="100"
                initial={false}
                animate={{ width: 50 + sel * 100 }}
                transition={{ duration: reduce ? 0 : 1.2, ease: "linear" }}
              />
            </clipPath>
          </defs>
          <path
            d={ys.reduce((d, y, i) => (i === 0 ? `M 50 ${y}` : `${d} C ${i * 100} ${ys[i - 1]}, ${i * 100} ${y}, ${50 + i * 100} ${y}`), "")}
            fill="none"
            stroke="#FFF275"
            strokeWidth="3"
            strokeDasharray="2 9"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            clipPath="url(#trail-clip)"
          />
        </svg>
        {/* kupu-kupu dari hero terbang ke pos yang dipilih */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute z-10 w-10 sm:w-14"
          initial={false}
          animate={{ left: `calc(${(50 + sel * 100) / 6}% + 14px)`, top: `calc(${ys[sel]}% - 58px)` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 40, damping: 9 }}
        >
          <Butterfly tone={0} reduce={reduce} className="w-full" />
        </motion.div>
        <div role="radiogroup" aria-label="Level Cambridge" className="absolute inset-0">
          {KIDS_LEVELS.map((l, i) => {
            const active = i === sel;
            const done = i < sel;
            return (
              <motion.button
                key={l.name}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${l.name} (${l.code})`}
                onClick={() => setSel(i)}
                whileHover={reduce ? undefined : { y: -4 }}
                whileTap={reduce ? undefined : { y: 2 }}
                style={{ left: `${(50 + i * 100) / 6}%`, top: `${ys[i]}%` }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              >
                <span
                  className={`grid size-12 place-items-center rounded-full font-display text-lg transition-colors sm:size-16 sm:text-2xl ${
                    active
                      ? "bg-sun text-cobalt-900 shadow-[0_5px_0_0_var(--color-sun-600)]"
                      : done
                        ? "bg-white text-cobalt shadow-[0_5px_0_0_rgba(0,0,0,0.18)]"
                        : "bg-cobalt-700 text-white/80 shadow-[0_5px_0_0_var(--color-cobalt-900)] ring-2 ring-white/25"
                  }`}
                >
                  {done ? <Star /> : i + 1}
                </span>
                <span className={`font-display text-xs tracking-wide sm:text-sm ${active ? "text-sun" : "text-white/80"}`}>{l.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 rounded-3xl bg-cobalt-900/40 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-6">
        <div className="flex flex-col items-start gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={lv.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              <p className="font-display text-lg text-sun">
                {lv.name} <span className="text-white/60">· {lv.code}</span>
              </p>
              <p className="mt-0.5 max-w-md text-[15px] text-white/90">{lv.body}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex flex-wrap items-center gap-4">
            <Button href={CTA.level.kids} variant="sun" size="sm">
              {cta}
            </Button>
            <Replay auto={auto} onClick={replay} light />
          </div>
        </div>
        {/* contoh percakapan sesuai level yang dipilih */}
        <ChatWindow kids once title={`Contoh percakapan level ${lv.name}`} lines={lv.chat} />
      </div>
    </div>
  );
}

function Star() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" fill="currentColor" />
    </svg>
  );
}

/* ---------- Dewasa: tangga CEFR ---------- */

function CefrBar({ reduce, cta }: { reduce: boolean; cta: string }) {
  const { ref, sel, pick, auto, replay } = useAutoStep(LEVELS.length, reduce, 3);
  const touched = !auto;
  const lv = LEVELS[sel];
  return (
    <div ref={ref}>
      {/* tangga level: makin ke kanan makin tinggi. Tiap anak tangga = tombol yang bisa diklik */}
      <div className="relative mt-8">
        <p aria-hidden className="absolute top-0 left-0 hidden items-center gap-1.5 text-xs font-semibold tracking-wide text-ink/40 uppercase sm:flex">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Makin tinggi, makin mahir
        </p>
        <div role="radiogroup" aria-label="Level CEFR" className="flex h-64 items-end gap-1.5 sm:h-72 sm:gap-3">
          {LEVELS.map((l, i) => {
            const on = i === sel;
            const reached = i <= sel;
            const h = 34 + i * 13; // persen, makin tinggi
            return (
              <motion.button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${l.code} ${l.name}`}
                onClick={() => pick(i)}
                whileHover={reduce ? undefined : { y: -4 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                style={{ height: `${h}%` }}
                className="group relative flex min-w-0 flex-1 cursor-pointer flex-col justify-end"
              >
                {/* penanda "posisi Anda" melompat ke anak tangga terpilih */}
                {on && (
                  <motion.span
                    layoutId="cefr-you"
                    aria-hidden
                    className="absolute -top-9 left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-sun text-cobalt-900 shadow-[0_6px_14px_-4px_rgba(244,199,123,0.9)]"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 20 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </motion.span>
                )}
                <span className={`relative flex h-full w-full flex-col justify-end overflow-hidden rounded-t-2xl p-2 text-left ring-1 transition-colors sm:p-3 ${on ? "ring-cobalt-900" : "ring-ink/10 group-hover:ring-cobalt/40"}`}>
                  <span className="absolute inset-0 bg-[#EEF2FF]" />
                  <motion.span
                    initial={false}
                    animate={{ scaleY: reached ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : i * 0.04 }}
                    className={`absolute inset-0 origin-bottom ${on ? "bg-cobalt-900" : "bg-gradient-to-t from-cobalt to-sky"}`}
                  />
                  <span className="relative text-base font-semibold sm:text-xl" style={{ color: reached ? "#fff" : "var(--color-cobalt-900)" }}>
                    {l.code}
                  </span>
                  <span className="relative text-[10px] sm:text-xs" style={{ color: reached ? "rgba(255,255,255,0.75)" : "rgba(54,54,54,0.5)" }}>
                    {l.name}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
        <div aria-hidden className="h-1.5 rounded-full bg-cobalt-900/15" />
      </div>
      {!touched && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-cobalt">
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 2a2 2 0 0 1 2 2v7.2l1.3-.4a2 2 0 0 1 1.5.1l4.4 2.2a2 2 0 0 1 1.1 2.2l-1 5A2.5 2.5 0 0 1 15.9 22H10a2 2 0 0 1-1.6-.8l-4-5.3a1.8 1.8 0 0 1 2.6-2.4L7 14V4a2 2 0 0 1 2-2z" />
            </svg>
          </motion.span>
          Pilih level untuk melihat target kemampuannya
        </p>
      )}

      <div className="mt-6 grid gap-5 border-t border-ink/10 pt-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-8">
        <div className="flex flex-col items-start gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={lv.code}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              <p className="text-sm font-semibold text-cobalt-900">
                {lv.code} · {lv.name}
              </p>
              <p className="mt-1 max-w-lg text-[15px] text-ink/70">{lv.adult}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex flex-wrap items-center gap-4">
            <Button href={CTA.level.adult} variant="dark" size="sm">
              {cta}
            </Button>
            <Replay auto={auto} onClick={replay} />
          </div>
        </div>
        <ChatWindow kids={false} once title={`Contoh percakapan level ${lv.code}`} lines={lv.chat} />
      </div>
    </div>
  );
}
