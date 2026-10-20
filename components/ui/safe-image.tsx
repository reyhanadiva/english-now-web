"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * next/image yang tidak "pecah" kalau foto gagal dimuat (mis. foto contoh dari internet):
 * menampilkan bidang berwarna lembut dengan inisial/label sebagai gantinya.
 */
export function SafeImage({ fallback, ...props }: ImageProps & { fallback?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-sky/30 via-mist to-sun/40">
        <span className="font-display text-4xl text-cobalt-900/40">{fallback ?? ""}</span>
      </div>
    );
  }
  // eslint-disable-next-line jsx-a11y/alt-text -- alt diteruskan lewat props
  return <Image {...props} onError={() => setFailed(true)} />;
}
