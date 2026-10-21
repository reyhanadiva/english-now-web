"use client";

import { useRef, useState, useSyncExternalStore } from "react";
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
          className="relative flex flex-col items-center pt-16 pb-14 sm:pt-20 sm:pb-16"
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

  const [torn, setTorn] = useState(false);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  const face = kids ? "bg-cobalt text-white" : "bg-[#14162A] text-white";
  const lift = kids ? "shadow-[0_10px_0_0_var(--color-cobalt-900),0_40px_80px_-30px_rgba(30,47,120,0.6)]" : "shadow-[0_40px_90px_-30px_rgba(20,22,42,0.65)]";
  const R = kids ? "2.2rem" : "1.75rem";
  const notch = "absolute z-30 size-9 rounded-full";

  // potongan tiket bisa ditarik untuk "disobek": desktop ke kanan, HP ke bawah
  const sx = useMotionValue(0);
  const sy = useMotionValue(0);
  const tilt = useTransform(wide ? sx : sy, (v) => (wide ? v / 9 : -v / 12));

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
        className="relative flex flex-col md:flex-row"
      >
        {/* bagian utama */}
        <div
          className={`relative flex-1 p-7 sm:p-10 lg:p-12 ${face} ${lift}`}
          style={{ borderRadius: wide ? `${R} 0 0 ${R}` : `${R} ${R} 0 0` }}
        >
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
            <motion.div
              animate={torn && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={torn ? { duration: 0.9, repeat: 2, ease: "easeInOut" } : { duration: 0 }}
            >
              <Button href={c.cta.href} variant={kids ? "sun" : "sunPill"} size="md" className="px-7 text-lg">
                {c.cta.label}
                <WaIcon />
              </Button>
            </motion.div>
            <p className="max-w-[15rem] text-xs leading-snug text-white/55">{c.note}</p>
          </div>

          {/* garis sobekan + dua lubang, menempel di tepi bagian utama */}
          <span
            aria-hidden
            className={`absolute border-dashed border-white/25 ${wide ? "inset-y-7 right-0 border-r-2" : "inset-x-7 bottom-0 border-b-2"}`}
          />
          <span aria-hidden className={`${notch} ${wide ? "-top-[1.125rem] right-0 translate-x-1/2" : "bottom-0 -left-[1.125rem] translate-y-1/2"}`} style={{ background: bg }} />
          <span aria-hidden className={`${notch} ${wide ? "right-0 -bottom-[1.125rem] translate-x-1/2" : "-right-[1.125rem] bottom-0 translate-y-1/2"}`} style={{ background: bg }} />
        </div>

        {/* potongan tiket: foto kelas + cap GRATIS. Tarik untuk menyobek. */}
        <div className="relative md:w-[19rem]">
          <AnimatePresence initial={false}>
            {!torn ? (
              <motion.div
                key="stub"
                drag={reduce ? false : wide ? "x" : "y"}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={{ left: 0, top: 0, right: 0.35, bottom: 0.35 }}
                dragSnapToOrigin
                onDragEnd={(_, info) => {
                  if ((wide ? info.offset.x : info.offset.y) > 70) setTorn(true);
                }}
                exit={wide ? { x: 520, y: 260, rotate: 38, opacity: 0 } : { y: 420, x: 60, rotate: -18, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                style={{
                  x: sx,
                  y: sy,
                  rotate: tilt,
                  originX: 0,
                  originY: wide ? 1 : 0,
                  borderRadius: wide ? `0 ${R} ${R} 0` : `0 0 ${R} ${R}`,
                }}
                className={`relative z-20 h-full touch-pan-y p-4 md:p-5 ${reduce ? "" : "cursor-grab active:cursor-grabbing"} ${face} ${lift}`}
              >
                <div className={`pointer-events-none relative h-56 overflow-hidden md:h-full ${kids ? "rounded-[1.6rem]" : "rounded-2xl"}`}>
                  <SafeImage src={c.photo} alt="" fill sizes="(min-width: 768px) 300px, 90vw" className="object-cover" draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <p className="absolute bottom-4 left-4 text-xs font-semibold tracking-[0.18em] text-white/90 uppercase">1 kelas · 0 rupiah</p>
                  {!reduce && (
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                      Tarik untuk menyobek
                      <motion.span animate={{ x: wide ? [0, 4, 0] : 0, y: wide ? 0 : [0, 3, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                        {wide ? "→" : "↓"}
                      </motion.span>
                    </span>
                  )}
                </div>
                <Stamp kids={kids} reduce={reduce} />
              </motion.div>
            ) : (
              <motion.div
                key="kept"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className={`flex h-full min-h-56 flex-col items-center justify-center gap-3 border-2 border-dashed p-6 text-center ${
                  kids ? "border-cobalt/35 text-cobalt-900" : "border-ink/20 text-cobalt-900"
                }`}
                style={{ borderRadius: wide ? `0 ${R} ${R} 0` : `0 0 ${R} ${R}`, background: bg }}
              >
                <p className={kids ? "font-display text-2xl" : "text-xl font-semibold tracking-tight"}>Tiketnya sudah di tanganmu!</p>
                <p className="text-sm text-ink/65">Tinggal satu langkah: klik tombol daftar, admin kami akan membalas lewat WhatsApp.</p>
                <button type="button" onClick={() => setTorn(false)} className="mt-1 text-xs font-semibold text-cobalt underline-offset-4 hover:underline">
                  ↺ Pasang lagi
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const MQ = "(min-width: 768px)";
function subscribeWide(cb: () => void) {
  const m = window.matchMedia(MQ);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const getWide = () => window.matchMedia(MQ).matches;

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
