/**
 * RUANG KOSONG untuk grafik/ilustrasi bertema bahasa Inggris (belum ditentukan isinya).
 * Ide isi: awan kata, balon percakapan multi-bahasa, huruf/alfabet melayang, "Hello" dalam banyak bahasa.
 * TODO: ganti isi komponen ini dengan grafiknya; ukuran & posisinya sudah disiapkan.
 */
export function GraphicSlot({ kids, className = "" }: { kids: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={`grid place-items-center rounded-3xl border-2 border-dashed text-center ${
        kids ? "border-white/35 text-white/55" : "border-ink/20 text-ink/40"
      } ${className}`}
    >
      <span className="px-4 text-xs leading-snug font-semibold">
        Ruang grafik
        <span className="block font-normal">visual bertema bahasa Inggris</span>
      </span>
    </div>
  );
}
