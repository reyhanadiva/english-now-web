import type { Audience } from "./content";

/**
 * Warna latar section setelah hero, per dunia.
 * Dipakai lewat style inline (bukan class) supaya selalu muncul walau dev server
 * belum memuat ulang token baru di globals.css.
 */
export const SECTION_BG: Record<Audience, string> = {
  kids: "#F2F9EA", // hijau muda, lanjutan padang rumput
  adult: "#FBF6EE", // gading hangat, lanjutan cahaya senja
};
