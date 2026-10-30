"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import type { Audience } from "@/lib/content";

const STORAGE_KEY = "en-audience";

/**
 * "corporate" = percobaan hero ke-3 (jendela pesawat). Isi section di bawahnya memakai konten Dewasa,
 * jadi untuk semua section `audience` tetap "kids" atau "adult"; hanya hero yang membedakan `choice`.
 */
export type Choice = Audience | "corporate";

function isChoice(value: string | null): value is Choice {
  return value === "kids" || value === "adult" || value === "corporate";
}
const audienceOf = (c: Choice): Audience => (c === "kids" ? "kids" : "adult");

/* ------------------------------------------------------------------
   Store kecil di luar React: menyimpan pilihan audiens.
   Server selalu "kids"; di browser, nilai awal dibaca dari ?for= di URL
   (untuk link iklan), lalu dari localStorage, lalu default "kids".
------------------------------------------------------------------- */
let current: Choice | null = null;
const listeners = new Set<() => void>();
let lastPoint: { x: number; y: number } | null = null;

function readChoice(): Choice {
  if (current === null) {
    let initial: Choice = "kids";
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("for");
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isChoice(fromUrl)) initial = fromUrl;
      else if (isChoice(saved)) initial = saved;
    } catch {
      /* localStorage bisa diblokir, abaikan */
    }
    current = initial;
  }
  return current;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

const getServerSnapshot = (): Choice => "kids";

/* ------------------------------------------------------------------ */

type AudienceContextValue = {
  audience: Audience;
  /** pilihan toggle hero: "kids" | "adult" | "corporate" (corporate memakai konten Dewasa) */
  choice: Choice;
  /** 1 = pindah ke kanan (kids -> adult), -1 = ke kiri. Dipakai untuk arah animasi. */
  direction: 1 | -1;
  /** true sesaat saat transisi seluruh halaman berjalan: section melewati animasi fade-nya sendiri */
  instant: boolean;
  /** dipakai komponen lain (mis. asisten): tidak menurunkan "corporate" ke "adult" */
  setAudience: (next: Audience) => void;
  /** dipakai toggle hero/navbar */
  setChoice: (next: Choice) => void;
};

const AudienceContext = createContext<AudienceContextValue | null>(null);

export function AudienceProvider({ children }: { children: React.ReactNode }) {
  const choice = useSyncExternalStore(subscribe, readChoice, getServerSnapshot);
  const audience = audienceOf(choice);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [instant, setInstant] = useState(false);

  // posisi klik terakhir = titik awal lingkaran transisi
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      lastPoint = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  // Sinkronkan tema CSS (data-audience di <html>).
  useEffect(() => {
    document.documentElement.dataset.audience = audience;
  }, [audience]);

  const setChoice = useCallback((next: Choice) => {
    const before = readChoice();
    if (before === next) return;
    const sameAudience = audienceOf(before) === audienceOf(next);
    const apply = () => {
      setDirection(next === "kids" ? -1 : 1);
      current = next;
      listeners.forEach((listener) => listener());
    };

    /*
     * Di luar hero: seluruh halaman berganti dengan lingkaran yang membesar dari titik klik
     * (sama seperti transisi di hero). Memakai View Transitions API; browser yang belum
     * mendukung cukup berganti biasa. Di dalam hero, hero sudah punya transisinya sendiri.
     */
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { ready: Promise<void>; finished: Promise<void> } };
    const inHero = window.scrollY < window.innerHeight * 0.6;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!sameAudience && !inHero && !reduced && doc.startViewTransition) {
      const { x, y } = lastPoint ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const vt = doc.startViewTransition(async () => {
        flushSync(() => {
          setInstant(true);
          apply();
        });
        // beri waktu animasi keluar/masuk (yang sudah dibuat instan) selesai sebelum difoto
        await new Promise((res) => setTimeout(res, 60));
      });
      vt.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            { duration: 1100, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
          );
        })
        .catch(() => {});
      vt.finished.finally(() => setInstant(false));
    } else {
      apply();
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      const url = new URL(window.location.href);
      url.searchParams.set("for", next);
      window.history.replaceState(null, "", url);
    } catch {
      /* abaikan */
    }
  }, []);

  const setAudience = useCallback(
    (next: Audience) => {
      if (next === "adult" && readChoice() === "corporate") return;
      setChoice(next);
    },
    [setChoice],
  );

  const value = useMemo(
    () => ({ audience, choice, direction, instant, setAudience, setChoice }),
    [audience, choice, direction, instant, setAudience, setChoice],
  );

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error("useAudience harus dipakai di dalam <AudienceProvider>");
  return ctx;
}
