"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LOGOS } from "@/lib/content";
import { SafeImage as Image } from "./ui/safe-image";

/**
 * "Dipercaya oleh" (Dewasa): semua logo institusi tampil sekaligus, besar, menghadap lurus ke layar,
 * dengan nama di bawahnya. Tidak ada putaran: pengunjung langsung tahu siapa saja yang sudah memakai
 * jasa English Now. Gerakan hanya saat muncul (bergantian pelan) dan saat disorot.
 */
const TONES = ["#405FDA", "#07A9F8", "#F4B48F", "#7FD6A8", "#B9AAF2", "#F4C77B"];

export function LogoWall() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#14162A] px-5 py-12 sm:px-10 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(244,199,123,0.16),transparent_70%)]" />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="text-6xl font-semibold tracking-tight text-white sm:text-8xl">
          {/* TODO: sesuaikan dengan jumlah institusi sebenarnya */}
          11<span className="text-[#F4C77B]">+</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
          perusahaan, instansi pemerintahan, kampus, sekolah, dan komunitas telah mempercayakan pelatihan bahasa Inggrisnya kepada kami.
        </p>
      </div>

      <ul className="relative mt-10 grid grid-cols-3 gap-x-3 gap-y-6 sm:mt-12 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-6">
        {LOGOS.map((l, i) => (
          <motion.li
            key={l.name}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
            className="group flex flex-col items-center"
          >
            <div
              className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_-14px_rgba(0,0,0,0.6)] ring-2 ring-transparent transition group-hover:-translate-y-1 group-hover:ring-[#F4C77B]"
            >
              {l.dummy ? (
                <span className="grid size-full place-items-center text-center font-bold text-white" style={{ background: TONES[i % TONES.length] }}>
                  <span>
                    <span className="block text-3xl leading-none sm:text-4xl">{l.name.split(" ").pop()}</span>
                    <span className="text-[10px] sm:text-xs">LOGO</span>
                  </span>
                </span>
              ) : (
                <span className="relative block h-[72%] w-[72%]">
                  <Image src={l.src} alt={l.name} fill sizes="(min-width: 1024px) 15vw, 30vw" className="object-contain" />
                </span>
              )}
            </div>
            <p className="mt-2.5 line-clamp-2 text-center text-xs leading-snug font-medium text-white/75 sm:text-[13px]">{l.name}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
