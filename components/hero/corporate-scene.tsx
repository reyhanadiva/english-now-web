"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Hero "Corporate": kota bisnis di jam biru, layar penuh, penuh kehidupan.
 *  - Langit malam kebiruan, bulan sabit, bintang berkedip, awan berjalan, pesawat, burung, bintang jatuh.
 *  - Empat lapis gedung dengan kabut atmosfer; jendela, mahkota menara & lampu peringatan berkedip.
 *  - Kereta layang melintas ("English Now Express", "Next stop: Global opportunities"),
 *    pohon berlapis yang bergoyang, lampu taman yang meredup-menyala, trotoar & jalan.
 *  - Orang berjalan (kaki & lengan bergerak), pasangan yang mengobrol di bangku, pesepeda, merpati berjalan.
 *    Mereka bercakap dalam bahasa Inggris kerja lewat gelembung yang muncul bergantian sejak detik pertama.
 *  - Mobil lewat: lampu putih di depan, lampu belakang merah di belakang (arah benar).
 * Lapisan statis digambar sekali (SVG); yang bergerak adalah elemen kecil terpisah dengan animasi
 * transform/opacity, jadi ringan. Semua berhenti saat hero keluar layar. Tanpa parallax kursor.
 */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (v: number) => v.toFixed(1);

/* =====================  KOTA  ===================== */
type Layer = {
  id: string;
  body: string;
  warm: string;
  cool: string;
  strips: string;
  edge: string;
  tw: string[];
  crowns: { x: number; y: number; r: number }[];
  beacons: { x: number; y: number }[];
  tone: string;
  opacity: number;
};

function buildCity(w: number, baseY: number, H: number, narrow: boolean): Layer[] {
  const defs = [
    { id: "haze", seed: 2, gap: 0.7, scale: 0.5, wmin: 36, wmax: 80, tone: "#7F95D8", opacity: 0.3, lit: 0 },
    { id: "far", seed: 3, gap: 0.78, scale: 0.6, wmin: 40, wmax: 90, tone: "#3D55B4", opacity: 0.62, lit: 0.07 },
    { id: "mid", seed: 9, gap: 0.92, scale: 0.8, wmin: 56, wmax: 118, tone: "#1B2B86", opacity: 1, lit: 0.26 },
    { id: "near", seed: 21, gap: 1.02, scale: 1.0, wmin: 82, wmax: 168, tone: "#09103F", opacity: 1, lit: 0.4 },
  ];
  const cw = narrow ? 11 : 14;
  const ch = narrow ? 15 : 19;
  const ww = cw * 0.5;
  const wh = ch * 0.52;
  const k = narrow ? 0.62 : 1;

  return defs.map((L) => {
    const r = rng(L.seed);
    let body = "";
    let warm = "";
    let cool = "";
    let strips = "";
    let edge = "";
    const tw = ["", "", ""];
    const crowns: Layer["crowns"] = [];
    const beacons: Layer["beacons"] = [];
    let x = -60;
    while (x < w + 60) {
      const bw = (L.wmin + r() * (L.wmax - L.wmin)) * k;
      const xc = (x + bw / 2) / w;
      const edgeF = Math.min(1, Math.abs(xc - 0.5) * 2);
      // bagian tengah dibuat rendah supaya teks hero tetap bersih
      const bh = H * L.scale * (0.07 + 0.5 * Math.pow(edgeF, 1.2) + r() * 0.08);
      const top = baseY - bh;
      body += `M${f1(x)} ${f1(baseY + 2)}V${f1(top)}H${f1(x + bw)}V${f1(baseY + 2)}Z`;

      const roof = r();
      let crownY = top;
      if (roof < 0.35) {
        const sw = bw * 0.6;
        const sh = H * (0.03 + r() * 0.04);
        body += `M${f1(x + (bw - sw) / 2)} ${f1(top)}V${f1(top - sh)}H${f1(x + (bw + sw) / 2)}V${f1(top)}Z`;
        crownY = top - sh;
      } else if (roof < 0.55) {
        const sp = 34 * k + r() * 24;
        body += `M${f1(x + bw / 2 - 1.5)} ${f1(top)}V${f1(top - sp)}H${f1(x + bw / 2 + 1.5)}V${f1(top)}Z`;
        crownY = top - sp;
      }

      const big = bh > H * 0.3 && edgeF > 0.35;
      if (L.id === "near" && big) {
        if (r() < 0.55) crowns.push({ x: x + bw / 2, y: crownY + 2, r: (14 + r() * 12) * k });
        else if (r() < 0.6) beacons.push({ x: x + bw / 2, y: crownY - 2 });
        if (r() < 0.5) strips += `M${f1(x + bw * 0.82)} ${f1(top + 8)}h1.6v${f1(bh * 0.62)}h-1.6Z`;
      }
      if (L.id === "near" || L.id === "mid") edge += `M${f1(x)} ${f1(top)}h1.6V${f1(baseY)}h-1.6Z`;

      if (L.lit > 0 && bh > 40) {
        const cols = Math.max(2, Math.floor((bw - 8) / cw));
        const rows = Math.max(2, Math.floor((bh - 14) / ch));
        const ox = (bw - cols * cw) / 2 + (cw - ww) / 2;
        for (let c = 0; c < cols; c++) {
          for (let rr = 0; rr < rows; rr++) {
            if (r() > L.lit) continue;
            const wx = x + ox + c * cw;
            const wy = top + 10 + rr * ch;
            const seg = `M${f1(wx)} ${f1(wy)}h${f1(ww)}v${f1(wh)}h${f1(-ww)}Z`;
            const q = r();
            if (L.id === "near" && q < 0.18) tw[Math.floor(q / 0.06)] += seg;
            else if (r() < 0.74) warm += seg;
            else cool += seg;
          }
        }
      }
      x += bw * L.gap * (0.9 + r() * 0.25);
    }
    return { id: L.id, body, warm, cool, strips, edge, tw, crowns, beacons, tone: L.tone, opacity: L.opacity };
  });
}

