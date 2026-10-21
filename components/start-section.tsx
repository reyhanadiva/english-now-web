"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, galleryContent, trialContent } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { Button } from "./ui/button";
import { SafeImage } from "./ui/safe-image";

/**
 * Section ajakan utama: kelas percobaan gratis (satu fokus, satu tombol).
 * Foto kelas memenuhi layar. Di tengahnya ada deretan kapsul: kapsul tengah berupa
 * "bingkai" berisi judul, diapit kapsul berwarna dengan tanda centang yang meluncur masuk.
 * Di bawahnya: tiga langkah singkat + satu tombol WhatsApp.
 */
export function StartSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = trialContent[audience];

  return (
    <section id="coba-gratis" className="relative isolate overflow-hidden text-white" style={{ background: SECTION_BG[audience] }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.35 }}
          className="relative flex min-h-[115svh] flex-col items-center justify-center py-40 sm:py-48"
        >
          {/* dinding foto miring yang bergerak pelan; tepi atas & bawahnya memudar ke warna
              section FAQ dan footer, jadi tidak terlihat seperti kotak terpisah */}
          <PhotoWall photos={galleryContent[audience].photos} dark={kids ? "30,47,120" : "20,22,40"} kids={kids} reduce={reduce} />

          {/* deretan kapsul */}
          <CapsuleRow title={c.title} perks={c.perks} kids={kids} reduce={reduce} />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex max-w-xl flex-col items-center px-5 text-center"
          >
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">{c.sub}</p>

            <ol className="mt-6 flex flex-wrap justify-center gap-2">
              {c.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-2 rounded-full bg-white/12 py-1.5 pr-3.5 pl-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur-md">
                  <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i === 1 ? "bg-sun text-cobalt-900" : "bg-white/90 text-cobalt-900"}`}>
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>

            <Button href={c.cta.href} variant={kids ? "sun" : "sunPill"} size="md" className="mt-8 px-8 text-lg">
              {c.cta.label}
              <WaIcon />
            </Button>
            <p className="mt-3 text-xs text-white/65">{c.note}</p>
            {kids && (
              <a href={CTA.levelHref} className="mt-4 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">
                Ingin cek level dulu? Tes online di sini →
              </a>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Grid foto miring (perspektif + rotasi), baris-barisnya bergeser kiri/kanan bergantian.
 * Seluruh lapisan gelap di-mask: memudar di atas & bawah ke warna section sekitarnya.
 */
function PhotoWall({ photos, dark, kids, reduce }: { photos: string[]; dark: string; kids: boolean; reduce: boolean }) {
  const rows = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, k) => photos[(r * 5 + k * 3) % photos.length]));
  // pudar dengan kurva halus (bukan garis lurus) supaya peralihan terang→gelap tidak terlihat abu-abu
  const fade =
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 6%, rgba(0,0,0,0.3) 12%, rgba(0,0,0,0.7) 19%, #000 26%, #000 74%, rgba(0,0,0,0.7) 81%, rgba(0,0,0,0.3) 88%, rgba(0,0,0,0.08) 94%, transparent 100%)";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ maskImage: fade, WebkitMaskImage: fade }}>
      <div className="absolute inset-0" style={{ background: `rgb(${dark})` }} />
      <div className="absolute inset-0 grid place-items-center overflow-hidden">
        <div
          className="flex w-[240vw] flex-col gap-4 sm:w-[170vw] sm:gap-5"
          style={{ transform: "perspective(1600px) rotateX(22deg) rotateZ(-9deg)" }}
        >
          {rows.map((row, r) => (
            <div
              key={r}
              className="flex w-max gap-4 sm:gap-5"
              style={{ animation: reduce ? undefined : `wall-${r % 2 ? "right" : "left"} ${90 + r * 14}s linear infinite` }}
            >
              {[...row, ...row].map((src, k) => (
                <div
                  key={k}
                  className={`relative aspect-[16/10] w-[42vw] shrink-0 overflow-hidden bg-white/5 sm:w-[22vw] ${kids ? "rounded-[1.6rem]" : "rounded-2xl"}`}
                >
                  <SafeImage src={src} alt="" fill sizes="(min-width: 640px) 22vw, 42vw" className="object-cover" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* redupkan foto + vignette supaya judul & tombol tetap jelas */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 55% 45% at 50% 50%, rgba(${dark},0.82) 0%, rgba(${dark},0.6) 55%, rgba(${dark},0.85) 100%)`,
        }}
      />
    </div>
  );
}

