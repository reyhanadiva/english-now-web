"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { galleryContent } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { SafeImage } from "./ui/safe-image";

/**
 * Section Galeri: "dinding melengkung" (sphere wall).
 * Kolom-kolom foto berjalan naik & turun bergantian, kolom di pinggir miring ke dalam
 * seperti dinding silinder. Judul besar di tengah, menyatu lewat pendar warna latar.
 * Bergerak pelan terus; klik foto untuk melihat lebih besar.
 */
export function GallerySection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = galleryContent[audience];
  const [cols, setCols] = useState(7);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setCols(mq.matches ? 4 : 7);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // bagi foto ke kolom, tiap kolom urutannya digeser supaya tidak terlihat berulang
  const columns = Array.from({ length: cols }, (_, i) => {
    const n = c.photos.length;
    return Array.from({ length: 6 }, (_, k) => c.photos[(i * 3 + k * 2) % n]);
  });
  const mid = (cols - 1) / 2;

  return (
    <section id="galeri" className="relative overflow-hidden pt-4 pb-24 sm:pb-32" style={{ background: SECTION_BG[audience] }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={audience} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3 }}>
          <div
            className="relative h-[34rem] sm:h-[44rem] [mask-image:linear-gradient(180deg,transparent,#000_14%,#000_86%,transparent)]"
            style={{ perspective: 1100 }}
          >
            <div className="absolute inset-0 flex justify-center gap-3 sm:gap-4" style={{ transformStyle: "preserve-3d" }}>
              {columns.map((list, i) => {
                const off = i - mid;
                const up = i % 2 === 0;
                return (
                  <div
                    key={i}
                    className="relative w-[9.5rem] shrink-0 sm:w-[13rem]"
                    style={{
                      transform: `rotateY(${off * -9}deg) translateZ(${Math.abs(off) * 28}px)`,
                    }}
                  >
                    <div
                      className="flex flex-col gap-3 sm:gap-4"
                      style={{
                        animation: reduce ? undefined : `gallery-${up ? "up" : "down"} ${70 + (i % 3) * 12}s linear infinite`,
                      }}
                    >
                      {[...list, ...list].map((src, k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setZoom(src)}
                          aria-label="Perbesar foto"
                          className={`relative aspect-[4/3.2] w-full shrink-0 overflow-hidden bg-mist shadow-[0_14px_30px_-18px_rgba(30,47,120,0.55)] transition-transform duration-300 cursor-zoom-in hover:scale-[1.04] ${
                            kids ? "rounded-2xl ring-4 ring-white" : "rounded-xl"
                          }`}
                        >
                          <SafeImage src={src} alt="" fill sizes="220px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* judul: menyatu dengan dinding lewat pendar warna latar di tengah, tanpa kotak */}
            <div
              className="pointer-events-none absolute inset-0 grid place-items-center px-5"
              style={{
                background: `radial-gradient(ellipse 34% 30% at 50% 50%, ${SECTION_BG[audience]} 0%, ${SECTION_BG[audience]}e6 38%, ${SECTION_BG[audience]}00 100%)`,
              }}
            >
              <h2
                className={
                  kids
                    ? "text-center font-display text-5xl leading-[1.02] text-cobalt-900 sm:text-7xl"
                    : "text-center text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-cobalt-900 sm:text-7xl"
                }
              >
                {c.title}
              </h2>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* foto diperbesar */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-cobalt-900/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-3xl ring-4 ring-white"
            >
              <SafeImage src={zoom} alt="" fill sizes="800px" className="object-cover" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
