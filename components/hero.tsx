"use client";

import { useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { CTA, TAGLINE, heroContent } from "@/lib/content";
import { useAudience } from "./audience-provider";
import { AudienceToggle } from "./audience-toggle";
import { HeroBackdrop } from "./hero/hero-backdrop";
import { TrialButton } from "./trial-modal";

/* Deteksi layar sentuh: swipe kiri/kanan hanya aktif di HP/tablet */
function subscribeCoarse(onChange: () => void) {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getCoarse = () => window.matchMedia("(pointer: coarse)").matches;
const getCoarseServer = () => false;

const SWIPE_DISTANCE = 70;

/** Warna dasar sebelum lukisan selesai dimuat, supaya tidak berkedip putih */
const PLACEHOLDER = {
  kids: "linear-gradient(#8DC3F5 0%, #DCEFFC 55%, #A9D987 70%, #F7F5F9 100%)",
  adult: "linear-gradient(#1E2A78 0%, #7468C2 35%, #FFB48A 58%, #41687A 75%, #F7F5F9 100%)",
};

export function Hero() {
  const { audience, setAudience } = useAudience();
  const reduce = useReducedMotion();
  const coarse = useSyncExternalStore(subscribeCoarse, getCoarse, getCoarseServer);
  const toggleRef = useRef<HTMLDivElement>(null);

  const isKids = audience === "kids";
  const content = heroContent[audience];

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    const { x, y } = info.offset;
    if (Math.abs(x) < SWIPE_DISTANCE || Math.abs(x) < Math.abs(y) * 1.5) return;
    if (x < 0 && audience === "kids") setAudience("adult");
    if (x > 0 && audience === "adult") setAudience("kids");
  };

  return (
    <motion.section
      id="hero"
      onPanEnd={coarse ? handlePanEnd : undefined}
      style={{ touchAction: "pan-y", background: PLACEHOLDER[audience] }}
      className="relative isolate h-svh min-h-[660px] overflow-hidden"
    >
      <HeroBackdrop audience={audience} originRef={toggleRef} />

      <div className="relative z-10 flex h-full flex-col items-center px-5 pt-[max(7rem,14vh)] text-center">
        <div className="flex w-full max-w-3xl flex-col items-center">
          {/* Tagline resmi sebagai jargon kecil */}
          <p className={`font-hand text-lg transition-colors duration-500 sm:text-xl ${isKids ? "text-cobalt" : "text-sun"}`}>
            {TAGLINE}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={audience}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)", transition: { duration: reduce ? 0 : 0.2 } }}
              transition={{ duration: reduce ? 0 : 0.45, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <h1
                className={
                  isKids
                    ? "mt-3 font-display text-[2.6rem] leading-[1.04] text-balance text-cobalt-900 sm:text-6xl lg:text-[4.25rem]"
                    : "mt-3 font-sans text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-white [text-shadow:0_2px_24px_rgba(20,24,90,0.35)] sm:text-6xl lg:text-[4.25rem]"
                }
              >
                {content.title}
              </h1>
              <p
                className={`mt-4 max-w-md text-[15px] leading-relaxed text-pretty sm:text-base ${isKids ? "text-ink/75" : "text-white/85"}`}
              >
                {content.sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Toggle = elemen utama hero */}
          <div ref={toggleRef} className="mt-8 flex w-full flex-col items-center gap-2.5">
            <p
              className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${isKids ? "text-cobalt-900/55" : "text-white/65"}`}
            >
              Kelasnya untuk siapa?
            </p>
            <AudienceToggle size="lg" tone="stage" />
          </div>

          <TrialButton variant={isKids ? "dark" : "sunPill"} size="sm" className="mt-5">
            {CTA.trial.label}
            <ArrowIcon />
          </TrialButton>
        </div>

        {/* OTORITAS: bukti kompetensi bahasa Inggris. Disembunyikan di layar pendek agar tidak menumpuk. */}
        <ul className="absolute inset-x-4 bottom-5 hidden flex-wrap justify-center gap-2 [@media(min-height:740px)]:flex">
          {content.authority.map((a) => (
            <li
              key={a}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md sm:text-[13px] ${
                isKids ? "bg-white/80 text-cobalt-900 ring-1 ring-white" : "bg-[#14162A]/70 text-white ring-1 ring-white/20"
              }`}
            >
              {a}
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
