"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ArticleDoc, Block } from "@/lib/articles";
import { SECTION_BG } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";
import { useTrial } from "../trial-modal";

/**
 * Halaman artikel. Satu mesin blok, dua tampilan:
 *  - Dewasa: editorial. Kilas 30 detik, daftar isi yang ikut bergulir, kata bergaris titik yang bisa diketuk
 *    (arti langsung di tempat), template email yang bisa disalin.
 *  - Anak: ramah dan besar. Layang-layang sebagai penanda baca, kartu kata yang bisa dibalik, kuis kecil.
 */
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const fmtDate = (iso: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T00:00:00"));

/* ---------- teks dengan penanda ringan ---------- */
function Term({ word, meaning, kids }: { word: string; meaning: string; kids: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        className={`cursor-help border-b-2 border-dotted font-semibold ${kids ? "border-sky text-cobalt" : "border-cobalt/60 text-cobalt-900"}`}
      >
        {word}
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap shadow-lg transition duration-150 ${
          open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        } ${kids ? "bg-sun text-ink" : "bg-cobalt-900 text-white"}`}
      >
        {meaning}
      </span>
    </span>
  );
}

function Inline({ text, kids }: { text: string; kids: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\{\{[^}|]+\|[^}]+\}\})/g);
  return (
    <>
      {parts.map((p, i) => {
        let m: RegExpMatchArray | null;
        if ((m = p.match(/^\*\*([^*]+)\*\*$/))) return <strong key={i} className="font-bold text-cobalt-900">{m[1]}</strong>;
        if ((m = p.match(/^\*([^*]+)\*$/))) return <em key={i}>{m[1]}</em>;
        if ((m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/))) return <a key={i} href={m[2]} className="font-semibold text-cobalt underline decoration-2 underline-offset-4 hover:text-cobalt-900">{m[1]}</a>;
        if ((m = p.match(/^\{\{([^}|]+)\|([^}]+)\}\}$/))) return <Term key={i} word={m[1]} meaning={m[2]} kids={kids} />;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/* ---------- blok interaktif ---------- */
function Flip({ item, i }: { item: { word: string; meaning: string; example: string }; i: number }) {
  const [on, setOn] = useState(false);
  const tint = ["bg-sun", "bg-[#BFE6FF]", "bg-[#FFD0B8]", "bg-[#C9F0C4]"][i % 4];
  return (
    <button type="button" onClick={() => setOn((v) => !v)} aria-pressed={on} className="group relative h-40 w-full text-left [perspective:800px]">
      <span className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: on ? "rotateY(180deg)" : "none" }}>
        <span className={`absolute inset-0 grid place-items-center rounded-3xl ${tint} font-display text-4xl text-ink shadow-[0_5px_0_0_rgba(0,0,0,0.12)] [backface-visibility:hidden]`}>
          {item.word}
          <span className="absolute right-3 bottom-2 text-xs font-sans font-bold text-ink/50">ketuk</span>
        </span>
        <span className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-center rounded-3xl bg-cobalt px-5 text-white shadow-[0_5px_0_0_var(--color-cobalt-900)] [backface-visibility:hidden]">
          <span className="font-display text-2xl text-sun">{item.meaning}</span>
          <span className="mt-1 text-sm">{item.example}</span>
        </span>
      </span>
    </button>
  );
}

function Quiz({ b, kids }: { b: Extract<Block, { type: "quiz" }>; kids: boolean }) {
  const [pick, setPick] = useState<number | null>(null);
  const done = pick !== null;
  return (
    <div className={`no-print my-10 p-6 sm:p-7 ${kids ? "rounded-[2rem] bg-white shadow-[0_8px_0_0_var(--color-mist)]" : "rounded-2xl bg-white ring-1 ring-cobalt-900/10"}`}>
      <p className={`text-xs font-bold tracking-[0.18em] uppercase ${kids ? "text-sky" : "text-cobalt"}`}>{kids ? "Kuis kecil" : "Cek pemahaman"}</p>
      <p className={`mt-2 ${kids ? "font-display text-2xl text-cobalt-900" : "text-lg font-semibold text-cobalt-900"}`}>{b.question}</p>
      <div className="mt-4 grid gap-2.5">
        {b.options.map((o, i) => {
          const right = done && i === b.answer;
          const wrong = done && pick === i && i !== b.answer;
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => setPick(i)}
              className={`rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition ${
                right ? "bg-[#C9F0C4] text-ink ring-2 ring-[#4CAF50]" : wrong ? "bg-[#FFD9D9] text-ink ring-2 ring-[#E57373]" : "bg-mist-50 text-ink ring-1 ring-mist hover:bg-white hover:ring-cobalt/40 disabled:opacity-60"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink/80">
          <p>{pick === b.answer ? "Tepat. " : "Belum tepat. "}{b.explain}</p>
          <button type="button" onClick={() => setPick(null)} className="font-bold text-cobalt underline underline-offset-4">Coba lagi</button>
        </div>
      )}
    </div>
  );
}

