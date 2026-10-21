"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { CTA, trialContent } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { Button } from "./ui/button";
import { SafeImage } from "./ui/safe-image";

/**
 * Section ajakan utama: "tiket" trial class gratis.
 *  - Latar section sama dengan FAQ & footer, jadi tidak ada kotak gelap yang memutus halaman.
 *  - Di belakang tiket ada deretan kapsul keuntungan (Gratis, Tanpa komitmen, …) selebar layar
 *    yang berjalan pelan, kelanjutan dari konsep kapsul sebelumnya.
 *  - Tiketnya sendiri yang menonjol: warna pekat, sobekan berlubang, potongan tiket berisi foto
 *    kelas, dan cap "GRATIS" yang "dicapkan" saat tiket terlihat. Tiket sedikit miring
 *    mengikuti kursor.
 */
export function StartSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = trialContent[audience];
  const bg = SECTION_BG[audience];

  return (
    <section id="coba-gratis" className="relative isolate overflow-hidden" style={{ background: bg }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.35 }}
          className="relative flex flex-col items-center pt-16 pb-28 sm:pt-20 sm:pb-36"
        >
          <PerkBand perks={c.perks} kids={kids} reduce={reduce} />
          <Ticket kids={kids} reduce={reduce} bg={bg} />
          {kids && (
            <a href={CTA.levelHref} className="relative mt-10 text-sm font-semibold text-cobalt underline-offset-4 hover:underline">
              Ingin cek level dulu? Tes online di sini →
            </a>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ---------- tiket ---------- */

function Ticket({ kids, reduce, bg }: { kids: boolean; reduce: boolean; bg: string }) {
  const { audience } = useAudience();
  const c = trialContent[audience];
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, (v) => v * -5), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(px, (v) => v * 7), { stiffness: 120, damping: 18 });

  const face = kids ? "bg-cobalt text-white shadow-[0_10px_0_0_var(--color-cobalt-900),0_40px_80px_-30px_rgba(30,47,120,0.6)]" : "bg-[#14162A] text-white shadow-[0_40px_90px_-30px_rgba(20,22,42,0.65)]";
  const notch = "absolute z-10 size-9 rounded-full";

  return (
    <div className="relative w-full max-w-5xl px-5" style={{ perspective: 1400 }}>
      <motion.div
        ref={ref}
        initial={reduce ? false : { opacity: 0, y: 60, rotate: -4 }}
        whileInView={{ opacity: 1, y: 0, rotate: kids ? -1.5 : 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ type: "spring", stiffness: 70, damping: 14 }}
        onPointerMove={(e) => {
          if (reduce || e.pointerType !== "mouse") return;
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          px.set((e.clientX - r.left) / r.width - 0.5);
          py.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
        style={{ rotateX: rx, rotateY: ry }}
        className={`relative flex flex-col md:flex-row ${kids ? "rounded-[2.2rem]" : "rounded-[1.75rem]"} ${face}`}
      >
        {/* bagian utama */}
        <div className="relative flex-1 p-7 sm:p-10 lg:p-12">
          <p className={kids ? "font-hand text-xl text-sun" : "text-sm font-medium tracking-[0.2em] text-white/50 uppercase"}>
            {kids ? "Tiket kelas pertama" : "Free trial pass"}
          </p>
          <h2
            className={
              kids
                ? "mt-2 font-display text-[2.8rem] leading-[0.98] sm:text-7xl"
                : "mt-3 text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.045em] sm:text-[4.2rem]"
            }
          >
            {c.title.split(", ")[0]},<br />
            <span className={kids ? "text-sun" : "text-[#F4C77B]"}>{c.title.split(", ")[1]}</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75 sm:text-base">{c.sub}</p>

          {/* langkah, dicetak seperti kolom di tiket */}
          <ol className="mt-7 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/15">
            {c.steps.map((s, i) => (
              <li key={s} className={`px-3 py-3 ${kids ? "bg-cobalt" : "bg-[#14162A]"}`}>
                <span className={`text-[11px] font-semibold tracking-wider ${i === 1 ? (kids ? "text-sun" : "text-[#F4C77B]") : "text-white/45"}`}>
                  0{i + 1}
                </span>
                <p className="mt-0.5 text-[13px] leading-tight font-semibold sm:text-sm">{s}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button href={c.cta.href} variant={kids ? "sun" : "sunPill"} size="md" className="px-7 text-lg">
              {c.cta.label}
              <WaIcon />
            </Button>
            <p className="max-w-[15rem] text-xs leading-snug text-white/55">{c.note}</p>
          </div>
        </div>

        {/* sobekan: garis putus-putus + dua lubang setengah lingkaran */}
        <div aria-hidden className="relative h-0 md:h-auto md:w-0">
          <span className="absolute inset-x-7 top-0 border-t-2 border-dashed border-white/25 md:inset-x-auto md:inset-y-7 md:left-0 md:border-t-0 md:border-l-2" />
          <span className={`${notch} top-0 -left-[1.125rem] -translate-y-1/2 md:-top-[1.125rem] md:left-0 md:-translate-x-1/2 md:translate-y-0`} style={{ background: bg }} />
          <span className={`${notch} top-0 -right-[1.125rem] -translate-y-1/2 md:top-auto md:right-auto md:-bottom-[1.125rem] md:left-0 md:-translate-x-1/2 md:translate-y-0`} style={{ background: bg }} />
        </div>

        {/* potongan tiket: foto kelas + cap GRATIS */}
        <div className="relative p-4 md:w-[19rem] md:p-5">
          <div className={`relative h-56 overflow-hidden md:h-full ${kids ? "rounded-[1.6rem]" : "rounded-2xl"}`}>
            <SafeImage src={c.photo} alt="" fill sizes="(min-width: 768px) 300px, 90vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 text-xs font-semibold tracking-[0.18em] text-white/90 uppercase">1 kelas · 0 rupiah</p>
          </div>
          <Stamp kids={kids} reduce={reduce} />
        </div>
      </motion.div>
    </div>
  );
}

/** cap bundar "GRATIS" yang dicapkan ke tiket (membesar lalu menghentak) */
function Stamp({ kids, reduce }: { kids: boolean; reduce: boolean }) {
  const ink = kids ? "#FFF275" : "#F4C77B";
  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -40 }}
      whileInView={{ scale: 1, opacity: 1, rotate: -14 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.55 }}
      className="absolute -right-3 -bottom-6 size-28 sm:size-32 md:top-[-2.5rem] md:right-[-2.5rem] md:bottom-auto"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]">
        <defs>
          <path id="stamp-ring" d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
        </defs>
        <circle cx="60" cy="60" r="56" fill={kids ? "#1E2F78" : "#14162A"} />
        <circle cx="60" cy="60" r="52" fill="none" stroke={ink} strokeWidth="2.5" />
        <circle cx="60" cy="60" r="31" fill="none" stroke={ink} strokeWidth="1.5" strokeDasharray="3 3" />
        <text fontSize="10" fontWeight="700" letterSpacing="2.6" fill={ink}>
          <textPath href="#stamp-ring">FREE TRIAL CLASS · ENGLISH NOW ·</textPath>
        </text>
        <text x="60" y="66" textAnchor="middle" fontSize="17" fontWeight="800" fill={ink} style={{ fontFamily: kids ? "var(--font-display)" : undefined }}>
          GRATIS
        </text>
      </svg>
    </motion.div>
  );
}

/* ---------- deretan kapsul di belakang tiket ---------- */

const TONES = [
  { bg: "linear-gradient(135deg,#FFF275,#F5B83A)", fg: "text-cobalt-900" },
  { bg: "linear-gradient(135deg,#07A9F8,#405FDA)", fg: "text-white" },
  { bg: "linear-gradient(135deg,#07A9F8,#7FD6A8)", fg: "text-cobalt-900" },
  { bg: "linear-gradient(135deg,#405FDA,#B9AAF2)", fg: "text-white" },
];

function PerkBand({ perks, kids, reduce }: { perks: string[]; kids: boolean; reduce: boolean }) {
  const list = [...perks, ...perks, ...perks];
  const row = (rev: boolean, offset: number) => (
    <div
      className="flex w-max gap-4"
      style={{ animation: reduce ? undefined : `wall-${rev ? "right" : "left"} ${rev ? 60 : 50}s linear infinite` }}
    >
      {[...list, ...list].map((p, i) => {
        const t = TONES[(i + offset) % TONES.length];
        return (
          <span
            key={i}
            className={`flex h-20 shrink-0 items-center gap-3 rounded-full px-8 sm:h-28 sm:px-10 ${t.fg} ${kids ? "font-display text-xl sm:text-3xl" : "text-lg font-semibold sm:text-2xl"}`}
            style={{ background: t.bg, opacity: kids ? 1 : 0.9 }}
          >
            <svg viewBox="0 0 24 24" className="size-6 sm:size-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {p}
          </span>
        );
      })}
    </div>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 -rotate-3 flex-col gap-4">
      {row(false, 0)}
      {row(true, 2)}
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}
