"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AUDIENCE_OPTIONS, type Audience } from "@/lib/content";
import { useAudience, type Choice } from "./audience-provider";

/**
 * Toggle "Anak & Remaja / Dewasa & Bisnis".
 *  - size="lg" + tone="stage": di hero, gayanya ikut berubah mengikuti dunia yang aktif.
 *  - size="sm": di navbar setelah scroll, label pendek ("Anak" / "Dewasa").
 */

/** Label tiap pilihan selalu memakai font dunianya sendiri, jadi sudah jadi "preview". */
const OPTION_FONT: Record<Choice, string> = {
  kids: "font-display tracking-wide",
  adult: "font-sans font-bold tracking-tight",
  corporate: "font-sans font-bold tracking-tight",
};

/** Pilihan ke-3 (percobaan): hero jendela pesawat. Isi section di bawahnya sama dengan Dewasa. */
const OPTIONS: { id: Choice; label: string; short: string }[] = [
  ...AUDIENCE_OPTIONS,
  { id: "corporate", label: "Corporate", short: "Corporate" },
];

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 15.5v-1.7l-8-5V3.5a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.7l8-2.5v4.6l-2 1.5V22l3.5-1 3.5 1v-1.4l-2-1.5V13z" />
    </svg>
  );
}

function KiteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l7 8-7 9-7-9 7-8z" fill="currentColor" />
      <path d="M12 19c1 1.5-.5 2.5.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="3" fill="currentColor" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

type Tone = "stage" | "dark";

function trackClass(tone: Tone) {
  if (tone === "stage") {
    // kaca buram di atas lukisan
    return "bg-white/60 ring-1 ring-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(30,47,120,0.18)]";
  }
  return "bg-mist-50 ring-2 ring-mist";
}

function pillClass(audience: Audience) {
  return audience === "kids"
    ? "bg-sun shadow-[0_3px_0_0_var(--color-sun-600)]"
    : "bg-cobalt shadow-[0_3px_0_0_var(--color-cobalt-900)]";
}

export function AudienceToggle({
  size = "lg",
  tone = "stage",
}: {
  size?: "lg" | "sm";
  tone?: Tone;
}) {
  const { audience, choice, setChoice } = useAudience();
  const groupId = useId();
  const reduce = useReducedMotion();
  const isLg = size === "lg";

  return (
    <div
      role="radiogroup"
      aria-label="Pilih kelas untuk siapa"
      className={`relative inline-flex rounded-full p-1.5 transition-[background-color,box-shadow] duration-500 ${trackClass(tone)} ${isLg ? "w-full max-w-[36rem]" : ""}`}
    >
      {OPTIONS.map((option) => {
        const active = choice === option.id;
        const activeText = audience === "kids" ? "text-ink" : "text-white";
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            onClick={() => setChoice(option.id)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full whitespace-nowrap transition-colors duration-200 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-sky ${
              OPTION_FONT[option.id]
            } ${isLg ? "px-2.5 py-2.5 text-[14px] sm:px-5 sm:text-base" : "px-2 py-1.5 text-[13px] sm:px-3 sm:text-sm"} ${
              active ? activeText : "text-ink/55 hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`pill-${groupId}`}
                aria-hidden
                className={`absolute inset-0 -z-10 rounded-full transition-colors duration-300 ${pillClass(audience)}`}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            {option.id === "kids" ? <KiteIcon /> : option.id === "adult" ? <BriefcaseIcon /> : <PlaneIcon />}
            {isLg ? (
              <>
                <span className="sm:hidden">{option.short}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </>
            ) : option.id === "corporate" ? (
              "Corp."
            ) : (
              option.short
            )}
          </button>
        );
      })}
    </div>
  );
}