function CopyTemplate({ b }: { b: Extract<Block, { type: "template" }> }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="print-tpl my-8 overflow-hidden rounded-2xl bg-[#0F1A55] text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <p className="text-sm font-bold">{b.title}</p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(b.text);
              setOk(true);
              window.setTimeout(() => setOk(false), 1800);
            } catch {
              /* clipboard bisa diblokir, abaikan */
            }
          }}
          className="no-print rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-bold transition hover:bg-white/20"
        >
          {ok ? "Tersalin" : "Salin"}
        </button>
      </div>
      <pre className="overflow-x-auto px-5 py-4 text-[13.5px] leading-relaxed whitespace-pre-wrap text-white/90">{b.text}</pre>
    </div>
  );
}

function Embed({ b, kids }: { b: Extract<Block, { type: "embed" }>; kids: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <figure className="no-print my-8">
      <div className={`relative overflow-hidden bg-mist ${kids ? "rounded-[1.75rem] border-4 border-white shadow-[0_8px_0_0_var(--color-mist)]" : "rounded-xl ring-1 ring-ink/10"}`} style={{ aspectRatio: b.ratio ?? "16/9" }}>
        {on ? (
          <iframe title={b.title} src={b.src} loading="lazy" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="absolute inset-0 grid place-items-center bg-gradient-to-br from-sky/25 via-mist to-sun/30 text-cobalt-900">
            <span className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold shadow-md">▶ Muat {b.title}</span>
          </button>
        )}
      </div>
      {b.caption && <figcaption className="mt-2 text-sm text-ink/55">{b.caption}</figcaption>}
    </figure>
  );
}

function Cta({ b, kids }: { b: Extract<Block, { type: "cta" }>; kids: boolean }) {
  const { open } = useTrial();
  return (
    <div className={`no-print relative my-12 overflow-hidden p-7 sm:p-9 ${kids ? "rounded-[2rem] bg-sun text-ink shadow-[0_8px_0_0_var(--color-sun-600)]" : "rounded-3xl bg-gradient-to-br from-[#2B3FA8] to-[#14206B] text-white"}`}>
      {!kids && <span aria-hidden className="absolute -top-16 -right-10 size-56 rounded-full bg-[#FFF275]/15 blur-2xl" />}
      <h3 className={`relative ${kids ? "font-display text-3xl" : "text-2xl font-semibold tracking-[-0.02em]"}`}>{b.title}</h3>
      <p className={`relative mt-2 max-w-md ${kids ? "text-ink/75" : "text-white/80"}`}>{b.text}</p>
      <button
        type="button"
        onClick={() => open()}
        className={`relative mt-5 rounded-full px-6 py-3 text-base font-bold transition hover:-translate-y-0.5 ${kids ? "bg-cobalt font-display tracking-wide text-white shadow-[0_4px_0_0_var(--color-cobalt-900)]" : "bg-sun text-ink"}`}
      >
        {b.label} →
      </button>
    </div>
  );
}

const CALLOUT: Record<string, { adult: string; kids: string; label: string }> = {
  tip: { adult: "bg-[#EAF1FF] border-cobalt", kids: "bg-[#DFF3FF]", label: "Tips" },
  info: { adult: "bg-white border-sky", kids: "bg-white", label: "Info" },
  warn: { adult: "bg-[#FFF8C9] border-[#E3C400]", kids: "bg-[#FFF3A8]", label: "Perhatikan" },
  parent: { adult: "bg-[#FDEDE3] border-[#F4B48F]", kids: "bg-[#FFE1D0]", label: "Untuk orang tua" },
};

