"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useInView, useReducedMotion } from "framer-motion";
import { LOGOS } from "@/lib/content";
import { SafeImage as Image } from "./ui/safe-image";

/**
 * "Dipercaya oleh" (Dewasa).
 *  - Layar lebar: 12 logo besar berputar PELAN mengelilingi angka "11+". Semua logo selalu menghadap lurus
 *    (tidak miring/berbalik), ukuran sama, dan seluruhnya berada di dalam panel, jadi bisa dibaca kapan saja.
 *    Jalurnya sedikit "bernapas" (menjauh-mendekat) agar tidak kaku. Saat kursor di sebuah logo,
 *    putaran nyaris berhenti, logo itu menyala, yang lain meredup, dan namanya muncul di tengah.
 *  - HP: grid statis 3 kolom (putaran terlalu sempit di layar kecil).
 */
const TONES = ["#405FDA", "#07A9F8", "#F4B48F", "#7FD6A8", "#B9AAF2", "#F4C77B"];

type Logo = (typeof LOGOS)[number];

function Tile({ l, i, on = false }: { l: Logo; i: number; on?: boolean }) {
  return (
    <div
      title={l.name}
      className={`grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_-14px_rgba(0,0,0,0.6)] ring-4 transition-shadow duration-300 ${
        on ? "ring-[#F4C77B]" : "ring-transparent"
      }`}
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
          <Image src={l.src} alt={l.name} fill sizes="(min-width: 1024px) 140px, 30vw" className="object-contain" />
        </span>
      )}
    </div>
  );
}

function Headline({ name }: { name?: string }) {
  return (
    <div className="pointer-events-none text-center">
      <p className="text-6xl font-semibold tracking-tight text-white sm:text-8xl">
        {/* TODO: sesuaikan dengan jumlah institusi sebenarnya */}
        11<span className="text-[#F4C77B]">+</span>
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/70 sm:text-base">
        perusahaan, instansi pemerintahan, kampus, sekolah, dan komunitas telah mempercayakan pelatihan bahasa Inggrisnya kepada kami.
      </p>
      <p
        className={`mx-auto mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-cobalt-900 transition-all duration-200 ${
          name ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
        aria-live="polite"
      >
        {name ?? " "}
      </p>
    </div>
  );
}

export function LogoWall() {
  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#14162A]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_45%,rgba(244,199,123,0.14),transparent_70%)]" />
      <div className="hidden sm:block">
        <Orbit />
      </div>
      <div className="sm:hidden">
        <Grid />
      </div>
    </div>
  );
}

/* ---------- layar lebar: orbit pelan ---------- */

function Orbit() {
  const reduce = useReducedMotion() ?? false;
  const box = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const inView = useInView(box, { margin: "100px" });
  const [hover, setHover] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const angle = useRef(-Math.PI / 2);
  const speed = useRef(1);
  const size = useRef({ w: 1100, h: 640 });
  const n = LOGOS.length;

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      size.current = { w: e.contentRect.width, h: e.contentRect.height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const place = (t: number) => {
    const { w, h } = size.current;
    const tw = Math.min(150, Math.max(104, w * 0.12)); // lebar tile
    const rx = w / 2 - tw / 2 - 28;
    const ry = h / 2 - (tw * 0.75) / 2 - 24;
    for (let i = 0; i < n; i++) {
      const el = tiles.current[i];
      if (!el) continue;
      const a = angle.current + (i / n) * Math.PI * 2;
      // napas halus: jalur sedikit menjauh-mendekat, berbeda tiap logo
      const k = 1 + 0.05 * Math.sin(t / 2600 + i * 1.7);
      const x = w / 2 + Math.cos(a) * rx * k;
      const y = h / 2 + Math.sin(a) * ry * k;
      const on = hoverRef.current === i;
      el.style.width = `${tw}px`;
      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${on ? 1.14 : 1})`;
      el.style.zIndex = on ? "20" : "1";
    }
  };

  useAnimationFrame((t, dt) => {
    if (!inView) return;
    const target = hoverRef.current === null ? 1 : 0.06;
    speed.current += (target - speed.current) * Math.min(1, dt / 240);
    if (!reduce) angle.current += (dt / 1000) * 0.055 * speed.current; // ±115 detik per putaran
    place(t);
  });
  useEffect(() => {
    place(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={box} className="relative h-[40rem] w-full" onPointerLeave={() => setHover(null)}>
      {LOGOS.map((l, i) => {
        const on = hover === i;
        const dim = hover !== null && !on;
        return (
          <div
            key={l.name}
            ref={(el) => {
              tiles.current[i] = el;
            }}
            onPointerEnter={() => setHover(i)}
            className="absolute top-0 left-0 transition-[opacity,filter] duration-300"
            style={{ opacity: dim ? 0.35 : 1, filter: dim ? "grayscale(1)" : "none" }}
          >
            <Tile l={l} i={i} on={on} />
          </div>
        );
      })}
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-8">
        <div className="max-w-md">
          <Headline name={hover !== null ? LOGOS[hover].name : undefined} />
        </div>
      </div>
    </div>
  );
}

/* ---------- HP: grid ---------- */

function Grid() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="px-5 py-12">
      <Headline />
      <ul className="mt-10 grid grid-cols-3 gap-x-3 gap-y-6">
        {LOGOS.map((l, i) => (
          <motion.li
            key={l.name}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
            className="flex flex-col items-center"
          >
            <Tile l={l} i={i} />
            <p className="mt-2.5 line-clamp-2 text-center text-xs leading-snug font-medium text-white/75">{l.name}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
