"use client";

import { useEffect, useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import {
  cloudSprite,
  daisy,
  drawTree,
  glow,
  grassDabs,
  hillShape,
  makeTree,
  makeView,
  rng,
  tuft,
} from "./hero/paint/kit";

/**
 * Latar footer: versi sederhana dari dunia hero, dilukis dengan gaya yang sama
 * (alat lukis yang sama dengan hero), tipis di belakang isi footer.
 *  - Anak: bukit, awan, pohon, bunga. Matahari terbit di BELAKANG bukit dan
 *    bergeser kiri-kanan mengikuti kursor, berkas cahayanya ikut.
 *  - Dewasa: siluet kota senja dengan lampu jendela. Berkas lampu sorot kota
 *    keluar dari balik gedung dan menyapu langit mengikuti kursor.
 *
 * Kinerja: lukisan digambar SEKALI (dan saat ukuran berubah), tidak ada animasi
 * per-frame di canvas. Yang bergerak hanya elemen CSS (matahari / lampu sorot).
 */
export function FooterBackdrop({ kids, x }: { kids: boolean; x: MotionValue<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === w && canvas.height === h && canvas.dataset.k === String(kids)) return;
      canvas.width = w;
      canvas.height = h;
      canvas.dataset.k = String(kids);
      const g = canvas.getContext("2d");
      if (!g) return;
      g.clearRect(0, 0, w, h);
      if (kids) paintMeadow(g, w, h);
      else paintCity(g, w, h);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [kids]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {kids ? <Sun x={x} /> : <Searchlights x={x} />}
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full"
        style={{
          opacity: kids ? 0.7 : 0.5,
          maskImage: "linear-gradient(180deg, transparent 0%, transparent 30%, #000 62%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, transparent 30%, #000 62%)",
        }}
      />
    </div>
  );
}

/* ---------- elemen yang mengikuti kursor ---------- */

function Sun({ x }: { x: MotionValue<number> }) {
  const left = useTransform(x, (v) => `${28 + v * 0.44}%`);
  const rot = useTransform(x, (v) => (v - 50) * 0.3);
  return (
    <motion.div className="absolute top-[66%] size-0" style={{ left }}>
      {/* berkas cahaya, berpusat di matahari (pusatnya tertutup bukit) */}
      <motion.div
        className="absolute top-0 left-0 h-[150vh] w-[150vh] -translate-x-1/2 -translate-y-1/2"
        style={{
          rotate: rot,
          background: "repeating-conic-gradient(from 0deg, rgba(255,242,117,0.34) 0deg 5deg, transparent 5deg 15deg)",
          maskImage: "radial-gradient(closest-side, #000 10%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(closest-side, #000 10%, transparent 72%)",
        }}
      />
      <div className="absolute top-0 left-0 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#FFF8C8_0%,#FFF275_45%,rgba(255,242,117,0)_70%)]" />
    </motion.div>
  );
}

function Searchlights({ x }: { x: MotionValue<number> }) {
  // dua lampu sorot keluar dari balik gedung tinggi, menyapu berlawanan arah
  const a = useTransform(x, (v) => -18 + (v - 50) * 0.5);
  const b = useTransform(x, (v) => 16 + (v - 50) * 0.5);
  const c = useTransform(x, (v) => -4 - (v - 50) * 0.35);
  const beam = (left: string, top: string, rotate: MotionValue<number>, color: string) => (
    <motion.div className="absolute size-0" style={{ left, top }}>
      <motion.div
        className="absolute bottom-0 left-0 h-[120vh] w-40 origin-bottom -translate-x-1/2"
        style={{
          rotate,
          clipPath: "polygon(48% 100%, 52% 100%, 100% 0, 0 0)",
          background: `linear-gradient(0deg, ${color} 0%, transparent 85%)`,
        }}
      />
    </motion.div>
  );
  return (
    <>
      <div className="absolute inset-x-0 top-[40%] h-[40%] bg-[radial-gradient(60%_80%_at_50%_100%,rgba(255,190,150,0.35),transparent_70%)]" />
      {beam("24%", "80%", a, "rgba(255,226,170,0.45)")}
      {beam("77%", "79%", b, "rgba(185,170,242,0.5)")}
      {beam("52%", "84%", c, "rgba(255,226,170,0.3)")}
    </>
  );
}

/* ---------- lukisan statis (gaya sama dengan hero) ---------- */

const LEAF = { dark: "#2E7A4A", mid: "#45A05A", light: "#79C46A", hi: "#B8E38A" };
const DABS = ["#A6DB84", "#8DCF72", "#C2E89C", "#74BE63", "#D8F0B0"];
const GRASS = ["#3F9A4C", "#56B259", "#6CC464", "#8BD474", "#2F8442"];

