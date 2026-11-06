import type { Audience } from "./content";

/**
 * Model data satu artikel (calon skema CMS di panel admin).
 * `blocks` adalah isi artikel: daftar blok berurutan; tiap tipe blok = satu tombol di editor.
 *
 * Teks di dalam blok mendukung penanda ringan (ditulis editor tanpa HTML):
 *   **tebal**   *miring*   [teks tautan](https://...)   {{istilah|artinya}} (kata yang bisa diketuk untuk melihat artinya)
 */
export type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "gallery"; images: { src: string; alt: string; caption?: string }[] }
  | { type: "quote"; text: string; by?: string }
  | { type: "callout"; tone: "tip" | "info" | "warn" | "parent"; title?: string; text: string }
  | { type: "embed"; src: string; title: string; caption?: string; ratio?: "16/9" | "4/3" }
  | { type: "accordion"; items: { q: string; a: string }[] }
  | { type: "vocab"; title?: string; items: { word: string; meaning: string; example: string; say?: string }[] }
  | { type: "quiz"; question: string; options: string[]; answer: number; explain: string }
  | { type: "template"; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "cta"; title: string; text: string; label: string }
  | { type: "divider" };

export interface ArticleDoc {
  slug: string;
  audience: Audience;
  title: string;
  deck: string;
  /**
   * FOTO SAMPUL: satu foto saja, dipakai di tiga tempat dengan bentuk berbeda
   * (hero artikel lebar/landscape, kartu Anak tegak/portrait, kartu Dewasa landscape).
   * Standar unggah: landscape 16:9, minimal 1600x900 px, WebP/JPG di bawah 300 KB.
   * Subjek (wajah/objek utama) diletakkan di sekitar tengah supaya aman saat dipotong jadi tegak.
   * Foto portrait/kotak tidak error, tetapi dipotong otomatis; atur `coverFocus` agar bagian pentingnya tetap terlihat.
   */
  cover: string;
  /** titik fokus pemotongan, format CSS object-position, mis. "50% 30%" (tengah-atas). Default: tengah. */
  coverFocus?: string;
  /** keterangan foto sampul (opsional; hanya isi bila memberi informasi, mis. kredit foto atau lokasi) */
  coverCaption?: string;
  category: string;
  /** name = nama akun penulis (mis. "Tim English Now" atau nama pengajar). role = jabatan penulis, opsional; kosongkan untuk akun tim. */
  author: { name: string; role?: string };
  date: string;
  readMin: number;
  /** ringkasan poin utama di atas artikel */
  takeaways: string[];
  blocks: Block[];
  sample?: boolean;
}

const MAP = `https://maps.google.com/maps?q=${encodeURIComponent("English Now Bandung")}&z=15&output=embed`;

