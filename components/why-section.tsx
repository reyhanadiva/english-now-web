"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ADULT_PHOTOS, CERTS, whyAdult, whyKids, type Reason } from "@/lib/content";
import { SECTION_BG } from "@/lib/theme";
import { useAudience } from "./audience-provider";
import { ChatBubbles } from "./chat-bubbles";
import { SafeImage } from "./ui/safe-image";

/**
 * Section 2: Kenapa English Now.
 * Anak: kiri menempel (judul + tumpukan foto polaroid + jendela obrolan), kanan tiga alasan.
 * Dewasa: kiri jalur program + tiga alasan, kanan panel menempel yang berganti mengikuti alasan aktif.
 * Alasan yang sedang dibaca menyala, sisanya meredup (desktop).
 */
export function WhySection() {
  const { audience, instant } = useAudience();
  const reduce = (useReducedMotion() ?? false) || instant;
  const kids = audience === "kids";
  const c = kids ? whyKids : whyAdult;
  const [active, setActive] = useState(0);

  const reasons = (
    <ol>
      {c.reasons.map((r, i) => (
        <motion.li
          key={r.id}
          onViewportEnter={() => setActive(i)}
          viewport={{ margin: "-45% 0px -45% 0px" }}
          className={`border-t py-9 first:border-t-0 transition-opacity duration-500 relative lg:flex lg:min-h-[38vh] lg:flex-col lg:justify-center lg:py-10 ${
            kids ? "border-cobalt-900/10" : "border-ink/10"
          } ${active === i ? "" : "lg:opacity-35"}`}
        >
          {/* angka besar samar di belakang, mengisi ruang kosong */}
          <span
            aria-hidden
            className={`pointer-events-none absolute top-1/2 right-0 -z-0 hidden -translate-y-1/2 leading-none select-none lg:block ${
              kids ? "font-display text-[11rem] text-cobalt/[0.06]" : "text-[10rem] font-semibold tracking-tighter text-cobalt-900/[0.05]"
            }`}
          >
            {kids ? i + 1 : String(i + 1).padStart(2, "0")}
          </span>
          <div className="relative">
            <ReasonText r={r} i={i} kids={kids} />
          </div>
          {!kids && (
            <div className="mt-6 lg:hidden">
              <AdultPanel id={r.id} reduce={reduce} />
            </div>
          )}
        </motion.li>
      ))}
    </ol>
  );

  const title = (
    <>
      <h2
        className={
          kids
            ? "font-display text-4xl leading-[1.05] text-balance text-cobalt-900 sm:text-[3.25rem]"
            : "text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-cobalt-900 sm:text-5xl"
        }
      >
        {c.title}
      </h2>
      <p className="mt-4 max-w-md text-base text-ink/70">{c.sub}</p>
    </>
  );

  return (
    <section
      id="kenapa"
      // overflow-x-clip (bukan overflow-hidden) supaya bagian "sticky" tetap bisa menempel
      className="relative overflow-x-clip"
      style={{
        background: kids
          ? SECTION_BG.kids
          : `radial-gradient(60rem 30rem at 90% 0%, rgba(244,180,143,0.22), transparent 60%), ${SECTION_BG.adult}`,
      }}
    >
      {/* pendar warna lembut supaya latar tidak terasa kosong */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: kids
            ? "radial-gradient(38rem 28rem at 8% 30%, rgba(7,169,248,0.10), transparent 70%), radial-gradient(34rem 26rem at 95% 70%, rgba(255,242,117,0.35), transparent 70%)"
            : "radial-gradient(40rem 30rem at 5% 60%, rgba(64,95,218,0.08), transparent 70%)",
        }}
      />
      {kids && <KidsDoodles />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="relative mx-auto max-w-6xl px-5 pt-10 pb-20 sm:pt-14 sm:pb-24"
        >
          {kids ? (
            /* ANAK: kiri menempel (judul + tumpukan foto + jendela obrolan), kanan alasan */
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="self-start lg:sticky lg:top-28">
                {title}
                <div className="mt-10">
                  <KidsStage reasons={whyKids.reasons} active={active} reduce={reduce} />
                </div>
              </div>
              <div className="lg:pt-10">{reasons}</div>
            </div>
          ) : (
            /* DEWASA: kiri alasan, kanan panel menempel yang berganti */
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                {title}
                <ul className="mt-6 flex flex-wrap gap-2">
                  {whyAdult.paths.map((p) => (
                    <li key={p.name} className="rounded-2xl bg-white px-4 py-2.5 ring-1 ring-ink/10">
                      <p className="text-sm font-semibold text-cobalt-900">{p.name}</p>
                      <p className="text-xs text-ink/55">{p.note}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">{reasons}</div>
              </div>
              <div className="hidden lg:block">
                <div className="sticky top-28 pt-16">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={c.reasons[active].id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <AdultPanel id={c.reasons[active].id} reduce={reduce} large />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* angka */}
          <dl className={`mt-16 grid grid-cols-2 divide-x border-t pt-10 ${kids ? "divide-cobalt-900/10 border-cobalt-900/10" : "divide-ink/10 border-ink/10"}`}>
            {c.stats.map((s) => (
              <div key={s.label} className="px-3 text-center sm:px-6">
                <dd
                  className={
                    kids
                      ? "font-display text-[2.2rem] whitespace-nowrap text-cobalt sm:text-6xl"
                      : "text-[2.2rem] font-semibold whitespace-nowrap tracking-tight text-cobalt-900 sm:text-6xl"
                  }
                >
                  {s.value}
                </dd>
                <dt className="mx-auto mt-1 max-w-[16rem] text-xs text-ink/60 sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const KIDS_BADGE = [
  "bg-sun text-cobalt-900 shadow-[0_4px_0_0_var(--color-sun-600)]",
  "bg-sky text-white shadow-[0_4px_0_0_#0587c7]",
  "bg-cobalt text-white shadow-[0_4px_0_0_var(--color-cobalt-900)]",
];
const KIDS_CHIP = ["bg-sun text-cobalt-900", "bg-sky text-white", "bg-cobalt text-white"];

function ReasonText({ r, i, kids }: { r: Reason; i: number; kids: boolean }) {
  if (kids) {
    return (
      <div>
        <span className={`grid size-12 place-items-center rounded-2xl font-display text-2xl ${KIDS_BADGE[i]}`}>{i + 1}</span>
        <h3 className="mt-5 font-display text-[1.75rem] leading-tight text-cobalt-900 sm:text-[2rem]">{r.title}</h3>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink/70">{r.body}</p>
        {r.chips && (
          <div className="mt-4 flex flex-wrap gap-2">
            {r.chips.map((chip, k) => (
              <span
                key={chip}
                className={`rounded-full border-2 border-white px-3 py-1 font-display text-sm tracking-wide shadow-[0_3px_0_0_rgba(0,0,0,0.08)] ${KIDS_CHIP[k % 3]}`}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-5">
      <span className="text-sm font-semibold tracking-[0.2em] text-cobalt tabular-nums">{String(i + 1).padStart(2, "0")}</span>
      <div>
        <h3 className="text-2xl font-semibold tracking-[-0.02em] text-cobalt-900 sm:text-[1.9rem]">{r.title}</h3>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink/70">{r.body}</p>
      </div>
    </div>
  );
}

/* ---------- Anak ---------- */

/** tumpukan foto kelas ala polaroid (tanpa caption); foto berganti posisi mengikuti alasan aktif */
function KidsStage({ reasons, active, reduce }: { reasons: Reason[]; active: number; reduce: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[26rem] pb-28 sm:pb-24">
      <div className="relative aspect-[1/0.86] w-[88%]">
        {reasons.map((r, j) => {
          const rel = (j - active + reasons.length) % reasons.length; // 0 = depan
          const pose = [
            { rotate: -3, x: 0, y: 0, scale: 1 },
            { rotate: 6, x: 28, y: -12, scale: 0.93 },
            { rotate: -8, x: -22, y: -18, scale: 0.87 },
          ][rel];
          return (
            <motion.div
              key={r.id}
              initial={false}
              animate={pose}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 22 }}
              style={{ zIndex: 3 - rel }}
              className="absolute inset-0 rounded-[1.5rem] bg-white p-2.5 pb-8 shadow-[0_20px_40px_-20px_rgba(30,47,120,0.5)]"
            >
              <div className="relative h-full overflow-hidden rounded-[1.1rem]">
                {r.photo && <Image src={r.photo} alt="" fill sizes="420px" className="object-cover" />}
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* jendela obrolan: info tambahan, menempel di pojok kanan bawah tumpukan foto */}
      <div className="absolute right-0 bottom-0 z-10 w-[17.5rem] sm:w-72">
        <ChatWindow kids title={whyKids.chatTitle} lines={whyKids.chat} />
      </div>
    </div>
  );
}

/** hiasan tipis di latar: awan & bunga kecil */
function KidsDoodles() {
  const flower = (fill: string, center: string) => (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="10" cy="5" rx="3" ry="4.5" fill={fill} transform={`rotate(${a} 10 10)`} />
      ))}
      <circle cx="10" cy="10" r="3" fill={center} />
    </>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg className="absolute top-16 right-[6%] w-28 opacity-80" viewBox="0 0 120 50">
        <path d="M15 40 a14 14 0 0 1 10-22 a18 18 0 0 1 33-6 a16 16 0 0 1 30 4 a12 12 0 0 1 17 24 z" fill="#fff" />
      </svg>
      <svg className="absolute top-[45%] left-[2%] w-20 opacity-70" viewBox="0 0 120 50">
        <path d="M15 40 a14 14 0 0 1 10-22 a18 18 0 0 1 33-6 a16 16 0 0 1 30 4 a12 12 0 0 1 17 24 z" fill="#fff" />
      </svg>
      <svg className="absolute bottom-40 left-[6%] w-6" viewBox="0 0 20 20">{flower("#fff", "#FFD23F")}</svg>
      <svg className="absolute right-[4%] bottom-64 w-7" viewBox="0 0 20 20">{flower("#FFF275", "#F0A12E")}</svg>
      <svg className="absolute bottom-16 left-[52%] w-5" viewBox="0 0 20 20">{flower("#fff", "#F6A5C0")}</svg>
    </div>
  );
}

/* ---------- Dewasa ---------- */

function AdultPanel({ id, reduce, large = false }: { id: Reason["id"]; reduce: boolean; large?: boolean }) {
  const shell = `rounded-3xl bg-white ring-1 ring-ink/10 shadow-[0_24px_60px_-36px_rgba(54,54,54,0.4)] ${large ? "p-8" : "p-5"}`;

  if (id === "tailored") {
    const steps = [
      ["Diskusi kebutuhan", "Tujuan tim atau pribadi, target, dan konteks kerja."],
      ["Free trial class", "Rasakan langsung cara belajarnya sebelum memutuskan."],
      ["Kurikulum disusun", "Materi khusus: rapat, email, presentasi, atau IELTS."],
      ["Kelas dimulai", "Progres dipantau dan materi bisa disesuaikan."],
    ];
    return (
      <div className={shell}>
        {large && (
          <div className="relative -mx-2 -mt-2 mb-6 aspect-[16/6] overflow-hidden rounded-2xl">
            <SafeImage src={ADULT_PHOTOS.meeting} alt="" fill sizes="520px" className="object-cover" />
          </div>
        )}
        <p className="text-xs font-semibold tracking-[0.16em] text-ink/45 uppercase">Rencana belajar</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-cobalt-900">Disusun bersama Anda</p>
        <ol className="mt-6 space-y-3">
          {steps.map(([t, d], i) => (
            <motion.li
              key={t}
              initial={reduce ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduce ? 0 : 0.1 + i * 0.12, duration: 0.35 }}
              className="flex gap-4 rounded-2xl p-3.5 ring-1 ring-ink/5"
              style={{ background: "#FBF6EE" }}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cobalt-900 text-sm font-semibold text-white">{i + 1}</span>
              <span>
                <span className="block text-[15px] font-semibold text-cobalt-900">{t}</span>
                <span className="block text-sm text-ink/60">{d}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    );
  }

  if (id === "flexible") {
    const tiles = [
      ["Business class", "Jadwal mengikuti perusahaan", "bg-cobalt-900 text-white"],
      ["Kelas privat", "Tatap muka atau online", "bg-sun text-cobalt-900"],
      ["Persiapan IELTS", "Untuk kerja & studi ke luar negeri", "bg-sky text-white"],
    ];
    return (
      <div className={shell}>
        <p className="text-xs font-semibold tracking-[0.16em] text-ink/45 uppercase">Pilih format</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-cobalt-900">Yang paling cocok dengan jadwal Anda</p>
        <div className="mt-6 grid gap-3">
          {tiles.map(([t, d, tone], i) => (
            <motion.div
              key={t}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.1 + i * 0.12, duration: 0.35 }}
              className={`flex items-center justify-between rounded-2xl px-5 py-4 ${tone}`}
            >
              <span className="text-base font-semibold">{t}</span>
              <span className="text-sm opacity-80">{d}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // pengajar bersertifikat & native speaker: foto kelas + jendela obrolan
  return (
    <div className={`${shell} relative`}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
        <SafeImage src={ADULT_PHOTOS.teacher} alt="" fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
      </div>
      <div className={`relative z-10 ${large ? "-mt-24 ml-auto w-[82%]" : "-mt-16 ml-auto w-[92%]"}`}>
        <ChatWindow kids={false} title={whyAdult.chatTitle} lines={whyAdult.chat} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {CERTS.map((c) => (
          <span key={c.code} title={c.name} className="rounded-full bg-cobalt-900 px-3.5 py-1.5 text-sm font-semibold text-white">
            {c.code}
          </span>
        ))}
        <span className="rounded-full bg-sun px-3.5 py-1.5 text-sm font-semibold text-cobalt-900">Native speaker</span>
      </div>
    </div>
  );
}

/* ---------- jendela obrolan ---------- */

function ChatWindow({ kids, title, lines }: { kids: boolean; title: string; lines: [string, string, string] }) {
  return (
    <div
      className={`overflow-hidden ${
        kids
          ? "rounded-3xl border-2 border-mist bg-white shadow-[0_5px_0_0_var(--color-mist)]"
          : "rounded-2xl bg-white shadow-[0_18px_40px_-24px_rgba(54,54,54,0.35)] ring-1 ring-ink/10"
      }`}
    >
      <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${kids ? "border-mist" : "border-ink/10"}`}>
        <span className="flex gap-1" aria-hidden>
          <span className="size-2 rounded-full bg-[#F28B82]" />
          <span className="size-2 rounded-full bg-sun-600" />
          <span className="size-2 rounded-full bg-[#7FD18B]" />
        </span>
        <span className="ml-1 text-xs font-semibold text-ink/55">{title}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-ink/45">
          <span className="size-1.5 animate-pulse rounded-full bg-[#4CC26B]" /> live
        </span>
      </div>
      <div className={`px-4 py-4 ${kids ? "bg-sky/10" : "bg-[#F6F1E8]"}`}>
        <ChatBubbles lines={lines} theme={kids ? "kids" : "adult"} className="min-h-[8.5rem]" />
      </div>
    </div>
  );
}
