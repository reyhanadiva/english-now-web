"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, NAV_LINKS } from "@/lib/content";
import { useAudience } from "./audience-provider";
import { AudienceToggle } from "./audience-toggle";
import { Button } from "./ui/button";

/* "Sudah lewat hero?" dibaca dari posisi scroll. Server selalu false. */
function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}
const getPastHero = () => window.scrollY > window.innerHeight * 0.8;
const getPastHeroServer = () => false;

const pop = {
  initial: { opacity: 0, scale: 0.9, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -4 },
};

/**
 * Navbar melayang.
 *  - Di atas hero: bilah penuh selebar layar, warna solid bergradasi (biru cerah untuk Anak,
 *    navy senja untuk Dewasa), hanya logo + menu (toggle & CTA sudah ada di hero).
 *  - Setelah lewat hero: bilah menyusut jadi pil kaca melayang, lalu toggle kecil +
 *    tombol Free Trial Class muncul.
 *    Di HP, CTA muncul sebagai tombol melayang di bawah layar.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const past = useSyncExternalStore(subscribeScroll, getPastHero, getPastHeroServer);
  const { audience } = useAudience();
  const kids = audience === "kids";
  const reduce = useReducedMotion();
  const t = { duration: reduce ? 0 : 0.2 };
  const glass = past || open;
  // di atas hero: bilah penuh berwarna solid bergradasi. Setelah lewat hero: pil kaca melayang.
  const solid = kids ? "linear-gradient(90deg,#405FDA 0%,#2C8EF0 55%,#07A9F8 100%)" : "linear-gradient(90deg,#14162A 0%,#232857 60%,#34307A 100%)";

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{ padding: glass ? "14px 16px 0" : "0" }}
      >
        <nav
          aria-label="Navigasi utama"
          className={`relative mx-auto overflow-hidden transition-[max-width,border-radius,box-shadow,border-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
            glass
              ? "rounded-[2rem] border border-white/70 shadow-[0_12px_40px_-16px_rgba(30,47,120,0.35)] backdrop-blur-xl backdrop-saturate-150"
              : "rounded-none border border-transparent shadow-[0_8px_30px_-18px_rgba(10,16,60,0.6)]"
          }`}
          style={{ maxWidth: glass ? "74rem" : "100vw" }}
        >
          {/* dua latar yang saling memudar: solid (atas) dan kaca (setelah hero) */}
          <span aria-hidden className="absolute inset-0 transition-opacity duration-500" style={{ background: solid, opacity: glass ? 0 : 1 }} />
          <span aria-hidden className="absolute inset-0 bg-white/60 transition-opacity duration-500" style={{ opacity: glass ? 1 : 0 }} />
          {/* kilau tipis di bilah solid */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent transition-opacity duration-500"
            style={{ opacity: glass ? 0 : 1 }}
          />

          <div className={`relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 transition-[padding] duration-500 ${glass ? "py-2 pr-2 pl-4 sm:pl-5" : "px-5 py-3"}`}>
            {/* TODO: ganti dengan logo asli (SVG/PNG) di /public */}
            <Link href="/" className="flex items-center gap-2 justify-self-start" aria-label="English Now, beranda">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg font-display text-lg transition-colors duration-500 ${
                  glass ? "bg-cobalt text-sun" : "bg-white/95 text-cobalt"
                }`}
              >
                E
              </span>
              <span
                className={`font-display text-xl leading-none whitespace-nowrap transition-colors duration-500 ${glass ? "text-cobalt-900" : "text-white"} ${
                  past ? "hidden sm:inline" : ""
                }`}
              >
                English <span className={glass ? "text-cobalt" : "text-sun"}>Now</span>
              </span>
            </Link>

            <ul className="hidden items-center gap-1 xl:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                      glass ? "text-ink/80 hover:bg-white/70 hover:text-cobalt" : "text-white/85 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex min-h-11 items-center gap-2 justify-self-end">
              <AnimatePresence initial={false}>
                {past && (
                  <motion.div key="toggle" {...pop} transition={t}>
                    <AudienceToggle size="sm" tone="dark" />
                  </motion.div>
                )}
                {past && (
                  <motion.div key="cta" {...pop} transition={{ ...t, delay: reduce ? 0 : 0.05 }} className="hidden sm:block">
                    <Button href={CTA.trial.href} size="sm" variant="dark">
                      {CTA.trial.label}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Tutup menu" : "Buka menu"}
                onClick={() => setOpen((v) => !v)}
                className={`grid size-11 place-items-center rounded-full transition-colors xl:hidden ${
                  glass ? "bg-white/80 text-cobalt-900" : "bg-white/15 text-white"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  {open ? (
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  ) : (
                    <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={t}
              className="mx-auto mt-2 max-w-6xl rounded-3xl border-2 border-mist bg-white p-3 shadow-[0_4px_0_0_var(--color-mist)] xl:hidden"
            >
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl px-4 py-3 font-semibold text-ink hover:bg-mist-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Button href={CTA.trial.href} variant="dark" className="mt-2 w-full">
                {CTA.trial.label}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HP: CTA melayang di bawah layar setelah lewat hero */}
      <AnimatePresence>
        {past && !open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={t}
            className="fixed inset-x-4 bottom-4 z-50 sm:hidden"
          >
            <Button href={CTA.trial.href} variant="dark" className="w-full">
              {CTA.trial.label}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