export const ARTICLE_DOCS: ArticleDoc[] = [
  {
    slug: "email-bisnis-english-jelas-sopan",
    audience: "adult",
    title: "Menulis email bisnis dalam English yang jelas dan sopan",
    deck: "Struktur sederhana yang bisa dipakai untuk email permintaan, tindak lanjut, dan balasan ke klien luar negeri.",
    cover: "/programs/business.jpg",
    category: "Business English",
    author: { name: "Tim English Now" },
    date: "2026-10-20",
    readMin: 6,
    sample: true,
    takeaways: [
      "Tulis tujuan email dalam satu kalimat sebelum menulis yang lain.",
      "Pakai susunan tetap: subject, salam, tujuan, isi, permintaan, penutup.",
      "Sopan itu singkat dan jelas, bukan panjang dan berputar-putar.",
    ],
    blocks: [
      { type: "p", text: "Banyak orang bisa membaca email berbahasa Inggris, tetapi ragu saat harus **menulisnya**. Biasanya bukan karena tata bahasa, melainkan karena bingung harus mulai dari mana dan seberapa formal." },
      { type: "h2", text: "Mulai dari tujuan satu kalimat" },
      { type: "p", text: "Sebelum membuka email baru, jawab dulu: *apa yang saya inginkan dari pembaca setelah ia selesai membaca?* Jika jawabannya bisa ditulis dalam satu kalimat, isi email hampir selesai." },
      { type: "callout", tone: "tip", title: "Coba ini", text: "Tulis tujuannya dalam bahasa Indonesia dulu, lalu ubah ke English. Kalimat yang pendek hampir selalu lebih mudah diterjemahkan." },
      { type: "h2", text: "Susunan email yang mudah dibaca" },
      { type: "ol", items: ["**Subject** yang spesifik, misalnya “Invoice #123: payment confirmation”.", "**Salam**: Dear Mr. Rahman, untuk formal; Hi Rahman, jika sudah akrab.", "**Tujuan** dalam satu kalimat pembuka.", "**Isi** singkat: hanya hal yang perlu diketahui pembaca.", "**Permintaan** yang jelas, lengkap dengan tenggat bila ada.", "**Penutup** dan nama Anda."] },
      { type: "image", src: "/why/teachers.jpg", alt: "Peserta kelas berdiskusi dengan pengajar", caption: "Berlatih dengan pengajar membuat pilihan kata terasa lebih alami." },
      { type: "h2", text: "Frasa yang sering dipakai" },
      { type: "p", text: "Ketuk kata bergaris titik untuk melihat artinya, misalnya {{follow up|menindaklanjuti}} atau {{attached|terlampir}}." },
      {
        type: "vocab",
        items: [
          { word: "I’m writing to follow up on…", meaning: "Saya menulis untuk menindaklanjuti…", example: "I’m writing to follow up on our meeting last Tuesday." },
          { word: "Please find attached…", meaning: "Terlampir…", example: "Please find attached the updated proposal." },
          { word: "Could you please confirm…?", meaning: "Mohon konfirmasi…", example: "Could you please confirm the delivery date?" },
          { word: "I look forward to hearing from you.", meaning: "Saya menantikan kabar dari Anda.", example: "Thank you for your time. I look forward to hearing from you." },
        ],
      },
      { type: "template", title: "Template: tindak lanjut setelah rapat", text: "Subject: Follow-up: meeting on [topic]\n\nDear [Name],\n\nThank you for meeting with us on [day]. I’m writing to follow up on [topic].\n\nAs discussed, we will [action]. Could you please confirm [detail] by [date]?\n\nPlease find attached [document].\n\nKind regards,\n[Your name]" },
      { type: "h2", text: "Formal atau santai?" },
      { type: "table", head: ["Bagian", "Lebih formal", "Lebih santai"], rows: [["Salam", "Dear Mr. Rahman,", "Hi Rahman,"], ["Meminta", "Could you please send…", "Can you send…"], ["Penutup", "Kind regards,", "Thanks,"]] },
      { type: "quote", text: "Email yang baik membuat pembaca tahu apa yang harus dilakukan, tanpa harus menebak.", by: "Tim English Now" },
      { type: "h3", text: "Sopan, bukan bertele-tele" },
      { type: "ul", items: ["Satu paragraf untuk satu gagasan.", "Gunakan “please” dan “thank you” secukupnya, tidak di setiap kalimat.", "Baca ulang sekali sebelum mengirim, terutama nama dan tanggal."] },
      { type: "callout", tone: "warn", title: "Hati-hati", text: "Singkatan seperti ASAP bisa terasa mendesak bagi klien baru. Lebih aman tulis tenggat yang jelas, misalnya “by Friday, 5 pm”." },
      { type: "accordion", items: [{ q: "Kapan memakai “Dear”, kapan “Hi”?", a: "“Dear” untuk situasi formal atau orang yang baru dikenal. “Hi” cocok untuk rekan yang sudah akrab. Jika ragu, ikuti cara lawan bicara menyapa Anda." }, { q: "Apakah boleh memakai singkatan?", a: "Boleh untuk singkatan yang umum di bidang Anda. Untuk klien baru, tulis lengkap supaya tidak salah paham." }] },
      { type: "quiz", question: "Penutup mana yang paling sopan untuk email ke klien?", options: ["Reply now.", "I look forward to hearing from you.", "Answer me ASAP."], answer: 1, explain: "Kalimat kedua sopan dan tidak memerintah. Dua lainnya terdengar menuntut." },
      { type: "divider" },
      { type: "h2", text: "Ingin latihan langsung?" },
      { type: "p", text: "Datang ke kelas kami dan latihan menulis serta berbicara bersama pengajar." },
      { type: "embed", src: MAP, title: "Peta lokasi English Now", caption: "Lokasi kelas kami.", ratio: "16/9" },
      { type: "cta", title: "Coba kelas Business English gratis", text: "Kenali cara belajarnya dulu sebelum memutuskan.", label: "Free Trial Class" },
    ],
  },
  {
    slug: "lagu-dan-permainan-kosakata",
    audience: "kids",
    title: "Lagu dan permainan untuk belajar kosakata",
    deck: "Belajar sambil bergerak, supaya kata baru lebih mudah diingat.",
    cover: "/why/practice.jpg",
    category: "Main Sambil Belajar",
    author: { name: "Tim English Now" },
    date: "2026-10-18",
    readMin: 3,
    sample: true,
    takeaways: ["Badan bergerak, kata baru lebih lekat.", "Cukup 5 menit sehari, tidak perlu alat khusus.", "Salah itu boleh. Yang penting berani mencoba!"],
    blocks: [
      { type: "p", text: "Kata baru lebih cepat diingat kalau **badan ikut bergerak**. Yuk coba tiga permainan kecil ini di rumah, bersama kakak, adik, atau orang tua." },
      { type: "h2", text: "Tiga permainan seru" },
      { type: "ol", items: ["**Simon Says**: satu orang jadi “Simon” dan memberi perintah. Ikuti hanya kalau diawali “Simon says”.", "**I Spy**: “I spy with my little eye something blue.” Tebak benda yang dimaksud!", "**Charades**: peragakan sebuah kata tanpa suara, teman menebak dalam English."] },
      { type: "gallery", images: [{ src: "/programs/kids.jpg", alt: "Anak-anak belajar bersama" }, { src: "/why/native.jpg", alt: "Belajar bersama pengajar" }, { src: "/programs/teens.jpg", alt: "Remaja berlatih bersama" }] },
      { type: "callout", tone: "parent", title: "Catatan untuk orang tua", text: "Tidak perlu mengoreksi setiap kesalahan. Pujilah usahanya dulu, lalu ulangi kalimat yang benar dengan santai." },
      { type: "h2", text: "Kata-kata untuk dicoba" },
      { type: "p", text: "Ketuk kartu untuk membaliknya. Ucapkan keras-keras sambil menirukan gerakannya!" },
      {
        type: "vocab",
        items: [
          { word: "jump", meaning: "melompat", example: "Simon says, jump!" },
          { word: "clap", meaning: "bertepuk tangan", example: "Simon says, clap your hands!" },
          { word: "spin", meaning: "berputar", example: "Simon says, spin around!" },
          { word: "freeze", meaning: "diam, tidak bergerak", example: "Freeze! Don’t move!" },
        ],
      },
      { type: "quiz", question: "“Simon says, clap your hands!” Apa yang kamu lakukan?", options: ["Melompat", "Bertepuk tangan", "Berhenti"], answer: 1, explain: "Betul! “Clap” artinya bertepuk tangan." },
      { type: "quote", text: "Salah itu boleh. Yang penting berani mencoba!" },
      { type: "accordion", items: [{ q: "Bagaimana kalau anak malu bicara?", a: "Mulai dengan gerakan dulu, tanpa harus bicara. Ucapan akan menyusul saat ia merasa nyaman." }, { q: "Berapa lama sebaiknya bermain?", a: "Lima sampai sepuluh menit sudah cukup. Berhenti saat masih seru, supaya besok mau main lagi." }] },
      { type: "callout", tone: "tip", title: "Tantangan kecil", text: "Mainkan Simon Says hari ini, lalu hitung: berapa kata English yang kamu ingat?" },
      { type: "cta", title: "Mau belajar bareng teman baru?", text: "Coba kelas gratisnya dulu, ya!", label: "Free Trial Class" },
    ],
  },
];

export const getArticle = (slug: string) => ARTICLE_DOCS.find((a) => a.slug === slug);
