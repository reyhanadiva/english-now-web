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

  const place = () => {
    const { w, h } = size.current;
    const narrow = w < 640;
    const rx = w * (narrow ? 0.62 : 0.44);
    const ry = h * (narrow ? 0.44 : 0.5);
    for (let i = 0; i < n; i++) {
      const el = tiles.current[i];
      if (!el) continue;
      const a = angle.current + (i / n) * Math.PI * 2;
      const x = w / 2 + Math.cos(a) * rx;
      const y = h / 2 + Math.sin(a) * ry;
      const tilt = (a * 180) / Math.PI + 90 + ((i * 37) % 30) - 15;
      const on = hoverRef.current === i;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${on ? 0 : tilt}deg) scale(${on ? 1.22 : 1})`;
      el.style.zIndex = on ? "20" : "1";
    }
  };

  useAnimationFrame((_, dt) => {
    if (!inView) return;
    const target = hoverRef.current === null ? 1 : 0.12;
    speed.current += (target - speed.current) * Math.min(1, dt / 220);
    if (!reduce) angle.current += (dt / 1000) * 0.09 * speed.current;
    place();
  });

  return (
    <div
      ref={box}
      className="relative mx-auto h-[30rem] max-w-6xl overflow-hidden rounded-[2rem] bg-[#14162A] sm:h-[38rem]"
      onPointerLeave={() => setHover(null)}
    >
      {/* cahaya hangat di tengah */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_45%_at_50%_50%,rgba(244,199,123,0.16),transparent_70%)]" />

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
