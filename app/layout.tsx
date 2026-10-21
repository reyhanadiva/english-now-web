import type { Metadata } from "next";
// Font lokal lewat @fontsource (tidak butuh akses ke Google Fonts saat dev/build)
import "@fontsource/lilita-one/400.css";
import "@fontsource/kite-one/400.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import { AudienceProvider } from "@/components/audience-provider";
import { TrialProvider } from "@/components/trial-modal";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Now | Unleash your English Potential Now!",
  description:
    "Kursus bahasa Inggris untuk anak, remaja, dewasa, dan bisnis. Pengajar bersertifikat CELTA, DELTA, dan TKT, native speaker, kurikulum Cambridge. Coba kelas gratis.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning: ekstensi browser (mis. Grammarly) menambah atribut ke <body>,
  // dan data-audience di <html> diganti di browser sesuai pilihan pengunjung.
  return (
    <html lang="id" data-audience="kids" className="antialiased" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <AudienceProvider>
          <TrialProvider>{children}</TrialProvider>
        </AudienceProvider>
      </body>
    </html>
  );
}
