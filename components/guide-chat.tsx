"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, PROGRAMS, consultHref, type Audience, type Program } from "@/lib/content";
import { useAudience } from "./audience-provider";
import { useTrial } from "./trial-modal";

/**
 * "Asisten kelas": ikon chat yang menempel di pojok kanan bawah sepanjang halaman.
 * Dibuka → beberapa pertanyaan pilihan (tanpa ketik), lalu rekomendasi program.
 * Setelah ada hasil: mode (Anak/Dewasa) ikut menyesuaikan, halaman bergulir ke section Program,
 * dan kartu program yang cocok disorot. Dari situ bisa langsung daftar free trial / cek level / tanya admin.
 *
 * Logikanya pohon keputusan sederhana (lihat STEPS & RESULTS), bukan AI, jadi jawabannya selalu konsisten.
 * Gaya bahasa mengikuti panduan English Now: kalimat pendek, "Bapak/Ibu" untuk orang tua, "Kak" untuk dewasa.
 */

type ResultId = "kids" | "teens" | "private-kids" | "exam" | "private" | "business";
type Option = { label: string; next?: StepId; result?: ResultId };
type StepId = "who" | "kidsGoal" | "teenGoal" | "adultGoal";

const STEPS: Record<StepId, { bot: string[]; options: Option[] }> = {
  who: {
    bot: ["Halo! Saya bantu carikan kelas yang pas.", "Kelasnya untuk siapa?"],
    options: [
      { label: "Anak (6–12 tahun)", next: "kidsGoal" },
      { label: "Remaja (12–19 tahun)", next: "teenGoal" },
      { label: "Saya sendiri", next: "adultGoal" },
      { label: "Tim / perusahaan", result: "business" },
    ],
  },
  kidsGoal: {
    bot: ["Baik, Bapak/Ibu.", "Apa yang paling diharapkan untuk si kecil?"],
    options: [
      { label: "Belajar rutin bersama teman", result: "kids" },
      { label: "Lebih fokus, satu guru satu siswa", result: "private-kids" },
    ],
  },
  teenGoal: {
    bot: ["Baik, Bapak/Ibu.", "Apa tujuan utamanya?"],
    options: [
      { label: "Belajar rutin & naik level", result: "teens" },
      { label: "Persiapan ujian (Cambridge, IELTS, TOEFL)", result: "exam" },
      { label: "Lebih fokus, satu guru satu siswa", result: "private-kids" },
    ],
  },
  adultGoal: {
    bot: ["Siap, Kak.", "Bahasa Inggrisnya untuk apa?"],
    options: [
      { label: "Pekerjaan & karier", result: "private" },
      { label: "Kuliah atau kerja ke luar negeri (IELTS/TOEFL)", result: "exam" },
      { label: "Lebih percaya diri berbicara", result: "private" },
    ],
  },
};

const RESULTS: Record<ResultId, { program: Program["id"]; audience: Audience; why: string[] }> = {
  kids: {
    program: "kids",
    audience: "kids",
    why: ["Kelas kecil 8–15 siswa, jadi anak belajar bersama teman sebaya.", "Levelnya mengikuti jenjang Cambridge, mulai dari Starters."],
  },
  teens: {
    program: "teens",
    audience: "kids",
    why: ["Kelas untuk SMP–SMA dengan progres sesuai standar Cambridge.", "Ada sesi bersama native speaker setiap semester."],
  },
  "private-kids": {
    program: "private",
    audience: "kids",
    why: ["Satu guru untuk satu siswa, jadi materi bisa mengikuti kebutuhan anak.", "Bisa tatap muka atau online."],
  },
  exam: {
    program: "exam",
    audience: "adult",
    why: ["Fokus pada strategi tiap bagian tes.", "Diawali pre-test gratis, ditutup mock test."],
  },
  private: {
    program: "private",
    audience: "adult",
    why: ["Materi disusun sesuai tujuan Kakak, misalnya rapat, email, atau presentasi.", "Jadwal fleksibel, tatap muka atau online."],
  },
  business: {
    program: "business",
    audience: "adult",
    why: ["Kurikulum disusun sesuai kebutuhan tim.", "Jadwal mengikuti perusahaan, pengajar bisa datang ke kantor."],
  },
};

