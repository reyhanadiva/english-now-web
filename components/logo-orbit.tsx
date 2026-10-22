"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame, useInView, useReducedMotion } from "framer-motion";
import { LOGOS } from "@/lib/content";
import { SafeImage as Image } from "./ui/safe-image";

/**
 * "Dipercaya oleh" (Dewasa): 12 logo institusi berputar pelan mengelilingi angka di tengah,
 * seperti orbit. Saat kursor berada di sebuah logo: putaran melambat, logo itu membesar
 * & menyala, logo lain meredup, dan nama institusinya muncul.
 * Lintasannya elips selebar kartu, jadi sebagian logo terpotong tepi kartu (kesan terus berlanjut).
 */
const TONES = ["#405FDA", "#07A9F8", "#F4B48F", "#7FD6A8", "#B9AAF2", "#F4C77B"];
/** jarak relatif tiap logo dari pusat (1 = tepi elips) dan sedikit geseran sudut, supaya tidak simetris */
const RADII = [1.08, 0.7, 0.95, 1.18, 0.78, 1.0, 0.66, 1.12, 0.86, 1.04, 0.74, 0.92];
const JITTER = [0, 0.1, -0.06, 0.05, -0.1, 0.07, -0.03, 0.1, -0.08, 0.03, 0.08, -0.06];

export function LogoOrbit() {
  const reduce = useReducedMotion() ?? false;
  const box = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const inView = useInView(box, { margin: "100px" });
  const [hover, setHover] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const angle = useRef(0);
  const speed = useRef(1);
  const size = useRef({ w: 1000, h: 600 });
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

  // tiap logo punya jarak, kecepatan & "napas" sendiri, jadi orbitnya tidak bulat sempurna:
  // logo bergerak menjauh lalu mendekat, yang di dalam lebih kecil & samar (kesan kedalaman)
  const t = useRef(0);
  const place = () => {
    const { w, h } = size.current;
    const narrow = w < 640;
    const rx = w * (narrow ? 0.62 : 0.46);
    const ry = h * (narrow ? 0.46 : 0.54);
    for (let i = 0; i < n; i++) {
      const el = tiles.current[i];
      if (!el) continue;
      const base = RADII[i % RADII.length];
      // di HP rentang jaraknya dipersempit supaya logo tidak menutupi teks di tengah
      const b2 = narrow ? 0.88 + (base - 0.66) * 0.5 : base;
      const r = b2 * (1 + 0.12 * Math.sin(t.current * 0.35 + i * 1.7));
      const a = angle.current + (i / n) * Math.PI * 2 + JITTER[i % JITTER.length];
      const x = w / 2 + Math.cos(a) * rx * r;
      const y = h / 2 + Math.sin(a) * ry * r;
      const depth = Math.min(1, Math.max(0, (r - 0.55) / 0.6)); // 0 = dekat pusat, 1 = jauh
      const tilt = (a * 180) / Math.PI + 90 + ((i * 37) % 30) - 15;
      const on = hoverRef.current === i;
      const sc = on ? 1.25 : 0.68 + depth * 0.45;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${on ? 0 : tilt}deg) scale(${sc})`;
      el.style.zIndex = on ? "20" : String(1 + Math.round(depth * 5));
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) inner.style.opacity = on ? "1" : String(0.45 + depth * 0.55);
    }
  };

  useAnimationFrame((_, dt) => {
    if (!inView) return;
    const target = hoverRef.current === null ? 1 : 0.12;
    speed.current += (target - speed.current) * Math.min(1, dt / 220);
    if (!reduce) {
      angle.current += (dt / 1000) * 0.07 * speed.current;
      t.current += (dt / 1000) * speed.current;
    }
    place();
  });

  return (
    <div
      ref={box}
      className="relative mx-auto h-[30rem] max-w-6xl overflow-hidden rounded-[2rem] sm:h-[38rem]"
      style={{ background: "radial-gradient(120% 95% at 50% 42%, #2B3178 0%, #1C2257 42%, #14162A 100%)" }}
      onPointerLeave={() => setHover(null)}
    >
      {/* warna palet: biru cobalt/sky di tepi, cahaya senja hangat di tengah (selaras hero Dewasa) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_8%_100%,rgba(7,169,248,0.22),transparent_70%),radial-gradient(40%_50%_at_95%_0%,rgba(64,95,218,0.35),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(38%_42%_at_50%_50%,rgba(244,180,143,0.22),transparent_70%)]" />

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
            onPointerLeave={() => setHover(null)}
            className="absolute top-0 left-0 transition-[opacity,filter] duration-300"
            style={{ opacity: dim ? 0.35 : 1, filter: dim ? "grayscale(1)" : "none", transitionProperty: "opacity, filter, scale" }}
          >
            <div
              className={`grid size-[4.5rem] place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] transition-shadow duration-300 sm:size-24 sm:rounded-3xl ${
                on ? "ring-4 ring-[#F4C77B]" : ""
              }`}
              title={l.name}
            >
              {l.dummy ? (
                <span
                  className="grid size-full place-items-center text-center text-[10px] leading-tight font-bold text-white sm:text-xs"
                  style={{ background: TONES[i % TONES.length] }}
                >
                  <span>
                    <span className="block text-2xl leading-none sm:text-3xl">{l.name.split(" ").pop()}</span>
                    LOGO
                  </span>
                </span>
              ) : (
                <span className="relative block size-[80%]">
                  <Image src={l.src} alt={l.name} fill sizes="96px" className="object-contain" />
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* tengah: angka + keterangan (tidak ikut berputar) */}
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-8 text-center">
        <div className="max-w-sm">
          <p className="text-6xl font-semibold tracking-tight text-white sm:text-8xl">
            {/* TODO: sesuaikan dengan jumlah institusi sebenarnya */}
            11<span className="text-[#F4C77B]">+</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
            perusahaan, instansi pemerintahan, kampus, sekolah, dan komunitas telah mempercayakan pelatihan bahasa Inggrisnya kepada kami.
          </p>
          <p
            className={`mx-auto mt-5 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-cobalt-900 transition-all duration-200 ${
              hover !== null ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
            aria-live="polite"
          >
            {hover !== null ? LOGOS[hover].name : "\u00a0"}
          </p>
        </div>
      </div>
    </div>
  );
}
