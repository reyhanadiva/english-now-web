/** Alamat dasar website (untuk tautan kanonik, data terstruktur, dan sitemap). Ubah lewat NEXT_PUBLIC_SITE_URL saat domain final sudah pasti. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://englishnow.co.id").replace(/\/$/, "");
