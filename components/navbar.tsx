"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, NAV_LINKS } from "@/lib/content";
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
 *  - Di atas hero: bersih, hanya logo + menu (toggle & CTA sudah ada di hero).
 *  - Setelah lewat hero: toggle kecil + tombol "Coba Kelas Gratis" muncul.
 *    Di HP, CTA muncul sebagai tombol melayang di bawah layar.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const past = useSyncExternalStore(subscribeScroll, getPastHero, getPastHeroServer);
  const reduce = useReducedMotion();
  const t = { duration: reduce ? 0 : 0.2 };

  return (
    <>
      <header className="fixed inset-x-0 top-6 z-50 px-6 sm:top-8 sm:px-8">
        <nav
          aria-label="Navigasi utama"
          className={`mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border-2 py-2 pr-2 pl-4 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 sm:pl-5 ${
            past
              ? "border-mist bg-white/95 shadow-[0_4px_0_0_var(--color-mist)]"
              : "border-white/50 bg-white/75 shadow-none"
          }`}
        >
          {/* TODO: ganti dengan logo asli (SVG/PNG) di /public */}
          <Link href="/" className="flex items-center gap-2 justify-self-start" aria-label="English Now, beranda">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cobalt font-display text-lg text-sun">
              E
            </span>
            <span
              className={`font-display text-xl leading-none whitespace-nowrap text-cobalt-900 ${
                past ? "hidden sm:inline" : ""
              }`}
            >
              English <span className="text-cobalt">Now</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 xl:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink/80 transition-colors hover:bg-mist-50 hover:text-cobalt"
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
              className="grid size-11 place-items-center rounded-full bg-mist-50 text-cobalt-900 xl:hidden"
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
