"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, NAV_LINKS } from "@/lib/content";
import { useAudience } from "./audience-provider";
import { AudienceToggle } from "./audience-toggle";
import { TrialButton } from "./trial-modal";

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
 *  - Di atas hero: transparan, menyatu dengan ilustrasi hero; hanya logo + menu
 *    (toggle & CTA sudah ada di hero). Tetap terlihat selama masih di hero.
 *  - Setelah lewat hero: bersembunyi saat menggulir ke bawah, muncul lagi sebagai pil kaca
 *    (dengan toggle kecil + Free Trial Class) begitu pengunjung menggulir ke atas.
 *    Di HP, tombol bawah ada di dok asisten (guide-chat.tsx).
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const past = useSyncExternalStore(subscribeScroll, getPastHero, getPastHeroServer);
  const { audience } = useAudience();
  const kids = audience === "kids";
  const reduce = useReducedMotion();
  const t = { duration: reduce ? 0 : 0.2 };
  const glass = past || open;
  // teks gelap di atas latar terang (kaca, atau hero Anak); teks putih di atas hero Dewasa
  const light = glass || kids;

  // sembunyi saat gulir ke bawah setelah hero, muncul saat gulir ke atas
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    lastY.current = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) < 6) return;
      setHidden(dy > 0 && y > window.innerHeight * 0.8);
      lastY.current = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const hide = hidden && !open;

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[padding,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{ padding: glass ? "14px 16px 0" : "0", transform: hide ? "translateY(-120%)" : "none" }}
      >
        <nav
          aria-label="Navigasi utama"
          className={`relative mx-auto overflow-hidden transition-[max-width,border-radius,box-shadow,border-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
            glass
              ? "rounded-[2rem] border border-white/70 shadow-[0_12px_40px_-16px_rgba(30,47,120,0.35)] backdrop-blur-xl backdrop-saturate-150"
              : "rounded-none border border-transparent"
          }`}
          style={{ maxWidth: glass ? "74rem" : "100vw" }}
        >
          {/* latar kaca, hanya setelah lewat hero */}
          <span aria-hidden className="absolute inset-0 bg-white/60 transition-opacity duration-500" style={{ opacity: glass ? 1 : 0 }} />

          <div className={`relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 transition-[padding] duration-500 ${glass ? "py-2 pr-2 pl-4 sm:pl-5" : "px-5 py-3"}`}>
            <Link href="/" className="relative flex h-10 items-center justify-self-start" aria-label="English Now, beranda">
              {/* logo lengkap; di HP setelah lewat hero cukup simbolnya saja */}
              <span className={`relative block h-10 w-[5.8rem] sm:h-11 sm:w-[6.4rem] ${past ? "hidden sm:block" : ""}`}>
                <Image src="/brand/logo-full.png" alt="English Now" fill priority sizes="96px" className={`object-contain object-left transition-opacity duration-500 ${light ? "opacity-100" : "opacity-0"}`} />
                <Image src="/brand/logo-full-white.png" alt="" fill priority sizes="96px" className={`object-contain object-left transition-opacity duration-500 ${light ? "opacity-0" : "opacity-100"}`} />
              </span>
              {past && (
                <span className="relative block h-9 w-8 sm:hidden">
                  <Image src="/brand/logo-mark.png" alt="English Now" fill sizes="32px" className="object-contain" />
                </span>
              )}
            </Link>

            <ul className="hidden items-center gap-1 xl:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                      light ? "text-ink/80 hover:bg-white/70 hover:text-cobalt" : "text-white/85 hover:bg-white/15 hover:text-white"
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
                    <TrialButton size="sm" variant="dark">
                      {CTA.trial.label}
                    </TrialButton>
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
                  light ? "bg-white/80 text-cobalt-900" : "bg-white/15 text-white"
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
              <TrialButton variant="dark" className="mt-2 w-full">
                {CTA.trial.label}
              </TrialButton>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HP: tombol melayang di bawah ada di components/guide-chat.tsx (dok asisten + Free Trial) */}
    </>
  );
}
