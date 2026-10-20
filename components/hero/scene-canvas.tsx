"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { Audience } from "@/lib/content";
import type { PaintScene } from "./paint/kit";
import { createCity } from "./paint/city";
import { createPark } from "./paint/park";

const FPS = 30;

/**
 * Canvas yang melukis satu dunia (Taman / Kota).
 * Hanya berjalan saat `active` (plus sebentar setelahnya, selama transisi),
 * dan berhenti saat hero tidak terlihat atau tab disembunyikan.
 */
export function SceneCanvas({ audience, active }: { audience: Audience; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const runRef = useRef(active);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (active) {
      runRef.current = true;
      return;
    }
    const id = window.setTimeout(() => (runRef.current = false), 1600);
    return () => window.clearTimeout(id);
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scene: PaintScene = audience === "kids" ? createPark() : createCity();
    const t0 = performance.now();
    let raf = 0;
    let last = 0;
    let visible = true;
    let ready = false;

    const frame = (now: number) => {
      const t = reduce ? 6 : (now - t0) / 1000;
      scene.draw(ctx, t);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 640 ? 1.5 : 1.25);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === canvas.width && h === canvas.height && ready) return;
      canvas.width = w;
      canvas.height = h;
      scene.resize(w, h);
      ready = true;
      frame(performance.now());
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!ready || !visible || document.hidden || reduce || !runRef.current) return;
      if (now - last < 1000 / FPS) return;
      last = now;
      frame(now);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [audience, reduce]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
