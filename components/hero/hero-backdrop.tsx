"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
    useTransform,
  type MotionValue,
} from "framer-motion";
import type { Audience } from "@/lib/content";
import { createAmbient } from "./ambient";
import { SceneCanvas } from "./scene-canvas";

/**
 * Latar hero: dunia yang dilukis (Taman / Kota) + lapisan animasi.
 *
 *  - Ganti dunia: dunia baru "terbuka" melingkar dari posisi toggle.
 *  - Di atasnya: kelopak bunga, kupu-kupu, burung, titik cahaya (canvas).
 *  - Bawah: memudar halus ke warna halaman.
 */

const SCRIM: Record<Audience, string> = {
  kids: "radial-gradient(ellipse 62% 46% at 50% 32%, rgba(255,255,255,0.4), rgba(255,255,255,0) 72%)",
  adult: "radial-gradient(ellipse 62% 46% at 50% 32%, rgba(14,18,64,0.5), rgba(14,18,64,0) 72%)",
};

const REVEAL_S = 1.3;

function Layer({
  audience,
  active,
  radius,
  ox,
  oy,
}: {
  audience: Audience;
  active: boolean;
  radius: MotionValue<number>;
  ox: MotionValue<number>;
  oy: MotionValue<number>;
}) {
  const outer = useTransform(radius, (r) => r + 220);
  const mask = useMotionTemplate`radial-gradient(circle at ${ox}px ${oy}px, #000 ${radius}px, transparent ${outer}px)`;

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{
        zIndex: active ? 2 : 1,
        WebkitMaskImage: active ? mask : "none",
        maskImage: active ? mask : "none",
      }}
    >
      <SceneCanvas audience={audience} active={active} />
    </motion.div>
  );
}

export function HeroBackdrop({
  audience,
  originRef,
}: {
  audience: Audience;
  /** elemen toggle: titik awal animasi pergantian dunia */
  originRef: RefObject<HTMLElement | null>;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambientRef = useRef<ReturnType<typeof createAmbient> | null>(null);
  const first = useRef(true);

  // tiap dunia punya lingkaran "pembuka" sendiri
  const kidsR = useMotionValue(0);
  const adultR = useMotionValue(0);
  const ox = useMotionValue(0);
  const oy = useMotionValue(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const amb = createAmbient(canvas, { reduceMotion: reduce });
    ambientRef.current = amb;
    return () => {
      amb.destroy();
      ambientRef.current = null;
    };
  }, [reduce]);

  // ganti dunia
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    ambientRef.current?.setAudience(audience, isFirst);
    const r = audience === "kids" ? kidsR : adultR;
    const other = audience === "kids" ? adultR : kidsR;
    // dunia yang ditinggalkan ditutup lagi (tidak terlihat karena ada di bawah),
    // supaya saat dipilih lagi ia ikut "terbuka" dari toggle
    other.set(0);
    if (isFirst || reduce) {
      r.set(5000);
      return;
    }
    const root = rootRef.current?.getBoundingClientRect();
    const o = originRef.current?.getBoundingClientRect();
    if (root && o) {
      ox.set(o.left + o.width / 2 - root.left);
      oy.set(o.top + o.height / 2 - root.top);
    }
    const max = root ? Math.hypot(root.width, root.height) : 2000;
    r.set(0);
    const ctrl = animate(r, max, { duration: REVEAL_S, ease: [0.65, 0, 0.35, 1] });
    return () => ctrl.stop();
  }, [audience, reduce, kidsR, adultR, ox, oy, originRef]);

  return (
    <div ref={rootRef} aria-hidden className="absolute inset-0 overflow-hidden">
      <Layer audience="kids" active={audience === "kids"} radius={kidsR} ox={ox} oy={oy} />
      <Layer audience="adult" active={audience === "adult"} radius={adultR} ox={ox} oy={oy} />

      {/* sorotan lembut di belakang teks supaya tetap terbaca */}
      {(["kids", "adult"] as const).map((a) => (
        <div
          key={a}
          className="absolute inset-0 z-[3] transition-opacity duration-700"
          style={{ background: SCRIM[a], opacity: audience === a ? 1 : 0 }}
        />
      ))}

      <canvas ref={canvasRef} className="absolute inset-0 z-[4] h-full w-full" />

      {/* memudar perlahan ke warna section berikutnya (hijau muda untuk Anak, gading untuk Dewasa).
          Warna = SECTION_BG di lib/theme.ts */}
      {(["kids", "adult"] as const).map((a) => {
        const c = a === "kids" ? "242,249,234" : "251,246,238";
        return (
          <div
            key={a}
            className="absolute inset-x-0 bottom-0 z-[5] h-[28%] transition-opacity duration-700"
            style={{
              opacity: audience === a ? 1 : 0,
              background: `linear-gradient(to bottom, rgba(${c},0) 0%, rgba(${c},0.18) 30%, rgba(${c},0.55) 60%, rgba(${c},0.88) 85%, rgb(${c}) 100%)`,
            }}
          />
        );
      })}
    </div>
  );
}
