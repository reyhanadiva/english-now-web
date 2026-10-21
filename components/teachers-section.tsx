"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { TEACHERS, teachersContent, type Teacher } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { Butterfly, Stars } from "./ornaments";
import { SafeImage } from "./ui/safe-image";

/**
 * Section Pengajar: carousel melengkung (seperti dinding silinder).
 *  - Bergerak pelan sendiri, berhenti saat disorot; bisa digeser (drag/swipe).
 *  - Kartu di tengah lebih kecil & lurus, kartu di pinggir lebih besar & miring
 *    menghadap ke tengah, jadi terasa seperti berdiri di dalam ruangan.
 *  - Tiap kartu: foto, nama, sertifikasi, hasil tes; native speaker diberi lencana khusus.
 * Tampilan sama untuk Anak & Dewasa (pengajarnya sama), hanya warna latar yang ikut.
 */
export function TeachersSection() {
  const { audience, instant } = useAudience();
  const kids = audience === "kids";
  const natives = TEACHERS.filter((t) => t.native).length;
  const [view, setView] = useState<"slide" | "grid">("slide");
  const reduce = (useReducedMotion() ?? false) || instant;

  return (
    <section id="pengajar" className="relative overflow-hidden pt-8 pb-24 sm:pb-32" style={{ background: SECTION_BG[audience] }}>
      {!kids && <Stars reduce={reduce} className="absolute inset-x-0 top-0 h-72 w-full" />}
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        {kids && (
          <>
            <Butterfly tone={0} reduce={reduce} className="pointer-events-none absolute -top-6 -left-6 hidden w-16 sm:block" />
            <Butterfly tone={3} reduce={reduce} delay={1.2} className="pointer-events-none absolute top-14 -right-4 hidden w-12 sm:block" />
          </>
        )}
        <h2
          className={
            kids
              ? "font-display text-4xl leading-[1.05] text-balance text-cobalt-900 sm:text-[3.25rem]"
              : "text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-cobalt-900 sm:text-5xl"
          }
        >
          {teachersContent.title}
        </h2>
        <p className="mt-4 text-base text-ink/70">{teachersContent.sub(TEACHERS.length, natives)}</p>
      </div>

      <div className="relative z-10 mx-auto mt-8 flex max-w-6xl justify-end px-5">
        <ViewToggle view={view} setView={setView} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === "slide" ? (
          <motion.div
            key="slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            className="relative mt-6"
          >
            <Arc />
            <FloatingChips />
            <CurvedCarousel teachers={TEACHERS} />
          </motion.div>
        ) : (
          <motion.ul
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-4 px-5 sm:grid-cols-3 lg:grid-cols-5"
          >
            {TEACHERS.map((t, i) => (
              <motion.li
                key={t.name}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.03, duration: 0.3 }}
              >
                <TeacherCard t={t} sizes="(min-width: 1024px) 20vw, 50vw" />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const GAP = 18;

function CurvedCarousel({ teachers }: { teachers: Teacher[] }) {
  const reduce = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(1200);
  const vwRef = useRef(1200);
  const card = vw < 640 ? 170 : 230;
  const step = card + GAP;
  const total = teachers.length * step;
  const x = useMotionValue(0);
  const paused = useRef(false);
  const dragging = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      vwRef.current = e.contentRect.width;
      setVw(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wrapX = (v: number) => ((v % total) - total) % total; // selalu di (-total, 0]

  useAnimationFrame((_, dt) => {
    if (reduce || paused.current || dragging.current) return;
    x.set(wrapX(x.get() - dt * 0.06));
  });

  // 3 salinan supaya layar lebar selalu penuh saat berputar
  const items = [...teachers, ...teachers, ...teachers];

  return (
    <motion.div
      ref={wrapRef}
      className="relative h-[290px] cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[420px]"
      style={{ perspective: 1100 }}
      onHoverStart={() => (paused.current = true)}
      onHoverEnd={() => (paused.current = false)}
      onPanStart={() => (dragging.current = true)}
      onPan={(_, info) => x.set(wrapX(x.get() + info.delta.x))}
      onPanEnd={() => (dragging.current = false)}
      aria-roledescription="carousel"
      aria-label="Daftar pengajar"
    >
      <motion.div className="absolute inset-y-0 left-0" style={{ x, transformStyle: "preserve-3d" }}>
        {items.map((t, i) => (
          <Card key={`${t.name}-${i}`} t={t} i={i} x={x} step={step} card={card} vwRef={vwRef} />
        ))}
      </motion.div>
    </motion.div>
  );
}

function Card({
  t,
  i,
  x,
  step,
  card,
  vwRef,
}: {
  t: Teacher;
  i: number;
  x: MotionValue<number>;
  step: number;
  card: number;
  vwRef: React.RefObject<number>;
}) {
  // posisi kartu relatif ke tengah layar: -1 (kiri) .. 0 (tengah) .. 1 (kanan)
  const offset = useTransform(x, (v) => {
    const half = (vwRef.current ?? 1200) / 2;
    const center = i * step + v + card / 2;
    return Math.max(-1.6, Math.min(1.6, (center - half) / half));
  });
  const rotateY = useTransform(offset, (o) => o * -32);
  const scale = useTransform(offset, (o) => 0.82 + Math.min(1.3, Math.abs(o)) * 0.2);
  const z = useTransform(offset, (o) => Math.abs(o) * 60);

  return (
    <motion.article
      className="absolute top-1/2"
      style={{ left: i * step, width: card, rotateY, scale, z, y: "-50%", transformStyle: "preserve-3d" }}
    >
      <TeacherCard t={t} sizes="240px" />
    </motion.article>
  );
}

/** garis putus-putus melengkung di belakang kartu */
function Arc() {
  return (
    <svg aria-hidden viewBox="0 0 1440 420" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-full w-full">
      <path d="M-40 120 Q720 -40 1480 120" fill="none" stroke="rgba(30,47,120,0.18)" strokeWidth="2" strokeDasharray="8 10" />
      <path d="M-40 330 Q720 470 1480 330" fill="none" stroke="rgba(30,47,120,0.12)" strokeWidth="2" strokeDasharray="8 10" />
    </svg>
  );
}

/** label kecil yang melayang di sekitar carousel */
function FloatingChips() {
  const reduce = useReducedMotion() ?? false;
  const chips = [
    { t: "CELTA", c: "bg-cobalt text-white", pos: "left-[8%] top-2" },
    { t: "Cambridge C2", c: "bg-white text-cobalt-900 ring-1 ring-ink/10", pos: "left-[38%] -top-3 hidden sm:block" },
    { t: "IELTS 8.0+", c: "bg-sun text-cobalt-900", pos: "right-[10%] top-4" },
    { t: "TKT", c: "bg-sky text-white", pos: "right-[30%] -bottom-2 hidden sm:block" },
    { t: "DELTA", c: "bg-cobalt-900 text-white", pos: "left-[22%] -bottom-1 hidden sm:block" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {chips.map((ch, i) => (
        <motion.span
          key={ch.t}
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 3.6 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          className={`absolute rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(30,47,120,0.5)] ${ch.c} ${ch.pos}`}
        >
          {ch.t}
        </motion.span>
      ))}
    </div>
  );
}

/** kartu pengajar: foto, nama, sertifikasi, hasil tes, lencana native speaker */
function TeacherCard({ t, sizes }: { t: Teacher; sizes: string }) {
  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-mist shadow-[0_24px_50px_-28px_rgba(30,47,120,0.55)] ring-1 ring-black/5">
        <SafeImage
          src={t.photo}
          alt={`Foto ${t.name}`}
          fill
          sizes={sizes}
          draggable={false}
          fallback={t.name.split(" ").pop()?.[0]}
          className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cobalt-900/85 via-cobalt-900/10 to-transparent" />

        {t.native && (
          <span className="absolute top-3 left-3 rounded-full bg-sun px-2.5 py-1 text-[11px] font-bold text-cobalt-900 shadow-[0_3px_0_0_var(--color-sun-600)]">
            Native speaker · {t.native}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="text-lg leading-tight font-semibold tracking-tight">{t.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {t.certs.map((c) => (
              <span key={c} className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                {c}
              </span>
            ))}
            {t.score && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-cobalt-900">{t.score}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** pilihan tampilan: carousel atau grid (ikon saja) */
function ViewToggle({ view, setView }: { view: "slide" | "grid"; setView: (v: "slide" | "grid") => void }) {
  const opts = [
    {
      id: "slide" as const,
      label: "Tampilan carousel",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="7" y="5" width="10" height="14" rx="2" />
          <path d="M3 8v8M21 8v8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "grid" as const,
      label: "Lihat semua pengajar",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      ),
    },
  ];
  return (
    <div role="radiogroup" aria-label="Pilih tampilan" className="relative flex rounded-full bg-white p-1 shadow-[0_8px_20px_-12px_rgba(30,47,120,0.4)] ring-1 ring-ink/10">
      {opts.map((o) => {
        const on = view === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => setView(o.id)}
            className={`relative grid size-9 place-items-center rounded-full transition-colors ${on ? "text-white" : "text-ink/50 hover:text-cobalt-900"}`}
          >
            {on && (
              <motion.span layoutId="teacher-view" className="absolute inset-0 rounded-full bg-cobalt-900" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
            <span className="relative">{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