const CHECK = (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0 sm:size-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Deretan kapsul selebar layar. Kapsul = "apa yang Anda dapat" di trial class
 * (gratis, tanpa komitmen, dst.), masing-masing dengan tanda centang.
 * Kapsul paling luar terpotong tepi layar, jadi terasa terus berlanjut.
 */
function CapsuleRow({ title, perks, kids, reduce }: { title: string; perks: string[]; kids: boolean; reduce: boolean }) {
  const tones = [
    { bg: "linear-gradient(135deg,#FFF275,#F5B83A)", fg: "text-cobalt-900" },
    { bg: "linear-gradient(135deg,#07A9F8,#405FDA)", fg: "text-white" },
    { bg: "linear-gradient(135deg,#07A9F8,#7FD6A8)", fg: "text-cobalt-900" },
    { bg: "linear-gradient(135deg,#405FDA,#B9AAF2)", fg: "text-white" },
  ];
  const slide = (from: number, delay: number) =>
    reduce
      ? {}
      : {
          initial: { x: from, opacity: 0 },
          whileInView: { x: 0, opacity: 1 },
          viewport: { once: true, margin: "-80px" },
          transition: { type: "spring" as const, stiffness: 90, damping: 18, delay },
        };
  const cap = "flex h-20 items-center rounded-full shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] sm:h-32";
  const perk = (i: number, from: number, delay: number, extra = "") => (
    <motion.div
      {...slide(from, delay)}
      className={`${cap} ${tones[i].fg} shrink-0 gap-2.5 px-6 font-semibold lg:px-8 ${extra}`}
      style={{ background: tones[i].bg }}
    >
      {CHECK}
      <span className={kids ? "font-display text-lg tracking-wide lg:text-2xl" : "text-base lg:text-xl"}>{perks[i]}</span>
    </motion.div>
  );

  return (
    <div className="flex w-full items-center gap-3 sm:gap-4">
      {/* ujung kiri: terpotong tepi layar */}
      <motion.div {...slide(-200, 0.35)} className={`${cap} -ml-10 min-w-12 flex-1`} style={{ background: tones[3].bg }} />
      {perk(0, -160, 0.2, "hidden md:flex")}
      {perk(1, -160, 0.05, "hidden xl:flex")}

      {/* bingkai tengah berisi judul */}
      <motion.div
        initial={reduce ? false : { scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid h-20 w-[min(70vw,24rem)] shrink-0 place-items-center px-6 sm:h-32"
      >
        <Brackets />
        <h2
          className={
            kids
              ? "relative text-center font-display text-[1.8rem] leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-5xl"
              : "relative text-center text-[1.7rem] leading-none font-semibold tracking-[-0.03em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-[2.8rem]"
          }
        >
          {title}
        </h2>
      </motion.div>

      {perk(2, 160, 0.05, "hidden xl:flex")}
      {perk(3, 160, 0.2, "hidden md:flex")}
      {/* ujung kanan: terpotong tepi layar */}
      <motion.div {...slide(200, 0.35)} className={`${cap} -mr-10 min-w-12 flex-1`} style={{ background: tones[0].bg }} />
    </div>
  );
}

/** sudut-sudut bingkai bergradasi di kiri & kanan kapsul tengah */
function Brackets() {
  return (
    <svg aria-hidden viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <linearGradient id="br-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF275" />
          <stop offset="1" stopColor="#07A9F8" />
        </linearGradient>
        <linearGradient id="br-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07A9F8" />
          <stop offset="1" stopColor="#FFF275" />
        </linearGradient>
      </defs>
      <path d="M60 4 H18 a14 14 0 0 0 -14 14 V102 a14 14 0 0 0 14 14 H60" fill="none" stroke="url(#br-l)" strokeWidth="7" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d="M340 4 H382 a14 14 0 0 1 14 14 V102 a14 14 0 0 1 -14 14 H340" fill="none" stroke="url(#br-r)" strokeWidth="7" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}