type Msg = { from: "bot" | "me"; text: string; key: number };

/* tampil setelah melewati hero (sama seperti navbar) */
function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}
const getPast = () => window.scrollY > window.innerHeight * 0.6;

export function GuideChat() {
  const { audience, setAudience } = useAudience();
  const { open: openTrial } = useTrial();
  const reduce = useReducedMotion() ?? false;
  const past = useSyncExternalStore(subscribeScroll, getPast, () => false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<StepId | null>(null);
  const [result, setResult] = useState<ResultId | null>(null);
  const [typing, setTyping] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);
  const keyRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const kids = audience === "kids";

  // ajakan kecil "Bingung pilih kelas?" muncul sekali setelah melewati hero
  useEffect(() => {
    if (!past || open) return;
    const t = window.setTimeout(() => setNudge(true), 1200);
    const h = window.setTimeout(() => setNudge(false), 8000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(h);
    };
  }, [past, open]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // HP: dok bawah disembunyikan saat tiket trial class / footer terlihat (tombolnya sudah ada di sana)
  useEffect(() => {
    const els = [document.getElementById("coba-gratis"), document.querySelector("footer")].filter(Boolean) as Element[];
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      setNearEnd(seen.size > 0);
    });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [msgs, typing, result, reduce]);

  const botSay = (lines: string[], then?: () => void) => {
    setTyping(true);
    lines.forEach((text, i) => {
      timers.current.push(
        window.setTimeout(
          () => {
            setMsgs((m) => [...m, { from: "bot", text, key: keyRef.current++ }]);
            if (i === lines.length - 1) {
              setTyping(false);
              then?.();
            }
          },
          reduce ? 0 : 450 + i * 650,
        ),
      );
    });
  };

  const start = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    setMsgs([]);
    setResult(null);
    setStep(null);
    botSay(STEPS.who.bot, () => setStep("who"));
  };

  const toggle = () => {
    setNudge(false);
    if (!open && msgs.length === 0) start();
    setOpen(!open);
  };

  // bisa dibuka dari mana saja: window.dispatchEvent(new Event("en:chat-open"))
  const openRef = useRef<() => void>(() => {});
  useEffect(() => {
    openRef.current = () => {
      setNudge(false);
      if (msgs.length === 0) start();
      setOpen(true);
    };
  });
  useEffect(() => {
    const on = () => openRef.current();
    window.addEventListener("en:chat-open", on);
    return () => window.removeEventListener("en:chat-open", on);
  }, []);

  const choose = (o: Option) => {
    setStep(null);
    setMsgs((m) => [...m, { from: "me", text: o.label, key: keyRef.current++ }]);
    if (o.next) {
      const next = o.next;
      botSay(STEPS[next].bot, () => setStep(next));
      return;
    }
    if (o.result) {
      const r = RESULTS[o.result];
      const p = PROGRAMS[r.program];
      const id = o.result;
      botSay([`Rekomendasi kami: ${p.name}.`, ...r.why], () => {
        setResult(id);
        // sesuaikan mode, lalu bawa ke kartu programnya
        const switching = audience !== r.audience;
        if (switching) setAudience(r.audience);
        timers.current.push(
          window.setTimeout(() => {
            const card = document.getElementById(`program-${r.program}`) ?? document.getElementById("biaya");
            card?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
            window.setTimeout(() => window.dispatchEvent(new CustomEvent("en:program", { detail: r.program })), reduce ? 0 : 700);
          }, switching ? 1000 : 300),
        );
      });
    }
  };

  const res = result ? RESULTS[result] : null;
  const prog = res ? PROGRAMS[res.program] : null;
  const accent = kids ? "bg-cobalt text-white" : "bg-cobalt-900 text-white";

  return (
    <>
    <div className="pointer-events-none fixed right-3 bottom-[5.25rem] left-3 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6 sm:left-auto">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Asisten pilih kelas"
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{ originX: 1, originY: 1 }}
            className={`pointer-events-auto flex h-[min(34rem,calc(100svh-8rem))] w-full flex-col overflow-hidden sm:w-[23rem] ${
              kids
                ? "rounded-[1.75rem] border-2 border-mist bg-[#F2F9EA] shadow-[0_8px_0_0_var(--color-mist),0_30px_60px_-20px_rgba(30,47,120,0.45)]"
                : "rounded-3xl bg-[#FBF6EE] shadow-[0_30px_80px_-20px_rgba(20,22,42,0.5)] ring-1 ring-ink/10"
            }`}
          >
            {/* kepala */}
            <div className={`flex items-center gap-3 px-4 py-3 ${kids ? "bg-cobalt text-white" : "bg-cobalt-900 text-white"}`}>
              <Avatar kids={kids} />
              <div className="flex-1">
                <p className={kids ? "font-display text-lg leading-tight" : "font-semibold leading-tight"}>Asisten English Now</p>
                <p className="text-xs text-white/70">Bantu pilih kelas dalam 1 menit</p>
              </div>
              <button type="button" onClick={start} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white/80 hover:bg-white/15" aria-label="Mulai ulang">
                ↺
              </button>
              <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-white/15" aria-label="Tutup">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* percakapan */}
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite">
              {msgs.map((m) => (
                <motion.div
                  key={m.key}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
                      m.from === "me" ? `${accent} rounded-br-md` : "rounded-bl-md bg-white text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-ink/5"
                    }`}
                  >
                    {m.text}
                  </p>
                </motion.div>
              ))}
              {typing && (
                <div className="flex">
                  <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 ring-1 ring-ink/5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-ink/40"
                        animate={reduce ? undefined : { y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </span>
                </div>
              )}

              {/* kartu rekomendasi */}
              {prog && res && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 overflow-hidden rounded-2xl ${kids ? "bg-white ring-2 ring-sun" : "bg-white ring-1 ring-ink/10"}`}
                >
                  <div className="px-4 pt-3.5 pb-3">
                    <p className="text-[11px] font-semibold tracking-wider text-ink/50 uppercase">{prog.who}</p>
                    <p className={kids ? "mt-0.5 font-display text-xl text-cobalt-900" : "mt-0.5 text-lg font-semibold text-cobalt-900"}>{prog.name}</p>
                    <p className="text-sm text-ink/60">
                      Mulai dari <span className="font-semibold text-cobalt-900">{prog.price}</span> · {prog.unit}
                    </p>
                  </div>
                  <div className="space-y-2 border-t border-ink/5 bg-ink/[0.02] p-3">
                    <button
                      type="button"
                      onClick={openTrial}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${kids ? "bg-sun text-cobalt-900 hover:brightness-105" : "bg-cobalt-900 text-white hover:bg-cobalt-700"}`}
                    >
                      Daftar free trial class
                    </button>
                    <div className="flex gap-2">
                      <a
                        href={res.audience === "kids" ? CTA.level.kids : CTA.level.adult}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xs font-semibold text-cobalt-900 ring-1 ring-ink/10 hover:ring-cobalt/40"
                      >
                        Cek level dulu
                      </a>
                      <a
                        href={consultHref(prog.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xs font-semibold text-cobalt-900 ring-1 ring-ink/10 hover:ring-cobalt/40"
                      >
                        Tanya admin
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* pilihan jawaban */}
            <div className="border-t border-ink/5 bg-white/60 px-3 py-3">
              {step ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {STEPS[step].options.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => choose(o)}
                      className={`rounded-full px-3.5 py-2 text-left text-[13px] font-semibold transition ${
                        kids ? "bg-white text-cobalt ring-2 ring-cobalt/25 hover:bg-cobalt hover:text-white" : "bg-white text-cobalt-900 ring-1 ring-cobalt-900/20 hover:bg-cobalt-900 hover:text-white"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              ) : result ? (
                <button type="button" onClick={start} className="w-full text-center text-xs font-semibold text-ink/50 hover:text-cobalt">
                  ↺ Ulangi pertanyaan
                </button>
              ) : (
                <p className="text-center text-xs text-ink/40">…</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* desktop: ikon di pojok kanan bawah */}
      <div className="pointer-events-auto relative hidden items-center gap-2 sm:flex">
        <AnimatePresence>
          {nudge && !open && (
            <motion.button
              type="button"
              onClick={toggle}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={`rounded-full px-4 py-2 text-sm font-semibold shadow-[0_10px_30px_-10px_rgba(30,47,120,0.45)] ${kids ? "bg-white text-cobalt-900 ring-2 ring-mist" : "bg-white text-cobalt-900 ring-1 ring-ink/10"}`}
            >
              Bingung pilih kelas?
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Tutup asisten" : "Buka asisten pilih kelas"}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.95 }}
          className={`grid size-14 place-items-center rounded-full shadow-[0_14px_30px_-10px_rgba(30,47,120,0.6)] ${
            kids ? "bg-cobalt shadow-[0_5px_0_0_var(--color-cobalt-900),0_14px_30px_-10px_rgba(30,47,120,0.6)]" : "bg-cobalt-900"
          }`}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          ) : (
            <Avatar kids={kids} plain />
          )}
        </motion.button>
      </div>
    </div>

    {/* HP: dok bawah = asisten + Free Trial Class dalam satu baris.
        Muncul setelah hero, hilang saat tiket trial class / footer terlihat. */}
    <AnimatePresence>
      {((past && !nearEnd) || open) && (
        <motion.div
          initial={reduce ? false : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className={`fixed inset-x-3 bottom-3 z-[60] flex items-center gap-2 rounded-full p-1.5 sm:hidden ${
            kids ? "bg-white/90 shadow-[0_6px_0_0_var(--color-mist),0_14px_40px_-12px_rgba(30,47,120,0.45)] ring-2 ring-mist backdrop-blur-xl" : "bg-white/85 shadow-[0_14px_40px_-12px_rgba(20,22,42,0.45)] ring-1 ring-ink/10 backdrop-blur-xl"
          }`}
        >
          <div className="relative">
            <AnimatePresence>
              {nudge && !open && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="pointer-events-none absolute bottom-full left-0 mb-3 rounded-2xl rounded-bl-md bg-cobalt-900 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg"
                >
                  Bingung pilih kelas?
                </motion.span>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label={open ? "Tutup asisten" : "Buka asisten pilih kelas"}
              className={`grid size-12 place-items-center rounded-full ${kids ? "bg-cobalt" : "bg-cobalt-900"}`}
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-white" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              ) : (
                <Avatar kids={kids} plain />
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openTrial();
            }}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold ${
              kids ? "bg-sun font-display tracking-wide text-cobalt-900" : "bg-cobalt-900 text-white"
            }`}
          >
            {CTA.trial.label}
            <span aria-hidden>→</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

/** avatar asisten: kepala kucing oranye (Anak) atau gelembung chat (Dewasa) */
function Avatar({ kids, plain = false }: { kids: boolean; plain?: boolean }) {
  if (!kids) {
    return (
      <span className={`grid size-10 place-items-center rounded-full ${plain ? "" : "bg-white/10"}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4C77B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.8" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`grid size-10 place-items-center rounded-full ${plain ? "" : "bg-white"}`}>
      <svg viewBox="0 0 120 90" className="w-8" aria-hidden>
        <path d="M24 44 L30 12 L50 32 Z" fill="#F2A65A" />
        <path d="M96 44 L90 12 L70 32 Z" fill="#F2A65A" />
        <path d="M30 38 L33 22 L43 32 Z M90 38 L87 22 L77 32 Z" fill="#FFB3C1" />
        <ellipse cx="60" cy="54" rx="40" ry="30" fill="#F2A65A" />
        <path d="M52 26 Q 54 36 50 42 M60 24 V 40 M68 26 Q 66 36 70 42" stroke="#D9833A" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <ellipse cx="60" cy="66" rx="17" ry="12" fill="#FFF3E2" />
        <ellipse cx="45" cy="54" rx="4" ry="5" fill="#2B1D12" />
        <ellipse cx="75" cy="54" rx="4" ry="5" fill="#2B1D12" />
        <path d="M57 62 L63 62 L60 65.5 Z" fill="#E77A8A" />
      </svg>
    </span>
  );
}
