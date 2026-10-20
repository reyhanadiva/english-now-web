import Link from "next/link";

type Variant = "sun" | "white" | "cobalt" | "dark" | "light" | "sunPill";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap " +
  "transition-[transform,box-shadow,filter,background-color] duration-150 select-none " +
  "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-sky " +
  "active:translate-y-[2px]";

const variants: Record<Variant, string> = {
  // Tombol "chunky" ala Duolingo: bayangan tebal di bawah yang ikut turun saat ditekan
  sun: "rounded-2xl font-display tracking-wide bg-sun text-ink shadow-[0_5px_0_0_var(--color-sun-600)] hover:brightness-105 active:shadow-[0_2px_0_0_var(--color-sun-600)]",
  white:
    "rounded-2xl font-display tracking-wide bg-white text-cobalt-700 shadow-[0_5px_0_0_var(--color-mist)] hover:bg-mist-50 active:shadow-[0_2px_0_0_var(--color-mist)]",
  cobalt:
    "rounded-2xl font-sans font-bold bg-cobalt text-white shadow-[0_5px_0_0_var(--color-cobalt-900)] hover:bg-cobalt-700 active:shadow-[0_2px_0_0_var(--color-cobalt-900)]",
  // Pill gelap yang tenang, untuk hero & navbar (kesan premium)
  dark: "rounded-full font-sans font-semibold bg-cobalt-900 text-white shadow-[0_8px_24px_rgba(30,47,120,0.28)] hover:bg-cobalt-700",
  // versi terang dari "dark", untuk latar gelap (hero Dewasa)
  // pill kuning brand, untuk latar gelap (hero Dewasa)
  sunPill: "rounded-full font-sans font-semibold bg-sun text-cobalt-900 shadow-[0_8px_24px_rgba(255,214,90,0.35)] hover:brightness-105",
  light: "rounded-full font-sans font-semibold bg-white text-cobalt-900 shadow-[0_8px_24px_rgba(10,16,60,0.35)] hover:bg-mist-50",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3.5 text-lg",
  sm: "px-5 py-2.5 text-sm",
};

export function Button({
  href,
  variant = "sun",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  // link keluar (mis. WhatsApp) dibuka di tab baru
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