function paintMeadow(g: CanvasRenderingContext2D, w: number, h: number) {
  const v = makeView(w, h, 0.66);
  const r = rng(91);
  // awan
  const pal = { shade: "#BCCBF0", mid: "#E6EEFC", light: "#FFFFFF" };
  const clouds: [number, number, number, number][] = [
    [0.12, 0.5, 0.2, 0.08],
    [0.86, 0.46, 0.22, 0.09],
    [0.62, 0.42, 0.12, 0.05],
  ];
  for (const [cx, cy, cw, ch] of clouds) {
    const s = cloudSprite(r, cw * w, ch * h * 1.6, pal);
    g.drawImage(s.c, cx * w - s.ox, cy * h - s.oy);
  }
  // bukit berlapis (menutupi bagian bawah matahari)
  hillShape(g, v, { y: h * 0.7, amp: 0.05, freq: 1.6, seed: 2.2, top: "#C9E8A6", bottom: "#B3DE90" });
  hillShape(g, v, { y: h * 0.8, amp: 0.06, freq: 2.2, seed: 5.1, top: "#A9DA86", bottom: "#8CCB74" });
  hillShape(g, v, { y: h * 0.9, amp: 0.05, freq: 1.3, seed: 8.4, top: "#86C870", bottom: "#6BBA62" });
  grassDabs(g, v, rng(3), h * 0.72, h, 500, DABS, 1);
  // pohon di kedua sisi
  const tr = rng(17);
  drawTree(g, makeTree(tr, h * 0.26, LEAF, "#6B4A32", "#9A6D48", 0.7, 2), w * 0.07, h * 0.86);
  drawTree(g, makeTree(tr, h * 0.18, LEAF, "#6B4A32", "#9A6D48", -0.7), w * 0.93, h * 0.84);
  drawTree(g, makeTree(tr, h * 0.12, LEAF, "#6B4A32", "#9A6D48", -0.7), w * 0.99, h * 0.86);
  // bunga & rumput depan
  const fr = rng(29);
  for (let i = 0; i < 70; i++) {
    const y = h * (0.82 + fr() * 0.18);
    daisy(g, fr() * w, y, h * (0.006 + (y / h - 0.8) * 0.03), fr() > 0.3 ? "#FFFFFF" : "#FFF27A", "#F0B53A");
  }
  for (let i = 0; i < 90; i++) tuft(g, fr() * w, h * (0.9 + fr() * 0.12), h * 0.04, GRASS, fr, (fr() - 0.5) * 0.4, 5);
}

function paintCity(g: CanvasRenderingContext2D, w: number, h: number) {
  const r = rng(53);
  const base = h * 0.84;
  const u = h;
  // gedung: belakang (pucat) lalu depan (cobalt). Gedung tinggi di 24% & 77% menutupi pangkal lampu sorot.
  const draw = (far: boolean) => {
    let x = -10;
    while (x < w + 10) {
      const bw = u * (far ? 0.035 : 0.045) * (0.7 + r() * 0.7);
      const cx = (x + bw / 2) / w;
      const peak = Math.max(Math.exp(-(((cx - 0.24) / 0.07) ** 2)), Math.exp(-(((cx - 0.77) / 0.07) ** 2)));
      const bh = u * (far ? 0.09 : 0.06) * (0.6 + r() * 0.6) + u * peak * (far ? 0.1 : 0.17);
      const top = base - bh;
      const gr = g.createLinearGradient(0, top, 0, base);
      if (far) {
        gr.addColorStop(0, "#B6B0DE");
        gr.addColorStop(1, "#D9CDE4");
      } else {
        gr.addColorStop(0, "#3A4396");
        gr.addColorStop(1, "#5A55A6");
      }
      g.fillStyle = gr;
      g.fillRect(x, top, bw, bh + 4);
      if (!far) {
        // sisi kena cahaya senja
        g.fillStyle = "rgba(255,186,150,0.45)";
        g.fillRect(cx < 0.5 ? x + bw - 3 : x, top + 4, 3, bh - 4);
        // jendela menyala
        const cols = Math.max(2, Math.floor(bw / 9));
        const rows = Math.floor(bh / 12);
        for (let c = 0; c < cols; c++)
          for (let k = 1; k < rows; k++)
            if (r() < 0.33) {
              g.fillStyle = r() > 0.5 ? "#FFE08A" : "#FFF0B8";
              g.fillRect(x + 3 + c * ((bw - 6) / cols), top + k * 12, 4, 5);
            }
      }
      x += bw + (far ? 1 : 2);
    }
  };
  draw(true);
  draw(false);
  // sungai
  const wg = g.createLinearGradient(0, base, 0, h * 0.88);
  wg.addColorStop(0, "#F4B48F");
  wg.addColorStop(0.3, "#9C88C8");
  wg.addColorStop(1, "#5A5FAE");
  g.fillStyle = wg;
  g.fillRect(0, base, w, h * 0.1);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(255,226,160,${0.25 + r() * 0.4})`;
    g.fillRect(r() * w, base + r() * h * 0.09, 12 + r() * 30, 2);
  }
  // tepian berumput
  const v = makeView(w, h, 0.66);
  hillShape(g, v, { y: h * 0.9, amp: 0.025, freq: 2, seed: 4.4, top: "#5D8590", bottom: "#41687A" });
  grassDabs(g, v, rng(8), h * 0.9, h, 300, ["#4F7A86", "#55808C", "#3F6878"], 1);
  // pohon tepi sungai + lampu jalan
  const tr = rng(61);
  const leaf = { dark: "#1E3A55", mid: "#2D5270", light: "#46708A", hi: "#8E8FB8" };
  drawTree(g, makeTree(tr, h * 0.22, leaf, "#1C2E44", "#3A4E66", 0.8), w * 0.06, h * 0.95);
  drawTree(g, makeTree(tr, h * 0.18, leaf, "#1C2E44", "#3A4E66", -0.8), w * 0.95, h * 0.94);
  for (const lx of [0.2, 0.4, 0.6, 0.8]) {
    const px = w * lx;
    g.fillStyle = "#1E2654";
    g.fillRect(px - 1.5, h * 0.83, 3, h * 0.08);
    glow(g, px, h * 0.83, h * 0.04, "255,226,160", 0.9);
  }
}