/* ---------- penyaji blok ---------- */
function Blocks({ blocks, kids }: { blocks: Block[]; kids: boolean }) {
  const I = (t: string) => <Inline text={t} kids={kids} />;
  const firstP = blocks.findIndex((x) => x.type === "p");
  const body = kids ? "text-[length:calc(1.125rem*var(--ts,1))] leading-[1.85]" : "text-[length:calc(1.0625rem*var(--ts,1))] leading-[1.85]";
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} id={slug(b.text)} className={`scroll-mt-24 ${kids ? "mt-12 font-display text-[2rem] leading-tight text-cobalt-900 [&]:after:mt-2 after:block after:h-1.5 after:w-14 after:rounded-full after:bg-sun" : "mt-14 text-[1.6rem] leading-tight font-semibold tracking-[-0.025em] text-cobalt-900"}`}>
                {b.text}
              </h2>
            );
          case "h3":
            return <h3 key={i} className={`mt-8 ${kids ? "font-display text-2xl text-cobalt" : "text-lg font-bold text-cobalt-900"}`}>{b.text}</h3>;
          case "p":
            return <p key={i} className={`mt-5 text-ink/85 ${body} ${!kids && i === firstP ? "first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:text-[3.7em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-cobalt" : ""}`}>{I(b.text)}</p>;
          case "ul":
            return (
              <ul key={i} className={`mt-5 space-y-2.5 ${body}`}>
                {b.items.map((t, k) => (
                  <li key={k} className="flex gap-3 text-ink/85">
                    <span aria-hidden className={`mt-[0.8em] size-2 shrink-0 rounded-full ${kids ? "bg-sky" : "bg-cobalt"}`} />
                    <span>{I(t)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className={`mt-5 space-y-3 ${body}`}>
                {b.items.map((t, k) => (
                  <li key={k} className="flex gap-4 text-ink/85">
                    <span className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${kids ? "bg-sun font-display text-base text-ink shadow-[0_3px_0_0_var(--color-sun-600)]" : "bg-cobalt text-white"}`}>{k + 1}</span>
                    <span>{I(t)}</span>
                  </li>
                ))}
              </ol>
            );
          case "image":
            return (
              <figure key={i} className="my-9">
                <div className={`relative aspect-[16/9] overflow-hidden bg-mist ${kids ? "rounded-[1.75rem] border-4 border-white shadow-[0_8px_0_0_var(--color-mist)]" : "rounded-xl"}`}>
                  <Image src={b.src} alt={b.alt} fill sizes="(min-width:1024px) 700px, 100vw" className="object-cover" />
                </div>
                {b.caption && <figcaption className="mt-2 text-sm text-ink/55">{b.caption}</figcaption>}
              </figure>
            );
          case "gallery":
            return (
              <div key={i} className="my-9 grid grid-cols-3 gap-2.5 sm:gap-4">
                {b.images.map((im, k) => (
                  <div key={k} className={`relative aspect-[3/4] overflow-hidden bg-mist ${kids ? "rounded-2xl border-4 border-white shadow-[0_6px_0_0_var(--color-mist)]" : "rounded-lg"} ${kids && k === 1 ? "-translate-y-3" : ""}`}>
                    <Image src={im.src} alt={im.alt} fill sizes="240px" className="object-cover" />
                  </div>
                ))}
              </div>
            );
          case "quote":
            return kids ? (
              <blockquote key={i} className="relative my-10 rounded-[2rem] rounded-bl-md bg-sun px-7 py-6 font-display text-[1.7rem] leading-snug text-ink shadow-[0_6px_0_0_var(--color-sun-600)]">
                “{b.text}”
              </blockquote>
            ) : (
              <blockquote key={i} className="my-10 border-l-4 border-cobalt pl-6">
                <p className="text-2xl leading-snug font-semibold tracking-[-0.02em] text-cobalt-900">“{b.text}”</p>
                {b.by && <footer className="mt-3 text-sm text-ink/55">{b.by}</footer>}
              </blockquote>
            );
          case "callout": {
            const t = CALLOUT[b.tone];
            return kids ? (
              <aside key={i} className={`my-9 flex gap-4 rounded-[1.75rem] p-5 sm:p-6 ${t.kids} shadow-[0_6px_0_0_rgba(0,0,0,0.07)]`}>
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-white font-display text-xl text-cobalt">!</span>
                <div>
                  <p className="font-display text-xl text-cobalt-900">{b.title ?? t.label}</p>
                  <p className="mt-1 text-[1.05rem] leading-relaxed text-ink/80">{I(b.text)}</p>
                </div>
              </aside>
            ) : (
              <aside key={i} className={`my-9 rounded-xl border-l-4 px-5 py-4 ${t.adult}`}>
                <p className="text-xs font-bold tracking-[0.16em] text-cobalt-900/70 uppercase">{b.title ?? t.label}</p>
                <p className="mt-1.5 text-[1.0125rem] leading-relaxed text-ink/85">{I(b.text)}</p>
              </aside>
            );
          }
          case "embed":
            return <Embed key={i} b={b} kids={kids} />;
          case "accordion":
            return (
              <div key={i} className={`my-9 ${kids ? "space-y-3" : "divide-y divide-cobalt-900/10 border-y border-cobalt-900/10"}`}>
                {b.items.map((it, k) => (
                  <details key={k} className={`group ${kids ? "rounded-2xl bg-white px-5 py-4 shadow-[0_5px_0_0_var(--color-mist)]" : "py-4"}`}>
                    <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 ${kids ? "font-display text-xl text-cobalt-900" : "text-base font-semibold text-cobalt-900"}`}>
                      {it.q}
                      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-cobalt text-white transition-transform duration-300 group-open:rotate-45"><svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M12 4v16M4 12h16" /></svg></span>
                    </summary>
                    <p className="mt-3 text-[1.02rem] leading-relaxed text-ink/75">{I(it.a)}</p>
                  </details>
                ))}
              </div>
            );
          case "vocab":
            return kids ? (
              <div key={i} className="my-9 grid grid-cols-2 gap-3 sm:gap-4">
                {b.items.map((it, k) => <Flip key={k} item={it} i={k} />)}
              </div>
            ) : (
              <div key={i} className="my-9 grid gap-3 sm:grid-cols-2">
                {b.items.map((it, k) => (
                  <div key={k} className="rounded-xl bg-white p-4 ring-1 ring-cobalt-900/10">
                    <p className="font-bold text-cobalt-900">{it.word}</p>
                    <p className="mt-0.5 text-sm font-semibold text-cobalt">{it.meaning}</p>
                    <p className="mt-2 text-sm text-ink/60 italic">“{it.example}”</p>
                  </div>
                ))}
              </div>
            );
          case "quiz":
            return <Quiz key={i} b={b} kids={kids} />;
          case "template":
            return <CopyTemplate key={i} b={b} />;
          case "table":
            return (
              <div key={i} className="my-9 overflow-x-auto rounded-xl ring-1 ring-cobalt-900/10">
                <table className="w-full min-w-[28rem] text-left text-[15px]">
                  <thead className="bg-white text-xs tracking-wider text-cobalt-900/70 uppercase">
                    <tr>{b.head.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-cobalt-900/10 bg-white/60">
                    {b.rows.map((r, k) => (
                      <tr key={k}>{r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-cobalt-900" : "text-ink/80"}`}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "cta":
            return <Cta key={i} b={b} kids={kids} />;
          case "divider":
            return <hr key={i} className="my-12 border-0 border-t border-cobalt-900/10" />;
        }
      })}
    </>
  );
}

/* ---------- kerangka halaman ---------- */
function useProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setP(h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return p;
}

function useScrolled(at = 200) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const on = () => setV(window.scrollY > at);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [at]);
  return v;
}

function Kite({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 52" className={className} style={style} aria-hidden>
      <path d="M20 2 L36 18 L20 38 L4 18 Z" fill="#FFF275" stroke="#1E2F78" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 2 V38 M4 18 H36" stroke="#1E2F78" strokeWidth="1.4" />
      <path d="M20 38 q-6 6 0 10 t0 4" fill="none" stroke="#07A9F8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ArticleView({ doc, related }: { doc: ArticleDoc; related: { slug?: string; title: string; cover: string; category: string; href: string }[] }) {
  const kids = doc.audience === "kids";
  const reduce = useReducedMotion() ?? false;
  const progress = useProgress();
  const scrolled = useScrolled();
  const [tocOpen, setTocOpen] = useState(false);
  const pageUrl = `${SITE_URL}/artikel/${doc.slug}`;
  const { open } = useTrial();
  const toc = useMemo(() => doc.blocks.filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2").map((b) => ({ id: slug(b.text), text: b.text })), [doc]);
  const [active, setActive] = useState(toc[0]?.id ?? "");
  const [fs, setFs] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // saat dicetak, buka semua akordeon supaya isinya ikut tercetak
    const openAll = () => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
    window.addEventListener("beforeprint", openAll);
    return () => window.removeEventListener("beforeprint", openAll);
  }, []);

  useEffect(() => {
    if (kids || toc.length === 0) return;
    const io = new IntersectionObserver(
      (es) => {
        const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setActive(v.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [kids, toc]);

  return (
    <div className="min-h-screen" style={{ background: SECTION_BG[doc.audience] }}>
      {/* penanda baca */}
      <div className="no-print fixed inset-x-0 top-0 z-50 h-1.5 bg-transparent" aria-hidden>
        <div className={`h-full origin-left ${kids ? "bg-sky" : "bg-cobalt"}`} style={{ transform: `scaleX(${progress})` }} />
        {kids && (
          <Kite className="absolute top-1 h-11 w-9 -translate-x-1/2 drop-shadow" style={{ left: `${progress * 100}%` }} />
        )}
      </div>

      {/* tombol melayang: kembali ke atas dan ajakan kelas gratis (muncul saat sudah membaca) */}
      <div className={`no-print pointer-events-none fixed inset-x-0 bottom-5 z-40 flex items-center justify-center px-5 transition duration-300 ${progress > 0.28 && progress < 0.9 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <button
          type="button"
          onClick={() => open()}
          tabIndex={progress > 0.28 && progress < 0.9 ? 0 : -1}
          className={`pointer-events-auto rounded-full px-6 py-3 text-sm font-bold shadow-[0_14px_30px_-10px_rgba(20,32,107,0.6)] transition hover:-translate-y-0.5 ${kids ? "bg-sun font-display text-base tracking-wide text-ink" : "bg-cobalt-900 text-white"}`}
        >
          Coba kelas gratis →
        </button>
      </div>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
        aria-label="Kembali ke atas"
        tabIndex={progress > 0.15 ? 0 : -1}
        className={`no-print fixed right-5 bottom-5 z-40 grid size-11 place-items-center rounded-full bg-white text-cobalt-900 shadow-lg ring-1 ring-cobalt-900/10 transition duration-300 hover:-translate-y-0.5 ${progress > 0.15 ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </button>

      {/* daftar isi mengambang di HP (Dewasa): kecil, di kiri bawah, muncul setelah mulai membaca */}
      {!kids && toc.length > 0 && (
        <div className={`no-print fixed bottom-5 left-4 z-40 lg:hidden transition duration-300 ${progress > 0.08 && progress < 0.97 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
          {tocOpen && (
            <nav aria-label="Isi artikel" className="absolute bottom-14 left-0 w-60 rounded-2xl bg-white p-3 shadow-[0_18px_40px_-12px_rgba(20,32,107,0.5)] ring-1 ring-cobalt-900/10">
              <ul className="space-y-0.5">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} onClick={() => setTocOpen(false)} className={`block rounded-lg px-3 py-2 text-[13px] leading-snug ${active === t.id ? "bg-cobalt/10 font-bold text-cobalt-900" : "text-ink/70"}`}>{t.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <button type="button" onClick={() => setTocOpen((v) => !v)} aria-expanded={tocOpen} aria-label="Isi artikel" tabIndex={progress > 0.08 && progress < 0.97 ? 0 : -1} className="grid size-11 place-items-center rounded-full bg-cobalt-900 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h10M4 17h13" /></svg>
          </button>
        </div>
      )}

      {/* bilah atas */}
      <header className={`no-print fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${scrolled ? "border-b border-cobalt-900/8 backdrop-blur-xl" : "border-b border-transparent"}`} style={{ background: scrolled ? `${SECTION_BG[doc.audience]}E6` : "transparent" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="relative block h-8 w-28" aria-label="English Now, kembali ke beranda">
            <Image src={scrolled ? "/brand/logo-full.png" : "/brand/logo-full-white.png"} alt="English Now" fill sizes="112px" className="object-contain object-left" priority />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`hidden text-sm tabular-nums sm:block ${scrolled ? "text-ink/55" : "text-white/80"}`} aria-live="off">{progress > 0.97 ? "Selesai dibaca" : `${Math.max(1, Math.ceil(doc.readMin * (1 - progress)))} menit lagi`}</span>
            <div role="group" aria-label="Ukuran teks" className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-cobalt-900/10">
              <span className="hidden pl-2.5 text-xs font-semibold text-ink/55 md:block">Ukuran teks</span>
              {[13, 16, 20].map((px, k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFs(k)}
                  aria-pressed={fs === k}
                  aria-label={["Teks kecil", "Teks sedang", "Teks besar"][k]}
                  title={["Teks kecil", "Teks sedang", "Teks besar"][k]}
                  className={`grid size-8 place-items-center rounded-full font-bold leading-none transition ${fs === k ? (kids ? "bg-cobalt text-white" : "bg-cobalt-900 text-white") : "text-cobalt-900 hover:bg-mist-50"}`}
                  style={{ fontSize: px }}
                >
                  A
                </button>
              ))}
            </div>
            <button type="button" onClick={() => window.print()} aria-label="Cetak artikel" title="Cetak artikel" className={`hidden size-9 place-items-center rounded-full transition md:grid ${scrolled ? "text-cobalt-900 hover:bg-white" : "text-white hover:bg-white/15"}`}>
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /></svg>
            </button>
            <Link href={`/?for=${doc.audience}#artikel`} className={`hidden text-sm font-semibold sm:block ${scrolled ? "text-cobalt-900 hover:text-cobalt" : "text-white hover:text-sun"}`}>← Semua artikel</Link>
            <button type="button" onClick={() => open()} className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition hover:-translate-y-0.5 ${scrolled ? "bg-cobalt-900 text-white" : "bg-sun text-ink"}`}><span className="sm:hidden">Coba gratis</span><span className="hidden sm:inline">Free Trial Class</span></button>
          </div>
        </div>
      </header>

      <main className="relative">
        <article>
        {/* kepala artikel: foto penuh dengan judul di atasnya, sama di HP dan layar lebar */}
        <div className="print-hero relative flex min-h-[78svh] items-end md:min-h-[min(78vh,43rem)]">
          <div className="hero-media absolute inset-0">
            <Image src={doc.cover} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1140]/92 via-[#14206B]/45 to-[#405FDA]/15" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0A1140]/60 to-transparent" />
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className={`relative mx-auto w-full px-5 pt-28 pb-14 text-white ${kids ? "max-w-3xl text-center" : "max-w-6xl"}`}>
            <span className={`inline-block ${kids ? "-rotate-2 rounded-full bg-sun px-4 py-1 font-display text-base tracking-wide text-ink shadow-[0_3px_0_0_var(--color-sun-600)]" : "rounded-full bg-white px-3.5 py-1 text-xs font-bold tracking-wide text-cobalt"}`}>{doc.category}</span>
            <h1 className={kids ? "mt-4 font-display text-[2.5rem] leading-[1.04] text-balance [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] md:text-[4rem]" : "mt-4 max-w-4xl text-[2.3rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] md:text-[3.8rem]"}>{doc.title}</h1>
            <p className={`mt-3 text-[1.05rem] text-white/85 md:mt-4 md:text-lg ${kids ? "mx-auto max-w-xl" : "max-w-2xl"}`}>{doc.deck}</p>
            <div className={`mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-white/80 md:mt-6 ${kids ? "justify-center" : ""}`}>
              <span className="flex items-center gap-2.5 text-left">
                <span className="grid size-9 place-items-center rounded-full bg-white/95 text-sm font-extrabold text-cobalt-900">{doc.author.name[0]}</span>
                <span className="leading-tight"><b className="block text-white">{doc.author.name}</b>{doc.author.role}</span>
              </span>
              <span aria-hidden>·</span>
              <time dateTime={doc.date}>{fmtDate(doc.date)}</time>
              <span aria-hidden>·</span>
              <span>{doc.readMin} menit baca</span>
            </div>
            <a href="#isi" className="no-print mt-7 inline-flex flex-col items-center gap-1 text-sm font-semibold text-white/90 hover:text-white">
              Baca ceritanya
              <motion.span aria-hidden animate={reduce ? undefined : { y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>↓</motion.span>
            </a>
            {doc.coverCaption && <p className="mt-3 text-xs text-white/60">{doc.coverCaption}</p>}
          </motion.div>
        </div>

        {/* isi */}
        <div id="isi" className="relative -mt-6 scroll-mt-0 rounded-t-[2rem]" style={{ background: SECTION_BG[doc.audience] }}>
        <div className={`mx-auto px-5 pb-20 ${kids ? "max-w-2xl" : "grid max-w-6xl gap-12 lg:grid-cols-[13rem_minmax(0,42rem)] lg:justify-center"}`}>
          {!kids && (
            <aside className="hidden lg:block">
              <nav aria-label="Isi artikel" className="sticky top-24 mt-12">
                <p className="text-xs font-bold tracking-[0.18em] text-cobalt uppercase">Isi artikel</p>
                <ul className="mt-4 space-y-1 border-l border-cobalt-900/10">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-snug transition ${active === t.id ? "border-cobalt font-bold text-cobalt-900" : "border-transparent text-ink/55 hover:text-ink"}`}>{t.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          <div ref={bodyRef} style={{ ["--ts" as string]: [1, 1.12, 1.26][fs] }}>
            {/* ringkasan */}
            <div className={`mt-10 p-6 ${kids ? "rounded-[2rem] bg-white shadow-[0_8px_0_0_var(--color-mist)]" : "rounded-2xl bg-white ring-1 ring-cobalt-900/10"}`}>
              <p className={`text-xs font-bold tracking-[0.18em] uppercase ${kids ? "text-sky" : "text-cobalt"}`}>{kids ? "Yang akan kamu dapat" : "Kilas 30 detik"}</p>
              <ul className="mt-3 space-y-2">
                {doc.takeaways.map((t, k) => (
                  <li key={k} className="flex gap-3 text-[1.02rem] leading-relaxed text-ink/85">
                    <span aria-hidden className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${kids ? "bg-sun text-ink" : "bg-cobalt text-white"}`}>✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <Blocks blocks={doc.blocks} kids={kids} />

            <p className="mt-10 text-sm text-ink/50">
              {doc.sample && "Artikel contoh untuk melihat tata letak. "}
              Ditulis oleh {doc.author.name}. Konten ini bersifat umum dan tidak menggantikan arahan pengajar.
            </p>
            {pageUrl && <p className="mt-2 hidden text-sm text-ink/60 print:block">Sumber: {pageUrl}</p>}
          </div>
        </div>
        </div>

        </article>

        {/* baca berikutnya */}
        {related.length > 0 && (
          <section className="no-print border-t border-cobalt-900/10 bg-white/50 py-14">
            <div className="mx-auto max-w-6xl px-5">
              <h2 className={kids ? "font-display text-3xl text-cobalt-900" : "text-2xl font-semibold tracking-[-0.02em] text-cobalt-900"}>{kids ? "Baca yang lain, yuk!" : "Lanjut membaca"}</h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-3">
                {related.map((r, i) => (
                  <li key={i}>
                    <Link href={r.href} className="group block">
                      <div className={`relative aspect-[4/3] overflow-hidden bg-mist ${kids ? "rounded-3xl border-4 border-white shadow-[0_6px_0_0_var(--color-mist)]" : "rounded-xl"}`}>
                        <Image src={r.cover} alt="" fill sizes="360px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <p className={`mt-3 text-xs font-bold tracking-wider uppercase ${kids ? "text-sky" : "text-cobalt"}`}>{r.category}</p>
                      <p className={`mt-1 ${kids ? "font-display text-xl text-cobalt-900" : "text-lg leading-snug font-semibold text-cobalt-900"}`}>{r.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
