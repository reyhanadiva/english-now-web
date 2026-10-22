"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CONTACT, CTA } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { KidsClouds } from "./ornaments";
import { Button } from "./ui/button";

/**
 * Section Lokasi: peta Google Maps interaktif (bisa digeser & di-zoom) + alamat, jam buka,
 * dan tombol petunjuk arah. Peta baru dimuat saat section mendekati layar (loading="lazy").
 * Di Dewasa, warna peta sedikit diredam supaya menyatu dengan latar gading.
 */
const Q = encodeURIComponent(`English Now, ${CONTACT.address}`);
const EMBED = `https://maps.google.com/maps?q=${Q}&z=16&output=embed`;
const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${Q}`;

export function LocationSection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const [loaded, setLoaded] = useState(false);

  const rows = [
    { icon: <PinIcon />, title: "Alamat", body: CONTACT.address },
    { icon: <ClockIcon />, title: "Jam buka", body: CONTACT.hours },
  ];

  return (
    <section id="lokasi" className="relative overflow-hidden" style={{ background: SECTION_BG[audience] }}>
      {kids && <KidsClouds className="inset-0" />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-20 sm:pb-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
        >
          <div>
            <h2
              className={
                kids
                  ? "font-display text-4xl leading-[1.05] text-balance text-cobalt-900 sm:text-[3.25rem]"
                  : "text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-cobalt-900 sm:text-5xl"
              }
            >
              {kids ? "Mampir ke kelas kami." : "Kunjungi kami di Bandung."}
            </h2>
            <p className="mt-4 max-w-md text-base text-ink/70">
              {kids
                ? "Ayah dan Bunda bisa melihat langsung suasana kelas, atau datang untuk tes penempatan."
                : "Kelas tatap muka di Bandung, atau online dari mana saja."}
            </p>

            <ul className="mt-8 space-y-5">
              {rows.map((r) => (
                <li key={r.title} className="flex gap-4">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-full ${
                      kids ? "bg-sun text-cobalt-900 shadow-[0_4px_0_0_var(--color-sun-600)]" : "bg-cobalt-900 text-[#F4C77B]"
                    }`}
                  >
                    {r.icon}
                  </span>
                  <span>
                    <span className={kids ? "block font-display text-lg text-cobalt-900" : "block text-sm font-semibold text-cobalt-900"}>{r.title}</span>
                    <span className="mt-0.5 block max-w-sm text-[15px] leading-relaxed text-ink/70">{r.body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={DIRECTIONS} variant={kids ? "cobalt" : "dark"} size="md" className="text-base">
                Petunjuk arah
                <ArrowIcon />
              </Button>
              <a
                href={CTA.consult.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-semibold underline-offset-4 hover:underline ${kids ? "text-cobalt" : "text-cobalt-900"}`}
              >
                Tanya admin dulu
              </a>
            </div>
          </div>

          {/* peta interaktif */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`relative h-[22rem] overflow-hidden sm:h-[28rem] ${
              kids
                ? "rounded-[2rem] border-4 border-white shadow-[0_10px_0_0_var(--color-mist),0_30px_60px_-30px_rgba(30,47,120,0.45)]"
                : "rounded-3xl shadow-[0_30px_70px_-35px_rgba(20,22,42,0.5)] ring-1 ring-ink/10"
            }`}
          >
            {/* latar sementara peta dimuat */}
            {!loaded && (
              <div className={`absolute inset-0 grid place-items-center ${kids ? "bg-[#DDEFD0]" : "bg-[#EFE8DC]"}`}>
                <span className="text-sm font-medium text-ink/50">Memuat peta…</span>
              </div>
            )}
            <iframe
              title="Peta lokasi English Now"
              src={EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setLoaded(true)}
              className="absolute inset-0 h-full w-full border-0"
              style={{ filter: kids ? "saturate(1.1)" : "grayscale(0.35) sepia(0.12) contrast(0.98)" }}
              allowFullScreen
            />
            {/* label melayang */}
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl py-2.5 pr-4 pl-2.5 shadow-[0_10px_30px_-10px_rgba(30,47,120,0.45)] transition hover:-translate-y-0.5 ${
                kids ? "bg-white" : "bg-white/95 backdrop-blur"
              }`}
            >
              <Image src="/brand/logo-mark.png" alt="" width={419} height={512} className="h-9 w-auto" />
              <span>
                <span className={kids ? "block font-display text-base leading-tight text-cobalt-900" : "block text-sm leading-tight font-semibold text-cobalt-900"}>English Now</span>
                <span className="block text-xs text-ink/60">{CONTACT.addressShort} · Buka di Maps ↗</span>
              </span>
            </a>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