/* =====================  ORANG  ===================== */
type Kind = "short" | "long" | "hijab" | "bun";

function PersonSvg({
  kind,
  coat,
  pants,
  hij = "#CDB7E8",
  skin = "#A8714F",
  bag = false,
  s,
  flip = false,
  walk = true,
}: {
  kind: Kind;
  coat: string;
  pants: string;
  hij?: string;
  skin?: string;
  bag?: boolean;
  s: number;
  flip?: boolean;
  walk?: boolean;
}) {
  const limb = (name: string, rev: boolean): React.CSSProperties =>
    walk
      ? {
          transformBox: "fill-box",
          transformOrigin: "50% 0%",
          animationName: name,
          animationDuration: "0.9s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDirection: rev ? "alternate-reverse" : "alternate",
        }
      : {};
  const hair = "#140D1E";
  const longHair = "#2A1519";
  return (
    <svg width={40 * s} height={64 * s} viewBox="0 0 40 64" style={{ display: "block", overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }} aria-hidden>
      <ellipse cx="20" cy="62.5" rx="11" ry="2.2" fill="#000" opacity=".35" />
      <rect className="en-m-leg" x="14.4" y="39" width="5.4" height="23" rx="2.6" fill={pants} style={limb("en-leg", false)} />
      <rect className="en-m-leg" x="20.2" y="39" width="5.4" height="23" rx="2.6" fill={pants} style={limb("en-leg", true)} />
      {/* lengan belakang */}
      <g className="en-m-arm" style={limb("en-arm", true)}>
        <rect x="7.4" y="16.4" width="4.6" height="17" rx="2.3" fill={coat} opacity=".8" />
        <circle cx="9.7" cy="34" r="2.2" fill={skin} />
      </g>
      {/* badan */}
      <path d="M11.5 16.5 Q20 12.8 28.5 16.5 L30 41 L10 41Z" fill={coat} />
      <path d="M16.6 14.8 L20 21 L23.4 14.8" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1" />
      <path d="M28.5 16.5 L30 41" stroke="#FFC594" strokeOpacity=".55" strokeWidth="1.1" fill="none" />
      <rect x="18" y="12.5" width="4" height="4.5" fill={skin} />
      {kind === "hijab" && <path d="M13.8 10 Q13.2 2 20 1.8 Q26.8 2 26.2 10 Q27.6 14.5 29.8 19.5 L10.2 19.5 Q12.4 14.5 13.8 10Z" fill={hij} />}
      <ellipse cx="20" cy="9.8" rx={kind === "hijab" ? 4.1 : 5.3} ry={kind === "hijab" ? 4.9 : 6} fill={skin} />
      {kind === "short" && <path d="M14.5 8.8 Q14.4 2.4 20 2.4 Q25.6 2.4 25.5 8.8 Q23 5.6 20 5.6 Q17 5.6 14.5 8.8Z" fill={hair} />}
      {kind === "bun" && (
        <>
          <path d="M14.5 8.8 Q14.4 2.4 20 2.4 Q25.6 2.4 25.5 8.8 Q23 5.6 20 5.6 Q17 5.6 14.5 8.8Z" fill={hair} />
          <circle cx="20" cy="1.6" r="3.1" fill={hair} />
        </>
      )}
      {kind === "long" && (
        <>
          <path d="M14.5 8.8 Q14.4 2.4 20 2.4 Q25.6 2.4 25.5 8.8 Q23 5.6 20 5.6 Q17 5.6 14.5 8.8Z" fill={longHair} />
          <path d="M14.3 8 Q12.8 18 14.8 23 L17.6 23 Q16.2 15 17.2 9Z" fill={longHair} />
          <path d="M25.7 8 Q27.2 18 25.2 23 L22.4 23 Q23.8 15 22.8 9Z" fill={longHair} />
        </>
      )}
      {/* lengan depan (+ tas kerja) */}
      <g className="en-m-arm" style={limb("en-arm", false)}>
        <rect x="28" y="16.4" width="4.6" height="17" rx="2.3" fill={coat} />
        <circle cx="30.3" cy="34" r="2.2" fill={skin} />
        {bag && (
          <>
            <path d="M28.6 35 v3" stroke="#0A0612" strokeWidth="1" />
            <rect x="25.4" y="37.5" width="10.4" height="8" rx="1.6" fill="#241508" />
            <rect x="25.4" y="40" width="10.4" height="1" fill="#C98A5A" opacity=".6" />
          </>
        )}
      </g>
    </svg>
  );
}

function CyclistSvg({ s }: { s: number }) {
  const spin: React.CSSProperties = { transformBox: "fill-box", transformOrigin: "50% 50%", animation: "en-spin 0.7s linear infinite" };
  return (
    <svg width={80 * s} height={64 * s} viewBox="0 0 80 64" style={{ display: "block", overflow: "visible" }} aria-hidden>
      <ellipse cx="40" cy="62.5" rx="34" ry="2.4" fill="#000" opacity=".35" />
      {[16, 62].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="49" r="12.5" fill="none" stroke="#B4C4F8" strokeWidth="1.8" />
          <g className="en-m-spin" style={spin}>
            <path d={`M${cx - 12} 49H${cx + 12}M${cx} 37V61M${cx - 8.5} 40.5L${cx + 8.5} 57.5M${cx + 8.5} 40.5L${cx - 8.5} 57.5`} stroke="#B4C4F8" strokeOpacity=".5" strokeWidth=".9" />
          </g>
        </g>
      ))}
      <path d="M16 49 L33 49 L27 29 L50 29 L62 49 M33 49 L47 29 M27 29 L24 25 M50 29 L56 25 H60" fill="none" stroke="#8FA4EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* pengendara */}
      <rect className="en-m-leg" x="29" y="26" width="5" height="17" rx="2.5" fill="#0D1240" style={{ transformBox: "fill-box", transformOrigin: "50% 0%", animation: "en-leg 0.7s ease-in-out infinite alternate" }} />
      <path d="M29 28 L43 12" stroke="#2E3E96" strokeWidth="8" strokeLinecap="round" />
      <path d="M43 15 L56 26" stroke="#2E3E96" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="46" cy="6.5" r="5" fill="#A8714F" />
      <path d="M41 6 Q41.5 0.5 46.5 0.8 Q51 1.2 51 5.5 Q47 3.5 41 6Z" fill="#6C7FD0" />
      <circle cx="66" cy="27" r="2.4" fill="#FFF6D6" />
      <path d="M43 12 L43 24" stroke="#FFC594" strokeOpacity=".5" strokeWidth="1" />
    </svg>
  );
}

