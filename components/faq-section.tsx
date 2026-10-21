"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { faqContent } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { CatOnCard, Moon, Petals, Stars } from "./ornaments";

/**
 * Section FAQ.
 * Kiri (menempel saat scroll): judul + kartu "masih ada pertanyaan?" ke WhatsApp.
 * Kanan: daftar pertanyaan bernomor; satu terbuka pada satu waktu, tingginya beranimasi.
 * Anak: kartu chunky, pertanyaan aktif berlatar kuning. Dewasa: garis tipis, editorial.
 */
export function FaqSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = faqContent[audience];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative overflow-x-clip pt-8 pb-12 sm:pb-16" style={{ background: SECTION_BG[audience] }}>
      {kids ? <Petals reduce={reduce} count={7} /> : <Stars reduce={reduce} count={10} className="absolute top-0 left-0 h-64 w-1/3" />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
        >
          <div className="self-start lg:sticky lg:top-32">
            <h2
              className={
                kids
                  ? "font-display text-4xl leading-[1.05] text-balance text-cobalt-900 sm:text-[3.25rem]"
                  : "text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-cobalt-900 sm:text-5xl"
              }
            >
              {c.title}
            </h2>
            <a
              href={c.ask}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative mt-14 flex max-w-sm items-center gap-4 p-5 transition ${
                kids
                  ? "rounded-3xl bg-cobalt text-white shadow-[0_6px_0_0_var(--color-cobalt-900)] hover:-translate-y-0.5"
                  : "rounded-2xl bg-cobalt-900 text-white hover:bg-cobalt-700"
              }`}
            >
              {kids ? (
                <CatOnCard reduce={reduce} />
              ) : (
                <Moon className="pointer-events-none absolute -top-12 -right-12 w-28" />
              )}
              <span className={`grid size-14 shrink-0 place-items-center rounded-full ${kids ? "bg-sun text-cobalt-900" : "bg-white/10 text-sun"}`}>
                <span aria-hidden className={kids ? "font-display text-[2rem] leading-none" : "text-[1.75rem] leading-none font-bold"}>
                  ?
                </span>
              </span>
              <span className="flex-1">
                <span className={kids ? "block font-display text-lg leading-tight" : "block font-semibold"}>Masih ada pertanyaan?</span>
                <span className="mt-0.5 block text-sm text-white/75">{c.sub}</span>
              </span>
              <span aria-hidden className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>

          <ul className={kids ? "space-y-3" : "border-t border-ink/10"}>
            {c.items.map((it, i) => {
              const on = open === i;
              return (
                <li
                  key={it.q}
                  className={
                    kids
                      ? `overflow-hidden rounded-3xl border-2 transition-colors ${
                          on ? "border-sun-600 bg-sun shadow-[0_5px_0_0_var(--color-sun-600)]" : "border-mist bg-white shadow-[0_5px_0_0_var(--color-mist)]"
                        }`
                      : "border-b border-ink/10"
                  }
                >
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setOpen(on ? null : i)}
                    className={`flex w-full items-center gap-4 text-left ${kids ? "px-5 py-4 sm:px-6" : "py-6"}`}
                  >
                    <span
                      className={
                        kids
                          ? `grid size-9 shrink-0 place-items-center rounded-xl font-display text-lg ${on ? "bg-cobalt text-white" : "bg-mist-50 text-cobalt"}`
                          : "w-8 shrink-0 text-sm font-semibold text-cobalt tabular-nums"
                      }
                    >
                      {kids ? i + 1 : String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 ${
                        kids ? "font-display text-lg leading-snug tracking-wide text-cobalt-900 sm:text-xl" : "text-lg font-semibold tracking-tight text-cobalt-900 sm:text-xl"
                      }`}
                    >
                      {it.q}
                    </span>
                    <motion.span
                      animate={{ rotate: on ? 45 : 0 }}
                      transition={{ duration: reduce ? 0 : 0.25 }}
                      className={`grid size-9 shrink-0 place-items-center rounded-full ${
                        kids ? (on ? "bg-white text-cobalt-900" : "bg-cobalt text-white") : on ? "bg-cobalt-900 text-white" : "bg-white text-cobalt-900 ring-1 ring-ink/10"
                      }`}
                      aria-hidden
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M7 1.5v11M1.5 7h11" />
                      </svg>
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className={`text-[15px] leading-relaxed text-ink/75 ${kids ? "px-5 pb-5 pl-[4.25rem] sm:px-6 sm:pl-[4.5rem]" : "pr-14 pb-6 pl-12"}`}>
                          {it.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
