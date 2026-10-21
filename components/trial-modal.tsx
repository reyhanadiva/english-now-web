"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CTA, HI, wa } from "@/lib/content";
import { useAudience } from "./audience-provider";
import { Button } from "./ui/button";

/**
 * Pop-up formulir "Daftar Free Trial" (mengikuti website lama).
 * Semua tombol Free Trial Class membuka pop-up ini lewat useTrial().open().
 *
 * Saat dikirim: data disusun jadi pesan WhatsApp ke admin, lalu WhatsApp dibuka.
 * TODO: kalau website lama mengirim formulir ini ke sistem tertentu (Google Form/Sheet, CRM, email),
 * ganti isi `submit` dengan kiriman ke sistem tersebut.
 */

const TrialCtx = createContext<{ open: () => void }>({ open: () => {} });
export const useTrial = () => useContext(TrialCtx);

/** tombol Free Trial Class yang membuka pop-up */
export function TrialButton(props: Omit<React.ComponentProps<typeof Button>, "href" | "onClick">) {
  const { open } = useTrial();
  return <Button {...props} onClick={open} />;
}

type Field = { name: string; label: string; type?: "tel" | "text"; optional?: boolean; area?: boolean; auto?: string };

const FIELDS: Record<"kids" | "adult", Field[]> = {
  kids: [
    { name: "nama", label: "Nama lengkap calon siswa", auto: "off" },
    { name: "wa", label: "Nomor WhatsApp orang tua", type: "tel", auto: "tel" },
    { name: "kelas", label: "Kelas siswa / usia saat ini" },
    { name: "cerita", label: "Program/kelas yang ingin diikuti", optional: true, area: true },
  ],
  adult: [
    { name: "nama", label: "Nama lengkap", auto: "name" },
    { name: "wa", label: "Nomor WhatsApp aktif", type: "tel", auto: "tel" },
    { name: "kelas", label: "Pekerjaan / instansi" },
    { name: "cerita", label: "Program yang diminati atau kebutuhan Anda", optional: true, area: true },
  ],
};

export function TrialProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  return (
    <TrialCtx.Provider value={{ open }}>
      {children}
      <TrialModal open={isOpen} onClose={() => setOpen(false)} />
    </TrialCtx.Provider>
  );
}

function TrialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { audience } = useAudience();
  const kids = audience === "kids";
  const reduce = useReducedMotion() ?? false;
  const fields = FIELDS[audience];
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();

  // Esc menutup, halaman di belakang tidak ikut ter-scroll, fokus ke isian pertama
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const close = () => {
    onClose();
    window.setTimeout(() => {
      setSent(false);
      setError("");
    }, 300);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const phone = get("wa").replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 9) {
      setError("Nomor WhatsApp sepertinya belum lengkap.");
      return;
    }
    const lines = fields
      .filter((f) => get(f.name))
      .map((f) => `${f.label.replace(/ yang dapat dihubungi$/, "")}: ${get(f.name)}`);
    const msg = `${HI} saya ingin mendaftar free trial class${kids ? "" : " (kelas dewasa/bisnis)"}.\n\n${lines.join("\n")}`;
    window.open(wa(msg), "_blank", "noopener,noreferrer");
    setSent(true);
  };

  const input = kids
    ? "w-full rounded-2xl border-2 border-mist bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-ink/40 outline-none transition focus:border-cobalt focus:shadow-[0_0_0_4px_rgba(64,95,218,0.15)]"
    : "w-full rounded-xl border border-ink/15 bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-ink/40 outline-none transition focus:border-cobalt-900 focus:shadow-[0_0_0_4px_rgba(30,47,120,0.1)]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-cobalt-900/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={`relative w-full max-w-lg overflow-hidden p-7 sm:p-9 ${
              kids ? "rounded-[2rem] bg-[#F2F9EA] shadow-[0_10px_0_0_var(--color-cobalt-900)]" : "rounded-3xl bg-[#FBF6EE] shadow-[0_40px_100px_-30px_rgba(20,22,42,0.6)]"
            }`}
          >
            {/* hiasan sudut, gaya tiket */}
            <span aria-hidden className={`absolute -top-16 -right-16 size-44 rounded-full ${kids ? "bg-sun" : "bg-[#F4C77B]/40"}`} />
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/80 text-cobalt-900 transition hover:bg-white"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>

            {!sent ? (
              <>
                <p className={`relative ${kids ? "font-hand text-xl text-cobalt" : "text-xs font-semibold tracking-[0.2em] text-ink/50 uppercase"}`}>
                  {kids ? "Gratis, tanpa komitmen" : "Free trial pass"}
                </p>
                <h2
                  id={titleId}
                  className={`relative mt-1 text-cobalt-900 ${
                    kids ? "font-display text-[2.4rem] leading-[1] sm:text-5xl" : "text-[2.2rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-[2.7rem]"
                  }`}
                >
                  Daftar Free Trial sekarang
                </h2>

                <form ref={formRef} onSubmit={submit} className="relative mt-7 space-y-3">
                  {fields.map((f) => (
                    <label key={f.name} className="block">
                      <span className="sr-only">{f.label}</span>
                      {f.area ? (
                        <textarea name={f.name} rows={3} placeholder={`${f.label}${f.optional ? " (opsional)" : ""}`} className={`${input} resize-none`} />
                      ) : (
                        <input
                          name={f.name}
                          type={f.type ?? "text"}
                          inputMode={f.type === "tel" ? "tel" : undefined}
                          autoComplete={f.auto}
                          required={!f.optional}
                          placeholder={f.label}
                          onChange={() => error && setError("")}
                          className={input}
                        />
                      )}
                    </label>
                  ))}
                  {error && <p className="text-sm font-medium text-[#D2443F]">{error}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="max-w-[15rem] text-xs leading-snug text-ink/55">Data dikirim ke admin kami lewat WhatsApp.</p>
                    <Button type="submit" variant={kids ? "cobalt" : "dark"} size="md" className="px-7 text-base">
                      Daftar →
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="relative py-6 text-center">
                <p className={kids ? "font-display text-4xl text-cobalt-900" : "text-3xl font-semibold tracking-tight text-cobalt-900"}>Terima kasih!</p>
                <p className="mx-auto mt-3 max-w-xs text-[15px] text-ink/65">Kirim pesan yang sudah kami siapkan di WhatsApp, admin kami akan segera menjadwalkan trial class-nya.</p>
                <a href={CTA.trial.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-cobalt underline underline-offset-4">
                  WhatsApp tidak terbuka? Hubungi admin
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