function PigeonSvg({ s, flip }: { s: number; flip?: boolean }) {
  return (
    <svg width={24 * s} height={18 * s} viewBox="0 0 24 18" style={{ display: "block", overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }} aria-hidden>
      <path d="M3 9 L-1 7 L-1 11Z" fill="#6A7AA8" />
      <ellipse cx="11" cy="10" rx="7.5" ry="4.6" fill="#7F8FB8" />
      <path d="M7 9 Q11 6.5 15 9" fill="none" stroke="#5A6A98" strokeWidth="1.4" />
      <g className="en-m-bob" style={{ animation: "en-bob 0.5s ease-in-out infinite" }}>
        <circle cx="18.6" cy="6.4" r="3.1" fill="#8FA0C8" />
        <path d="M21.4 6.5 L24 7.2 L21.4 8Z" fill="#E8A05A" />
        <circle cx="19.6" cy="5.8" r=".7" fill="#0A0F3A" />
      </g>
      <path d="M9 14 V17.5 M13 14 V17.5" stroke="#E8A05A" strokeWidth="1" />
    </svg>
  );
}

/* =====================  POHON  ===================== */
const TREE_PALETTES = [
  ["#091F40", "#0F4268", "#1C6F88"],
  ["#0B2A38", "#145565", "#26878A"],
  ["#111C48", "#203A82", "#3A62B4"],
];
function TreeSvg({ s, seed, tone }: { s: number; seed: number; tone: number }) {
  const r = rng(seed);
  const pal = TREE_PALETTES[tone % TREE_PALETTES.length];
  const blobs: { cx: number; cy: number; rx: number; ry: number; c: string }[] = [];
  for (let p = 0; p < 3; p++) {
    const n = 4 + (p === 0 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const rx = (30 - p * 4) * (0.8 + r() * 0.4);
      blobs.push({ cx: 80 + (r() - 0.5) * (96 - p * 14), cy: 72 + (r() - 0.5) * 68 - p * 5, rx, ry: rx * (0.78 + r() * 0.16), c: pal[p] });
    }
  }
  const dots = Array.from({ length: 22 }, () => ({ x: 80 + (r() - 0.5) * 110, y: 70 + (r() - 0.5) * 84, warm: r() < 0.3 }));
  return (
    <svg width={160 * s} height={230 * s} viewBox="0 0 160 230" style={{ display: "block", overflow: "visible" }} aria-hidden>
      <path d="M75 230 C74 190 78 160 80 118 L87 118 C87 160 91 190 89 230Z" fill="#190F33" />
      <path d="M86 118 L86 230" stroke="#FFC594" strokeOpacity=".3" strokeWidth="1.2" />
      <path d="M81 150 Q62 132 52 110 M84 140 Q104 122 112 102 M82 126 Q80 104 78 88" stroke="#190F33" strokeWidth="4" strokeLinecap="round" fill="none" />
      {blobs.map((b, i) => (
        <ellipse key={i} cx={f1(b.cx)} cy={f1(b.cy)} rx={f1(b.rx)} ry={f1(b.ry)} fill={b.c} />
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={f1(d.x)} cy={f1(d.y)} r="1.7" fill={d.warm ? "#FFD59A" : pal[2]} opacity={d.warm ? 0.55 : 0.85} />
      ))}
    </svg>
  );
}

/* =====================  GELEMBUNG OBROLAN  ===================== */
type Tone = "white" | "cobalt" | "sun";
function Say({ text, tone, delay, cycle, first, label, narrow, still }: { text: string; tone: Tone; delay: number; cycle: number; first: boolean; label?: string; narrow: boolean; still: boolean }) {
  const cls = tone === "cobalt" ? "bg-[#405FDA] text-white" : tone === "sun" ? "bg-[#FFF275] text-[#1B2570]" : "bg-white/95 text-[#14206B]";
  return (
    <span
      className={`en-m-say pointer-events-none absolute left-1/2 z-10 rounded-xl px-2.5 py-1 font-semibold whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] ${cls}`}
      style={{
        bottom: "calc(100% + 7px)",
        opacity: still && first ? 1 : 0,
        transform: "translateX(-50%)",
        fontSize: narrow ? 10.5 : 12.5,
        animation: still ? undefined : `en-say ${cycle}s ease-out ${delay}s infinite`,
      }}
    >
      {label && <span className="mb-0.5 block text-[8.5px] font-bold tracking-[0.14em] uppercase opacity-70">{label}</span>}
      {text}
      <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-inherit" />
    </span>
  );
}

