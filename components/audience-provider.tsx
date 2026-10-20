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

function isAudience(value: string | null): value is Audience {
  return value === "kids" || value === "adult";
}

/* ------------------------------------------------------------------
   Store kecil di luar React: menyimpan pilihan audiens.
   Server selalu "kids"; di browser, nilai awal dibaca dari ?for= di URL
   (untuk link iklan), lalu dari localStorage, lalu default "kids".
------------------------------------------------------------------- */
let current: Audience | null = null;
const listeners = new Set<() => void>();
let lastPoint: { x: number; y: number } | null = null;

function readAudience(): Audience {
  if (current === null) {
    let initial: Audience = "kids";
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("for");
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isAudience(fromUrl)) initial = fromUrl;
      else if (isAudience(saved)) initial = saved;
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

const getServerSnapshot = (): Audience => "kids";

/* ------------------------------------------------------------------ */

type AudienceContextValue = {
  audience: Audience;
  /** 1 = pindah ke kanan (kids -> adult), -1 = ke kiri. Dipakai untuk arah animasi. */
  direction: 1 | -1;
  /** true sesaat saat transisi seluruh halaman berjalan: section melewati animasi fade-nya sendiri */
  instant: boolean;
  setAudience: (next: Audience) => void;
};

const AudienceContext = createContext<AudienceContextValue | null>(null);

export function AudienceProvider({ children }: { children: React.ReactNode }) {
  const audience = useSyncExternalStore(subscribe, readAudience, getServerSnapshot);
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

  const setAudience = useCallback((next: Audience) => {
    if (readAudience() === next) return;
    const apply = () => {
      setDirection(next === "adult" ? 1 : -1);
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
    if (!inHero && !reduced && doc.startViewTransition) {
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

  const value = useMemo(
    () => ({ audience, direction, instant, setAudience }),
    [audience, direction, instant, setAudience],
  );

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error("useAudience harus dipakai di dalam <AudienceProvider>");
  return ctx;
}
