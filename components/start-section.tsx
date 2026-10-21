"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, galleryContent, trialContent } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { Button } from "./ui/button";
import { SafeImage } from "./ui/safe-image";

/**
 * Section penutup: galeri + ajakan trial class dalam satu layar.
 * Latarnya dinding foto kelas yang miring & bergeser pelan, digelapkan dengan vignette
 * (foto-foto ini menggantikan section Galeri yang terpisah). Di tengahnya hanya:
 * judul besar, satu kalimat, satu tombol WhatsApp, dan satu baris keuntungan.
 * Tepi atas & bawahnya memudar singkat ke warna FAQ dan footer.
 */
export function StartSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = trialContent[audience];
  const [lead, accent] = c.title.split(", ");

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section id="coba-gratis" className="relative isolate overflow-hidden text-white" style={{ background: SECTION_BG[audience] }}>
      <span id="galeri" className="absolute top-0" aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.35 }}
          className="relative flex min-h-[105svh] flex-col items-center justify-center px-5 py-36 text-center sm:py-44"
        >
          <PhotoWall photos={galleryContent[audience].photos} dark={kids ? "14,22,66" : "11,12,22"} kids={kids} reduce={reduce} />

          <motion.h2
            {...rise(0)}
            className={
              kids
                ? "max-w-4xl font-display text-[3.2rem] leading-[0.98] text-balance sm:text-8xl"
                : "max-w-4xl text-[3rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-8xl"
            }
          >
            {lead}
            {accent && (
              <>
                , <span className={kids ? "text-sun" : "text-white/45"}>{accent}</span>
              </>
            )}
          </motion.h2>

          <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            {c.sub}
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-10 flex flex-col items-center">
            <Button href={c.cta.href} variant={kids ? "sun" : "sunPill"} size="md" className="px-8 text-lg">
              {c.cta.label}
              <WaIcon />
            </Button>
            <p className="mt-5 flex max-w-md flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-white/55">
              {c.perks.map((p, i) => (
                <span key={p} className="whitespace-nowrap">
                  {i > 0 && <span className="mr-2">·</span>}
                  {p}
                </span>
              ))}
            </p>
            {kids && (
              <a href={CTA.levelHref} className="mt-6 text-sm font-semibold text-white/75 underline-offset-4 hover:text-white hover:underline">
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
 * Seluruh lapisan gelap di-mask: memudar singkat di atas & bawah ke warna section sekitarnya.
 */
function PhotoWall({ photos, dark, kids, reduce }: { photos: string[]; dark: string; kids: boolean; reduce: boolean }) {
  const rows = Array.from({ length: 9 }, (_, r) => Array.from({ length: 8 }, (_, k) => photos[(r * 5 + k * 3) % photos.length]));
  // pudar singkat dengan kurva halus, supaya tidak ada pita abu-abu yang panjang
  const fade =
    "linear-gradient(180deg, transparent 0, rgba(0,0,0,0.35) 50px, rgba(0,0,0,0.8) 110px, #000 160px, #000 calc(100% - 160px), rgba(0,0,0,0.8) calc(100% - 110px), rgba(0,0,0,0.35) calc(100% - 50px), transparent 100%)";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ maskImage: fade, WebkitMaskImage: fade }}>
      <div className="absolute inset-0" style={{ background: `rgb(${dark})` }} />
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 flex w-[240vw] flex-col gap-4 sm:w-[170vw] sm:gap-5"
          style={{ transform: "translate(-50%, -50%) perspective(1600px) rotateX(22deg) rotateZ(-9deg)" }}
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
      {/* gelap seperti inspirasi: foto masih terlihat di tengah, pinggirnya tenggelam */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 55% at 50% 50%, rgba(${dark},0.62) 0%, rgba(${dark},0.78) 55%, rgba(${dark},0.97) 100%)`,
        }}
      />
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
