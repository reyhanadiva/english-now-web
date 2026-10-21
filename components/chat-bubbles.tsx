"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * Percakapan singkat yang muncul bergantian (contoh bahasa Inggris yang natural).
 * Baru mulai saat terlihat di layar.
 */
export function ChatBubbles({
  lines,
  theme,
  className = "",
}: {
  lines: [string, string, string];
  theme: "kids" | "adult";
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-40px" });
  const [shown, setShown] = useState(reduce ? 3 : 1);

  useEffect(() => {
    if (reduce || !inView) return;
    const id = window.setInterval(() => setShown((n) => (n >= 6 ? 1 : n + 1)), 1300);
    return () => window.clearInterval(id);
  }, [reduce, inView]);

  const left = theme === "kids" ? "bg-white text-ink" : "bg-white/90 text-ink";
  const right = theme === "kids" ? "bg-cobalt text-white" : "bg-sun text-cobalt-900";

  return (
    <div ref={ref} className={`flex flex-col gap-2 ${className}`} aria-label="Contoh percakapan">
      <AnimatePresence>
        {lines.map((line, i) =>
          i < Math.min(shown, 3) ? (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-[0_8px_20px_-8px_rgba(20,30,90,0.45)] ${
                i % 2 === 0 ? `self-start rounded-bl-md ${left}` : `self-end rounded-br-md ${right}`
              } ${theme === "kids" ? "font-semibold" : "font-medium"}`}
            >
              {line}
            </motion.p>
          ) : null,
        )}
      </AnimatePresence>
    </div>
  );
}

/** jendela chat ala aplikasi (titik merah-kuning-hijau, label live) berisi ChatBubbles */
export function ChatWindow({ kids, title, lines }: { kids: boolean; title: string; lines: [string, string, string] }) {
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
        <ChatBubbles key={lines[0]} lines={lines} theme={kids ? "kids" : "adult"} className="min-h-[8.5rem]" />
      </div>
    </div>
  );
}
