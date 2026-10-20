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
