"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { CONTACT, CTA, TAGLINE, footerContent } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { FooterBackdrop } from "./footer-backdrop";
import { useTrial } from "./trial-modal";

/**
 * Footer. Latarnya versi sederhana dari dunia hero (bukit & awan untuk Anak, siluet kota senja
 * untuk Dewasa) yang tipis di belakang semua isi footer, ditambah berkas cahaya yang mengikuti kursor.
 * Semuanya SVG/CSS statis (tanpa canvas), jadi ringan.
 */
export function Footer() {
  const { audience } = useAudience();
  const kids = audience === "kids";
  const { open: openTrial } = useTrial();
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(40% 120% at ${sx}% 60%, ${kids ? "#FFF275" : "#F4B48F"} 0%, ${kids ? "#07A9F8" : "#405FDA"} 45%, #1E2F78 100%)`;
  const bg = SECTION_BG[audience];

  return (
    <footer
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (r) mx.set(((e.clientX - r.left) / r.width) * 100);
      }}
      className="relative isolate overflow-hidden"
      style={{ background: bg }}
    >
      <FooterBackdrop kids={kids} x={sx} />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-5 pt-12 sm:pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* identitas */}
        <div>
          <Link href="/" className="flex items-center gap-2" aria-label="English Now, beranda">
            <Image src="/brand/logo-full.png" alt="English Now" width={955} height={412} className="h-14 w-auto" />
          </Link>
          <p className="mt-2 font-hand text-lg text-cobalt">{TAGLINE}</p>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/70">{footerContent.blurb}</p>
          <button
            type="button"
            onClick={openTrial}
            className={`mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              kids ? "bg-sun text-cobalt-900 shadow-[0_4px_0_0_var(--color-sun-600)] hover:-translate-y-0.5" : "bg-cobalt-900 text-white hover:bg-cobalt-700"
            }`}
          >
            {CTA.trial.label} →
          </button>
        </div>

        {/* tautan & kontak */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerContent.columns.map((col) => (
            <div key={col.title}>
              <p className={kids ? "font-display text-lg leading-7 text-cobalt-900" : "text-sm leading-7 font-semibold text-cobalt-900"}>{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[15px] text-ink/65 transition hover:text-cobalt">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-1">
            <p className={kids ? "font-display text-lg leading-7 text-cobalt-900" : "text-sm leading-7 font-semibold text-cobalt-900"}>Kontak</p>
            <ul className="mt-4 space-y-2.5 text-[15px] text-ink/65">
              <li>
                <a href={CTA.consult.href} target="_blank" rel="noopener noreferrer" className="transition hover:text-cobalt">
                  WhatsApp admin
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="transition hover:text-cobalt">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="transition hover:text-cobalt">
                  {CONTACT.addressShort}
                </a>
              </li>
              <li>{CONTACT.hours}</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {CONTACT.social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-cobalt-900 ring-1 ring-ink/10 transition hover:bg-cobalt hover:text-white"
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* tulisan raksasa dengan pendar yang mengikuti kursor */}
      {/* tinggi tetap supaya footer Anak & Dewasa berukuran sama, walau fontnya beda */}
      <div className="relative z-10 mt-20 flex h-[19vw] items-end justify-center overflow-hidden px-3 select-none" aria-hidden>
        <motion.p
          style={{ backgroundImage: glow }}
          className={`bg-clip-text pb-[0.12em] text-center leading-none whitespace-nowrap text-transparent ${
            kids ? "font-display text-[15.5vw]" : "text-[15.5vw] font-semibold tracking-[-0.06em]"
          }`}
        >
          English Now
        </motion.p>
      </div>

      <p className="relative z-10 pt-4 pb-8 text-center"><span className="rounded-full bg-white/80 px-3 py-1 text-xs text-ink/65 backdrop-blur-sm">© 2026 · Semua hak dilindungi.</span></p>
    </footer>
  );
}