/* =====================  PENGGERAK  ===================== */
/** elemen yang melintas; `x` (vw) dipakai saat gerakan dimatikan */
function Mover({
  name,
  dur,
  delay,
  top,
  x,
  still,
  className = "",
  children,
  style,
}: {
  name: string;
  dur: number;
  delay: number;
  top: number;
  x: number;
  still: boolean;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`en-m-walk absolute left-0 ${className}`}
      style={{
        top,
        ...(still ? { left: `${x}vw` } : { animation: `${name} ${dur}s linear ${delay}s infinite`, willChange: "transform" }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* =====================  DATA ADEGAN  ===================== */
const WALKERS: {
  kind: Kind;
  coat: string;
  pants: string;
  hij?: string;
  bag?: boolean;
  dir: "r" | "l";
  depth: number;
  dur: number;
  x: number;
  say?: string[];
}[] = [
  { kind: "short", coat: "#26357F", pants: "#0C1240", bag: true, dir: "r", depth: 0.2, dur: 54, x: 12, say: ["Good morning, everyone!", "Shall we start the meeting?", "Let's schedule a call."] },
  { kind: "hijab", coat: "#1F5A73", pants: "#0B1136", hij: "#CDB7E8", dir: "l", depth: 0.45, dur: 60, x: 30, say: ["Nice to meet you.", "Could you send the report?", "Thank you so much!"] },
  { kind: "long", coat: "#5B2A55", pants: "#0D1038", dir: "r", depth: 0.7, dur: 66, x: 58, say: ["I'll be there at nine.", "Welcome to the team!", "See you at the presentation."] },
  { kind: "bun", coat: "#2E3E96", pants: "#0C1240", dir: "l", depth: 0.32, dur: 50, x: 76, say: ["How was your meeting?", "It went really well.", "Congratulations!"] },
  { kind: "short", coat: "#3A3F52", pants: "#0B0E2C", bag: true, dir: "r", depth: 0.55, dur: 70, x: 92, say: ["Let's close the deal.", "I'll send the contract today.", "Perfect. Talk soon!"] },
  { kind: "hijab", coat: "#262F7A", pants: "#0B1136", hij: "#F0D7A0", dir: "l", depth: 0.62, dur: 58, x: 20 },
  { kind: "short", coat: "#6A3B2E", pants: "#0A0E34", dir: "r", depth: 0.38, dur: 62, x: 46, bag: true },
  { kind: "long", coat: "#2A4F7A", pants: "#0C1240", dir: "l", depth: 0.52, dur: 68, x: 66 },
];
const TONES: Tone[] = ["white", "cobalt", "white"];

/* =====================  ADEGAN  ===================== */
export function CorporateScene() {
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => setSize({ w: el.clientWidth || 1440, h: el.clientHeight || 900 });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const narrow = w < 640;
  const k = narrow ? 0.74 : 1;
  const G = Math.round(Math.min(240, Math.max(narrow ? 138 : 156, h * 0.25)));
  const gt = h - G; // tepi atas trotoar
  const deck = gt - Math.round(46 * k);

  const city = useMemo(() => buildCity(w, gt, gt, narrow), [w, gt, narrow]);
  const near = city[3];
  const stars = useMemo(() => {
    const r = rng(44);
    const n = narrow ? 24 : 44;
    return Array.from({ length: n }, (_, i) => ({ x: r() * w, y: 56 + r() * gt * 0.5, s: 0.7 + r() * 1.2, set: i % 2 }));
  }, [w, gt, narrow]);

  const moonX = w * 0.88;
  const moonY = h * 0.2;
  const moonR = Math.max(20, h * 0.03);

  // di HP: lebih sedikit orang & hanya satu yang berbicara, supaya gelembung tidak bertumpuk
  const walkers = narrow ? WALKERS.slice(0, 4).map((p, i) => (i > 0 ? { ...p, say: undefined } : p)) : WALKERS;
  const feetY = (depth: number) => gt + G * (0.13 + 0.38 * depth);
  const scaleOf = (depth: number) => (1.05 + 0.65 * depth) * k * 1.1;
  const frac = (x: number, dir: "r" | "l") => (dir === "r" ? (x + 8) / 116 : (108 - x) / 116);

  const treeSpecs = useMemo(
    () =>
      narrow
        ? [
            { x: 0.04, s: 1.0, tone: 0 },
            { x: 0.2, s: 0.8, tone: 1 },
            { x: 0.82, s: 0.85, tone: 2 },
            { x: 0.96, s: 1.05, tone: 1 },
          ]
        : [
            { x: 0.03, s: 1.2, tone: 0 },
            { x: 0.11, s: 0.95, tone: 2 },
            { x: 0.19, s: 1.1, tone: 1 },
            { x: 0.25, s: 0.8, tone: 0 },
            { x: 0.75, s: 0.82, tone: 2 },
            { x: 0.82, s: 1.12, tone: 0 },
            { x: 0.9, s: 0.95, tone: 1 },
            { x: 0.98, s: 1.22, tone: 2 },
          ],
    [narrow],
  );
  const lampXs = narrow ? [0.1, 0.5, 0.9] : [0.06, 0.2, 0.36, 0.5, 0.64, 0.8, 0.94];
  const lampBase = gt + G * 0.57;
  const lampH = 104 * k;

  const cars = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: narrow ? 5 : 9 }, (_, i) => ({ dir: i % 2 === 0 ? "r" : "l", lane: i % 2, len: 84 + r() * 90, dur: 9 + r() * 9, delay: -r() * 18 }));
  }, [narrow]);

  const train = useMemo(() => {
    const r = rng(8);
    const cars = 4;
    const CW = 224;
    const wins = Array.from({ length: cars }, () => Array.from({ length: 6 }, () => ({ pax: r() < 0.55, cool: r() < 0.2 })));
    return { cars, CW, wins };
  }, []);
  const trainLen = train.cars * train.CW * k;
  const trainTop = deck - 44 * k;

  const rise = (i: number) => (reduce ? { initial: false as const } : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay: 0.1 + i * 0.12, ease: "easeOut" as const } });
  const ov = (dur: number, delay: number, name = "en-twinkle"): React.CSSProperties => ({ animation: reduce ? undefined : `${name} ${dur}s ease-in-out ${delay}s infinite`, willChange: reduce ? undefined : "opacity" });

  const pairX = w * (narrow ? 0.5 : 0.84);
  const pairFeet = gt + G * 0.36;
  const ps = k * 1.32;

  return (
    <motion.div
      ref={root}
      aria-hidden
      className={`absolute inset-0 z-[6] overflow-hidden ${inView ? "" : "en-paused"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.8 }}
      style={{ background: "#050823" }}
    >
      {/* ===== langit ===== */}
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sk-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={gt}>
            <stop offset="0%" stopColor="#040720" />
            <stop offset="34%" stopColor="#0A1450" />
            <stop offset="60%" stopColor="#1F3C9E" />
            <stop offset="80%" stopColor="#3E7DC8" />
            <stop offset="93%" stopColor="#F2A58E" />
            <stop offset="100%" stopColor="#FFD2A0" />
          </linearGradient>
          <radialGradient id="sk-sun" gradientUnits="userSpaceOnUse" cx={w * 0.34} cy={gt - 18} r={gt * 0.6}>
            <stop offset="0%" stopColor="#FFF1CC" stopOpacity="0.9" />
            <stop offset="14%" stopColor="#FFD59A" stopOpacity="0.6" />
            <stop offset="45%" stopColor="#FF9F7E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FF9F7E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sk-moon" gradientUnits="userSpaceOnUse" cx={moonX} cy={moonY} r={moonR * 5}>
            <stop offset="0%" stopColor="#FFF6D6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#BFD0FF" stopOpacity="0" />
          </radialGradient>
          <mask id="sk-crescent">
            <rect x={moonX - moonR * 2} y={moonY - moonR * 2} width={moonR * 4} height={moonR * 4} fill="#000" />
            <circle cx={moonX} cy={moonY} r={moonR} fill="#fff" />
            <circle cx={moonX + moonR * 0.45} cy={moonY - moonR * 0.18} r={moonR * 0.92} fill="#000" />
          </mask>
        </defs>
        <rect width={w} height={gt + 2} fill="url(#sk-sky)" />
        <circle cx={w * 0.34} cy={gt - 18} r={gt * 0.6} fill="url(#sk-sun)" />
        {!narrow && (
          <>
            <circle cx={moonX} cy={moonY} r={moonR * 5} fill="url(#sk-moon)" />
            <circle cx={moonX} cy={moonY} r={moonR} fill="#FFF3CF" mask="url(#sk-crescent)" />
          </>
        )}
      </svg>

      {/* bintang berkedip (dua kelompok) */}
      {[0, 1].map((set) => (
        <svg key={set} viewBox={`0 0 ${w} ${h}`} className="en-m-ov absolute inset-0 h-full w-full" preserveAspectRatio="none" style={ov(3.2 + set * 1.6, set * 1.3)}>
          {stars.filter((s) => s.set === set).map((s, i) => (
            <circle key={i} cx={f1(s.x)} cy={f1(s.y)} r={s.s} fill="#fff" />
          ))}
        </svg>
      ))}
      {!narrow && !reduce && (
        <div className="en-m-shoot absolute" style={{ left: w * 0.72, top: h * 0.1, opacity: 0, animation: "en-shoot 19s linear 4s infinite" }}>
          <svg width="60" height="30" viewBox="0 0 60 30" aria-hidden>
            <path d="M58 2 L6 28" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity=".85" />
          </svg>
        </div>
      )}

      {/* awan berjalan */}
      {[
        { y: 0.15, s: 1.2, dur: 190, x: 12, o: 1 },
        { y: 0.3, s: 0.9, dur: 230, x: 62, o: 0.8 },
        { y: 0.42, s: 1.5, dur: 270, x: 36, o: 0.7 },
      ].map((c, i) => (
        <Mover key={i} name="en-drift" dur={c.dur} delay={-c.dur * ((c.x + 35) / 170)} top={gt * c.y} x={c.x} still={reduce} className="en-m-cloud" style={{ opacity: c.o }}>
          <svg width={440 * c.s} height={96 * c.s} viewBox="0 0 440 96" aria-hidden>
            {[
              [220, 56, 190, 26],
              [130, 46, 118, 24],
              [300, 44, 128, 22],
              [220, 50, 120, 18],
            ].map(([cx, cy, rx, ry], j) => (
              <g key={j}>
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#E9B4C8" opacity=".07" />
                <ellipse cx={cx} cy={cy} rx={rx * 0.78} ry={ry * 0.78} fill="#F6C9C0" opacity=".1" />
                <ellipse cx={cx} cy={cy} rx={rx * 0.5} ry={ry * 0.5} fill="#FFE2CC" opacity=".12" />
              </g>
            ))}
          </svg>
        </Mover>
      ))}

      {/* pesawat & burung */}
      {!reduce && (
        <>
          <div className="en-m-fly absolute left-0" style={{ top: gt * 0.34, animation: "en-fly 70s linear 2s infinite", willChange: "transform" }}>
            <svg width="140" height="16" viewBox="-124 -8 140 16" aria-hidden>
              <path d="M0 0 L-120 0" stroke="#fff" strokeOpacity=".16" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M0 0 L9 -1.2 L12 0 L9 1.2Z M3.5 0 L1 -4.5 L2.6 -4.5 L6 0Z M3.5 0 L1 4.5 L2.6 4.5 L6 0Z" fill="#E8EDFF" opacity=".9" />
              <circle className="en-m-blink" cx="0" cy="0" r="1.5" fill="#FF5A5A" style={{ animation: "en-blink 1.6s linear infinite" }} />
            </svg>
          </div>
          {[
            { top: gt * 0.5, dur: 52, delay: -10, n: 5, sc: 1 },
            { top: gt * 0.24, dur: 78, delay: -48, n: 3, sc: 0.8 },
          ].map((b, i) => (
            <div key={i} className="en-m-walk absolute left-0" style={{ top: b.top, animation: `en-walk-r ${b.dur}s linear ${b.delay}s infinite`, willChange: "transform" }}>
              <svg width={150 * b.sc} height={50 * b.sc} viewBox="0 0 150 50" aria-hidden>
                {Array.from({ length: b.n }, (_, j) => {
                  const bx = 20 + j * 24;
                  const by = 25 + (j % 2 ? 9 : -7) * (j === 0 ? 0 : 1);
                  return (
                    <path
                      key={j}
                      className="en-m-flap"
                      d={`M${bx - 6} ${by} Q${bx - 3} ${by - 4} ${bx} ${by} Q${bx + 3} ${by - 4} ${bx + 6} ${by}`}
                      fill="none"
                      stroke="#10164F"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: `en-flap 0.55s ease-in-out ${j * 0.1}s infinite` }}
                    />
                  );
                })}
              </svg>
            </div>
          ))}
        </>
      )}

      {/* ===== kota berlapis ===== */}
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ct-mist" gradientUnits="userSpaceOnUse" x1="0" y1={gt - gt * 0.34} x2="0" y2={gt}>
            <stop offset="0%" stopColor="#FFB89A" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFB89A" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {city.map((L, i) => (
          <motion.g key={L.id} {...rise(i)}>
            <path d={L.body} fill={L.tone} opacity={L.opacity} />
            {L.edge && <path d={L.edge} fill="#FFC594" opacity={L.id === "near" ? 0.3 : 0.18} />}
            {L.warm && <path d={L.warm} fill="#FFD98A" opacity=".92" />}
            {L.cool && <path d={L.cool} fill="#BFE3FF" opacity=".85" />}
            {L.strips && <path d={L.strips} fill="#BFE3FF" opacity=".85" />}
            {(L.id === "far" || L.id === "mid") && <rect x="-60" y={f1(gt - gt * 0.34)} width={f1(w + 120)} height={f1(gt * 0.34 + 2)} fill="url(#ct-mist)" opacity={L.id === "far" ? 0.55 : 0.4} />}
          </motion.g>
        ))}
      </svg>

      {/* jendela, mahkota & lampu peringatan yang berkedip (lapisan terpisah = ringan) */}
      {[0, 1, 2].map((i) => (
        <svg key={i} viewBox={`0 0 ${w} ${h}`} className="en-m-ov absolute inset-0 h-full w-full" preserveAspectRatio="none" style={ov(5 + i * 2.3, i * 1.1)}>
          {i === 0 && (
            <defs>
              <radialGradient id="ov-crown">
                <stop offset="0%" stopColor="#FFF0C4" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#FFD38A" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#FFD38A" stopOpacity="0" />
              </radialGradient>
            </defs>
          )}
          <path d={near.tw[i]} fill="#FFE2A6" />
          {i === 0 && near.crowns.map((c, j) => <circle key={j} cx={f1(c.x)} cy={f1(c.y)} r={f1(c.r)} fill="url(#ov-crown)" />)}
        </svg>
      ))}
      <svg viewBox={`0 0 ${w} ${h}`} className="en-m-ov absolute inset-0 h-full w-full" preserveAspectRatio="none" style={ov(2.6, 0.4, "en-blink")}>
        {near.beacons.map((b, j) => (
          <g key={j}>
            <circle cx={f1(b.x)} cy={f1(b.y)} r="5" fill="#FF3B3B" opacity=".35" />
            <circle cx={f1(b.x)} cy={f1(b.y)} r="1.8" fill="#FF8A8A" />
          </g>
        ))}
      </svg>

      {/* ===== jalan layang + trotoar + jalan ===== */}
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="st-deck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5463B8" />
            <stop offset="100%" stopColor="#141C60" />
          </linearGradient>
          <linearGradient id="st-pillar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#222C78" />
            <stop offset="100%" stopColor="#080C34" />
          </linearGradient>
          <linearGradient id="st-walk" gradientUnits="userSpaceOnUse" x1="0" y1={gt} x2="0" y2={gt + G * 0.58}>
            <stop offset="0%" stopColor="#18236E" />
            <stop offset="100%" stopColor="#0B1244" />
          </linearGradient>
          <linearGradient id="st-road" gradientUnits="userSpaceOnUse" x1="0" y1={gt + G * 0.58} x2="0" y2={h}>
            <stop offset="0%" stopColor="#0A0F3A" />
            <stop offset="100%" stopColor="#03051A" />
          </linearGradient>
        </defs>
        {/* pilar + tiang listrik */}
        {Array.from({ length: Math.ceil(w / (150 * k)) + 1 }, (_, i) => {
          const px = 40 + i * 150 * k;
          return <rect key={i} x={f1(px - 7 * k)} y={deck + 10 * k} width={14 * k} height={gt - deck - 10 * k + 2} fill="url(#st-pillar)" />;
        })}
        {Array.from({ length: Math.ceil(w / (90 * k)) + 1 }, (_, i) => {
          const px = 20 + i * 90 * k;
          return (
            <g key={i}>
              <rect x={f1(px)} y={deck - 40 * k} width="2" height={40 * k} fill="#5666B8" opacity=".6" />
              <circle cx={f1(px + 1)} cy={deck - 40 * k} r="1.8" fill="#FFE2A6" opacity=".8" />
            </g>
          );
        })}
        <path d={`M0 ${f1(deck - 38 * k)}H${w}`} stroke="#6C7FD0" strokeOpacity=".35" strokeWidth="1" />
        <rect x="0" y={deck} width={w} height={10 * k} fill="url(#st-deck)" />
        <rect x="0" y={deck + 10 * k} width={w} height="7" fill="#000" opacity=".35" />
        {Array.from({ length: Math.ceil(w / (75 * k)) + 1 }, (_, i) => (
          <circle key={i} cx={f1(40 + i * 75 * k)} cy={f1(deck + 15 * k)} r="1.6" fill="#FFE2A6" opacity=".7" />
        ))}

        {/* trotoar, jalur sepeda, jalan */}
        <rect x="0" y={gt} width={w} height={G * 0.58} fill="url(#st-walk)" />
        {[0.2, 0.4].map((f) => (
          <rect key={f} x="0" y={f1(gt + G * f)} width={w} height="1" fill="#fff" opacity=".05" />
        ))}
        <rect x="0" y={f1(gt + G * 0.58)} width={w} height="2" fill="#6C7FD0" opacity=".5" />
        <rect x="0" y={f1(gt + G * 0.6)} width={w} height={f1(G * 0.4 + 2)} fill="url(#st-road)" />
        {Array.from({ length: Math.ceil(w / 70) + 1 }, (_, i) => (
          <rect key={i} x={i * 70} y={f1(gt + G * 0.78)} width="36" height="1.6" rx=".8" fill="#fff" opacity=".28" />
        ))}
        {Array.from({ length: Math.ceil(w / 120) + 1 }, (_, i) => (
          <rect key={`b${i}`} x={i * 120 + 20} y={f1(gt + G * 0.93)} width="60" height="1.6" rx=".8" fill="#FFF275" opacity=".25" />
        ))}
        {/* bangku */}
        <g opacity=".95">
          <rect x={f1(pairX - 40 * k)} y={f1(pairFeet - 15 * k)} width={80 * k} height={5 * k} rx="1.5" fill="#3A2A52" />
          <rect x={f1(pairX - 40 * k)} y={f1(pairFeet - 33 * k)} width={80 * k} height={3.5 * k} rx="1.5" fill="#4A3866" />
          <rect x={f1(pairX - 36 * k)} y={f1(pairFeet - 15 * k)} width={3 * k} height={15 * k} fill="#1A1230" />
          <rect x={f1(pairX + 33 * k)} y={f1(pairFeet - 15 * k)} width={3 * k} height={15 * k} fill="#1A1230" />
          <rect x={f1(pairX - 36 * k)} y={f1(pairFeet - 33 * k)} width={3 * k} height={18 * k} fill="#1A1230" />
          <rect x={f1(pairX + 33 * k)} y={f1(pairFeet - 33 * k)} width={3 * k} height={18 * k} fill="#1A1230" />
        </g>
      </svg>

      {/* ===== kereta layang ===== */}
      {!reduce && (
        <div
          className="en-m-train absolute left-0"
          style={{ top: trainTop, ["--len" as string]: `${trainLen}px`, animation: "en-train 40s linear -6s infinite", willChange: "transform" } as React.CSSProperties}
        >
          <svg width={trainLen} height={44 * k} viewBox={`0 0 ${train.cars * train.CW} 44`} aria-hidden>
            <defs>
              <linearGradient id="tr-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4B63C9" />
                <stop offset="100%" stopColor="#141C60" />
              </linearGradient>
            </defs>
            {Array.from({ length: train.cars }, (_, c) => {
              const x0 = c * train.CW + 2;
              return (
                <g key={c}>
                  <rect x={x0} y="2" width={train.CW - 4} height="36" rx="9" fill="url(#tr-body)" />
                  <rect x={x0 + 8} y="3.5" width={train.CW - 20} height="3" rx="1.5" fill="#B4C4F8" opacity=".55" />
                  {train.wins[c].map((wn, i) => {
                    const wx = x0 + 14 + i * 32;
                    return (
                      <g key={i}>
                        <rect x={wx} y="10" width="26" height="14" rx="3" fill={wn.cool ? "#BFE3FF" : "#FFD98A"} />
                        {wn.pax && (
                          <>
                            <circle cx={wx + 13} cy="16" r="3.2" fill="#2A1830" opacity=".75" />
                            <path d={`M${wx + 7} 24 Q${wx + 13} 17.5 ${wx + 19} 24Z`} fill="#2A1830" opacity=".75" />
                          </>
                        )}
                      </g>
                    );
                  })}
                  <rect x={x0 + 18} y="27" width={train.CW - 40} height="9" rx="2" fill="#050A28" />
                  {(c === 0 || c === 2) && (
                    <text x={x0 + train.CW / 2 - 2} y="34.4" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="7" fill="#FFF275" letterSpacing=".6">
                      {c === 0 ? "ENGLISH NOW EXPRESS" : "NEXT STOP: GLOBAL OPPORTUNITIES"}
                    </text>
                  )}
                  <rect x={x0 + 26} y="38" width="24" height="4" rx="1" fill="#0A0F3A" />
                  <rect x={x0 + train.CW - 54} y="38" width="24" height="4" rx="1" fill="#0A0F3A" />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* ===== pohon berlapis (bergoyang) ===== */}
      {treeSpecs.map((t, i) => {
        const s = t.s * k;
        return (
          <div
            key={i}
            className="en-m-sway absolute"
            style={{
              left: w * t.x - 80 * s,
              top: gt + G * 0.2 - 230 * s,
              transformOrigin: "50% 100%",
              animation: reduce ? undefined : `en-sway ${5 + (i % 4)}s ease-in-out ${-i * 0.9}s infinite alternate`,
              willChange: reduce ? undefined : "transform",
            }}
          >
            <TreeSvg s={s} seed={100 + i * 7} tone={t.tone} />
          </div>
        );
      })}

      {/* ===== lampu taman: meredup-menyala ===== */}
      {lampXs.map((lx, i) => {
        const cx = w * lx;
        const lw = 140 * k;
        const lh = lampH + 70 * k + 60 * k;
        const anim = reduce ? undefined : i % 3 === 2 ? `en-flicker ${7 + i}s linear ${-i}s infinite` : `en-lamp ${4 + (i % 3) * 1.5}s ease-in-out ${-i * 0.8}s infinite`;
        return (
          <div key={i} className="absolute" style={{ left: cx - lw / 2, top: lampBase - lampH - 66 * k }}>
            <svg width={lw} height={lh} viewBox={`0 0 140 ${lampH / k + 70 + 60}`} style={{ display: "block", overflow: "visible" }} aria-hidden>
              <rect x="68.8" y="66" width="2.4" height={lampH / k} fill="#0A0F3A" />
              <rect x="64" y="62" width="12" height="5" rx="2" fill="#141C60" />
            </svg>
            <svg className="en-m-lamp absolute inset-0" width={lw} height={lh} viewBox={`0 0 140 ${lampH / k + 70 + 60}`} style={{ overflow: "visible", animation: anim, willChange: reduce ? undefined : "opacity" }} aria-hidden>
              <defs>
                <radialGradient id={`lg${i}`}>
                  <stop offset="0%" stopColor="#FFF0C4" stopOpacity="0.95" />
                  <stop offset="30%" stopColor="#FFD38A" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFD38A" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`lc${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD59A" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#FFD59A" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`lr${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD59A" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FFD59A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`M70 66 L36 ${lampH / k + 66} L104 ${lampH / k + 66}Z`} fill={`url(#lc${i})`} />
              <ellipse cx="70" cy={lampH / k + 66} rx="58" ry="9" fill="#FFD59A" opacity=".16" />
              <rect x="64" y={lampH / k + 68} width="12" height="44" fill={`url(#lr${i})`} />
              <circle cx="70" cy="66" r="62" fill={`url(#lg${i})`} />
              <circle cx="70" cy="65" r="3.4" fill="#FFF6D6" />
            </svg>
          </div>
        );
      })}

      {/* ===== merpati berjalan ===== */}
      {[
        { x: 22, dir: "r" as const, dur: 160, depth: 0.55 },
        { x: 52, dir: "l" as const, dur: 190, depth: 0.42 },
        { x: 74, dir: "r" as const, dur: 150, depth: 0.5 },
      ].map((p, i) => (
        <Mover key={i} name={p.dir === "r" ? "en-walk-r" : "en-walk-l"} dur={p.dur} delay={-p.dur * frac(p.x, p.dir)} top={feetY(p.depth) - 17 * k * 1.3} x={p.x} still={reduce}>
          <PigeonSvg s={k * 1.3} flip={p.dir === "l"} />
        </Mover>
      ))}

      {/* ===== pasangan mengobrol di bangku ===== */}
      <div className="absolute flex items-end" style={{ left: pairX - 43 * ps, top: pairFeet - 62 * ps, gap: 6 * ps }}>
        <PersonSvg kind="long" coat="#5B2A55" pants="#0D1038" s={ps} walk={false} />
        <PersonSvg kind="short" coat="#26357F" pants="#0C1240" bag s={ps} flip walk={false} />
        <Say text="Could we reschedule?" tone="white" delay={narrow ? 1.5 : -1} cycle={12} first narrow={narrow} still={reduce} />
        <Say text="Of course. Friday works." tone="cobalt" delay={narrow ? 5.5 : 3} cycle={12} first={false} narrow={narrow} still={reduce} />
        <Say text="Polite & clear: “Could we…?”" label="English Now tip" tone="sun" delay={narrow ? 9.5 : 7} cycle={12} first={false} narrow={narrow} still={reduce} />
      </div>

      {/* ===== pesepeda ===== */}
      <Mover name="en-walk-l" dur={34} delay={-34 * frac(64, "l")} top={gt + G * 0.76 - 61 * k * 1.3} x={64} still={reduce}>
        <CyclistSvg s={k * 1.3} />
        <Say text="Excuse me!" tone="white" delay={-0.5} cycle={10} first narrow={narrow} still={reduce} />
      </Mover>

      {/* ===== orang berjalan + obrolan bahasa Inggris ===== */}
      {[...walkers]
        .sort((a, b) => a.depth - b.depth)
        .map((p, i) => {
          const s = scaleOf(p.depth);
          const speakerIdx = p.say ? walkers.filter((q) => q.say).indexOf(p) : -1;
          const d0 = speakerIdx < 3 ? -(0.8 + 0.3 * speakerIdx) : 1.5 + 0.9 * (speakerIdx - 3);
          return (
            <Mover key={i} name={p.dir === "r" ? "en-walk-r" : "en-walk-l"} dur={p.dur} delay={-p.dur * frac(p.x, p.dir)} top={feetY(p.depth) - 62 * s} x={p.x} still={reduce}>
              <PersonSvg kind={p.kind} coat={p.coat} pants={p.pants} hij={p.hij} bag={p.bag} s={s} flip={p.dir === "l"} walk={!reduce} />
              {p.say?.map((t, j) => (
                <Say key={j} text={t} tone={TONES[j]} delay={d0 + j * 4} cycle={12} first={j === 0} narrow={narrow} still={reduce} />
              ))}
            </Mover>
          );
        })}

      {/* ===== mobil: lampu putih di depan, lampu belakang merah di belakang ===== */}
      {!reduce &&
        cars.map((c, i) => (
          <div
            key={i}
            className="en-m-car absolute left-0"
            style={{
              top: gt + G * (0.82 + 0.1 * c.lane),
              width: c.len,
              height: 3,
              borderRadius: 2,
              background:
                c.dir === "r"
                  ? "linear-gradient(90deg, rgba(255,70,70,0) 0%, rgba(255,70,70,.85) 45%, rgba(255,246,214,1) 88%, rgba(255,246,214,.25) 100%)"
                  : "linear-gradient(270deg, rgba(255,70,70,0) 0%, rgba(255,70,70,.85) 45%, rgba(255,246,214,1) 88%, rgba(255,246,214,.25) 100%)",
              boxShadow: "0 0 10px rgba(255,226,166,.45)",
              animation: `${c.dir === "r" ? "en-road-r" : "en-road-l"} ${c.dur}s linear ${c.delay}s infinite`,
              willChange: "transform",
            }}
          />
        ))}

      {/* vinyet & butiran film */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 58%, rgba(0,0,0,0.5) 100%)" }} />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          opacity: 0.08,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")",
        }}
      />
    </motion.div>
  );
}
