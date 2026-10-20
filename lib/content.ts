export type Audience = "kids" | "adult";

/**
 * Semua teks hero ada di sini supaya gampang diedit tanpa menyentuh komponen.
 * TODO: ganti href sesuai URL asli (form trial gratis & halaman tes level).
 */
/**
 * Semua tombol (kecuali tes level) mengarah ke satu nomor WhatsApp,
 * tapi pesan pembukanya berbeda supaya admin langsung tahu konteksnya.
 * TODO: ganti nomor di bawah (format 62..., tanpa + atau 0 di depan).
 */
export const WA_NUMBER = "628000000000";
export const wa = (message: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

export const CTA = {
  trial: { label: "Free Trial Class", href: wa("Halo English Now, saya ingin ikut free trial class.") },
  consult: { label: "Konsultasi program", href: wa("Halo English Now, saya ingin konsultasi program.") },
  /** TODO: ganti dengan URL halaman tes level yang sudah ada */
  levelHref: "/tes-level",
};

export const NAV_LINKS = [
  { label: "Kenapa Kami", href: "#kenapa" },
  { label: "Pengajar", href: "#pengajar" },
  { label: "Program", href: "#biaya" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "FAQ", href: "#faq" },
];

export const AUDIENCE_OPTIONS: { id: Audience; label: string; short: string }[] = [
  { id: "kids", label: "Anak & Remaja", short: "Anak" },
  { id: "adult", label: "Dewasa & Bisnis", short: "Dewasa" },
];

/** Tagline resmi, tampil sebagai jargon kecil (tulisan tangan) di atas headline */
export const TAGLINE = "Unleash your English Potential Now!";

/**
 * Headline bertema "bahasa Inggris membuka jalan/peluang di depan",
 * sejalan dengan visual jalan/sungai yang menuju cahaya di cakrawala.
 */
export const heroContent: Record<Audience, { title: string; sub: string }> = {
  kids: {
    title: "Bekal anak untuk dunia yang lebih luas.",
    sub: "Kelas bahasa Inggris yang membuat anak berani berbicara, bukan sekadar menghafal kosakata.",
  },
  adult: {
    title: "Satu bahasa, lebih banyak peluang.",
    sub: "Business class untuk tim perusahaan, juga kelas privat dan persiapan IELTS untuk kerja atau studi ke luar negeri.",
  },
};

/* ------------------------------------------------------------------ */
/* Section 2: Kenapa English Now                                       */
/* ------------------------------------------------------------------ */

export const CREDENTIALS = ["CELTA", "DELTA", "TKT", "Native speaker", "Kurikulum Cambridge", "Level CEFR A1–C2"];

/**
 * TODO: ganti dengan angka asli. "XXX" sengaja dibiarkan mencolok
 * supaya tidak ikut tayang tanpa sengaja.
 */
export const STATS = [
  { value: "XXX+", label: "siswa sudah belajar" },
  { value: "XX", label: "pengajar bersertifikat" },
  { value: "A1–C2", label: "jenjang level CEFR" },
];

export const CERTS = [
  { code: "CELTA", short: "Sertifikat mengajar", name: "Certificate in Teaching English to Speakers of Other Languages", by: "Cambridge" },
  { code: "DELTA", short: "Diploma mengajar lanjutan", name: "Diploma in Teaching English to Speakers of Other Languages", by: "Cambridge" },
  { code: "TKT", short: "Tes pengetahuan mengajar", name: "Teaching Knowledge Test", by: "Cambridge" },
];

export const LEVELS = [
  { code: "A1", name: "Pemula", kids: "Kenalan, menyapa, dan kalimat sehari-hari yang sederhana.", adult: "Perkenalan diri dan kalimat dasar untuk kebutuhan sehari-hari." },
  { code: "A2", name: "Dasar", kids: "Cerita soal diri sendiri, keluarga, sekolah, dan hobi.", adult: "Percakapan rutin: memesan, bertanya arah, small talk singkat." },
  { code: "B1", name: "Menengah", kids: "Ngobrol topik yang familiar dan mulai berani bercerita panjang.", adult: "Ikut rapat santai, menulis email kerja, dan menjelaskan pendapat." },
  { code: "B2", name: "Menengah atas", kids: "Diskusi dan presentasi di kelas dengan percaya diri.", adult: "Presentasi, negosiasi, dan diskusi dengan klien secara lancar." },
  { code: "C1", name: "Mahir", kids: "Bahasa yang fleksibel untuk lomba, studi, dan ujian internasional.", adult: "Bahasa profesional yang luwes untuk karier dan studi lanjut." },
  { code: "C2", name: "Sangat mahir", kids: "Hampir setara penutur asli.", adult: "Hampir setara penutur asli, di situasi apa pun." },
];

/** Jenjang Cambridge untuk anak & remaja (dipakai di "peta petualangan" versi Anak) */
export const KIDS_LEVELS = [
  { code: "Pre A1", name: "Starters", body: "Kata dan kalimat pertama: warna, angka, hewan, keluarga." },
  { code: "A1", name: "Movers", body: "Mulai bercerita pendek tentang diri sendiri dan sekitarnya." },
  { code: "A2", name: "Flyers", body: "Ngobrol soal kegiatan sehari-hari dan membaca cerita pendek." },
  { code: "A2", name: "Key", body: "Memahami teks sederhana dan menulis pesan singkat." },
  { code: "B1", name: "Preliminary", body: "Ngobrol lancar topik sehari-hari dan menulis cerita sendiri." },
  { code: "B2", name: "First", body: "Diskusi dan presentasi dengan percaya diri." },
];

/**
 * Section 2 "Kenapa English Now": tiga alasan + angka.
 * Foto: /public/why/*.jpg. Yang sekarang dipotong dari website lama,
 * TODO: ganti dengan file foto asli (resolusi besar).
 */
export type Stage = "teachers" | "native" | "practice" | "tailored" | "flexible" | "experts";

export interface Reason {
  id: Stage;
  title: string;
  body: string;
  chips?: string[];
  photo?: string;
}

export const whyKids = {
  title: "Kenapa memilih English Now?",
  sub: "Tiga hal yang membuat anak betah belajar dan makin percaya diri.",
  reasons: [
    {
      id: "teachers",
      title: "Guru bersertifikat Cambridge",
      body: "Guru kami terlatih mengajar anak dengan cara yang tepat, bukan sekadar fasih berbahasa Inggris.",
      chips: ["CELTA", "DELTA", "TKT"],
      photo: "/why/teachers.jpg",
    },
    {
      id: "native",
      title: "Belajar langsung dengan native speaker",
      body: "Anak terbiasa mendengar dan menjawab dalam bahasa Inggris yang alami.",
      photo: "/why/native.jpg",
    },
    {
      id: "practice",
      title: "Banyak praktik, bukan hafalan",
      body: "Anak lebih sering berbicara dan tampil di depan kelas daripada sekadar mencatat.",
      photo: "/why/practice.jpg",
    },
  ] as Reason[],
  chatTitle: "Contoh percakapan di kelas",
  chat: ["Hi! What did you do on the weekend?", "I flew a kite with my friends!", "Wow, that sounds fun!"] as [string, string, string],
  /** TODO: ganti angka asli */
  stats: [
    { value: "XXX+", label: "siswa sudah belajar" },
    { value: "XX", label: "pengajar bersertifikat" },
  ],
};

export const whyAdult = {
  title: "Untuk tim perusahaan, maupun untuk Anda pribadi.",
  sub: "Apa pun tujuannya, programnya disusun mengikuti kebutuhan Anda.",
  paths: [
    { name: "Business class", note: "untuk perusahaan & tim" },
    { name: "Kelas privat", note: "tatap muka atau online" },
    { name: "Persiapan IELTS", note: "kerja & studi ke luar negeri" },
  ],
  reasons: [
    {
      id: "tailored",
      title: "Kurikulum disusun sesuai kebutuhan",
      body: "Untuk perusahaan, kebutuhan tim dibahas terlebih dahulu sebelum materi disusun. Untuk pribadi, materinya mengikuti tujuan Anda.",
    },
    {
      id: "flexible",
      title: "Jadwal dan format yang fleksibel",
      body: "Business class mengikuti jadwal perusahaan. Kelas privat, online, dan persiapan ujian bisa diatur bersama.",
    },
    {
      id: "experts",
      title: "Pengajar bersertifikat Cambridge & native speaker",
      body: "Pengajar memegang CELTA, DELTA, dan TKT, dan Anda berlatih langsung dengan native speaker.",
      chips: ["CELTA", "DELTA", "TKT", "Native speaker"],
      photo: "/why/teachers.jpg",
    },
  ] as Reason[],
  chatTitle: "Contoh percakapan di kelas",
  chat: ["Could we move the meeting to Thursday?", "Sure, does 10 a.m. work for you?", "Perfect, I'll send the invite."] as [string, string, string],
  /** TODO: ganti angka asli */
  stats: [
    { value: "XX+", label: "perusahaan & institusi mempercayakan timnya" },
    { value: "XX", label: "pengajar bersertifikat" },
  ],
};

/** Section 3: level */
export const levelContent: Record<Audience, { title: string; sub: string; cta: string }> = {
  kids: {
    title: "Kurikulum Cambridge, naik level selangkah demi selangkah.",
    sub: "Ketuk setiap pos untuk melihat apa yang dipelajari di level tersebut.",
    cta: "Cek level anak",
  },
  adult: {
    title: "Tahu posisi Anda, tahu target berikutnya.",
    sub: "Level mengikuti standar CEFR. Klik levelnya untuk melihat target kemampuannya.",
    cta: "Cek level saya",
  },
};

/* ------------------------------------------------------------------ */
/* Section Pengajar                                                    */
/* ------------------------------------------------------------------ */

export interface Teacher {
  name: string;
  /** sertifikasi mengajar */
  certs: ("CELTA" | "DELTA" | "TKT")[];
  /** hasil tes kemampuan bahasa Inggris, mis. "IELTS 8.0" atau "Cambridge C2" */
  score?: string;
  /** isi untuk native speaker, mis. "UK" */
  native?: string;
  photo: string;
}

const u = (id: string) => `https://images.unsplash.com/${id}?w=600&h=800&fit=crop&crop=faces&q=80`;

/**
 * TODO: SEMUA DATA DI BAWAH MASIH CONTOH (nama & foto dari Unsplash).
 * Ganti dengan data pengajar asli; foto taruh di /public/teachers/nama.jpg
 * lalu isi photo: "/teachers/nama.jpg".
 */
export const TEACHERS: Teacher[] = [
  { name: "Miss Anisa", certs: ["CELTA"], score: "IELTS 8.0", photo: u("photo-1494790108377-be9c29b29330") },
  { name: "Mr. Daniel", certs: ["CELTA", "DELTA"], native: "UK", photo: u("photo-1507003211169-0a1dd7228f2d") },
  { name: "Miss Clara", certs: ["TKT"], score: "Cambridge C2", photo: u("photo-1438761681033-6461ffad8d80") },
  { name: "Mr. Bayu", certs: ["CELTA"], score: "IELTS 7.5", photo: u("photo-1500648767791-00dcc994a43e") },
  { name: "Miss Gita", certs: ["TKT"], score: "Cambridge C1", photo: u("photo-1544005313-94ddf0286df2") },
  { name: "Mr. Hendra", certs: ["CELTA", "TKT"], score: "IELTS 8.5", photo: u("photo-1472099645785-5658abf4ff4e") },
  { name: "Miss Intan", certs: ["CELTA"], score: "Cambridge C2", photo: u("photo-1534528741775-53994a69daeb") },
  { name: "Mr. James", certs: ["CELTA"], native: "Australia", photo: u("photo-1506794778202-cad84cf45f1d") },
  { name: "Miss Kirana", certs: ["TKT"], score: "IELTS 7.5", photo: u("photo-1580489944761-15a19d654956") },
  { name: "Mr. Lukas", certs: ["DELTA"], score: "Cambridge C2", photo: u("photo-1599566150163-29194dcaad36") },
  { name: "Miss Maya", certs: ["CELTA"], score: "IELTS 8.0", photo: u("photo-1573496359142-b8d87734a5a2") },
  { name: "Mr. Nanda", certs: ["TKT"], score: "Cambridge C1", photo: u("photo-1519085360753-af0119f7cbe7") },
  { name: "Miss Olivia", certs: ["CELTA", "TKT"], score: "IELTS 8.0", photo: u("photo-1531123897727-8f129e1688ce") },
  { name: "Mr. Raka", certs: ["CELTA"], score: "IELTS 7.5", photo: u("photo-1527980965255-d3b416303d12") },
  { name: "Miss Sekar", certs: ["TKT"], score: "Cambridge C1", photo: u("photo-1544725176-7c40e5a71c5e") },
];

export const teachersContent = {
  title: "Kenalan dengan pengajar kami.",
  sub: (total: number, natives: number) =>
    `${total} pengajar bersertifikat, termasuk ${natives} native speaker. Geser untuk melihat semuanya.`,
};

/** Foto versi Dewasa di section 2 (dipotong dari website lama). TODO: ganti file resolusi besar. */
export const ADULT_PHOTOS = {
  meeting: "/programs/business.jpg",
  teacher: "/programs/exam.jpg",
};

/* ------------------------------------------------------------------ */
/* Section Program & Biaya                                             */
/* ------------------------------------------------------------------ */

export interface Program {
  id: "kids" | "teens" | "exam" | "private" | "business";
  name: string;
  who: string;
  price: string;
  unit: string;
  points: string[];
  photo: string;
}

export const PROGRAMS: Record<Program["id"], Program> = {
  kids: {
    id: "kids",
    name: "Kids Class",
    who: "Usia 6–12 tahun · SD kelas 1–6",
    price: "Rp1,2 jt",
    unit: "per semester · 16 pertemuan",
    points: ["Kelas 8–15 siswa", "Belajar bersama native speaker (min. 1x per semester)", "Laporan belajar akhir semester", "Progres sesuai standar Cambridge"],
    photo: "/programs/kids.jpg",
  },
  teens: {
    id: "teens",
    name: "Teens Class",
    who: "Usia 12–19 tahun · SMP–SMA",
    price: "Rp1,2 jt",
    unit: "per semester · 16 pertemuan",
    points: ["Kelas 8–15 siswa", "Belajar bersama native speaker (min. 1x per semester)", "Laporan belajar akhir semester", "Progres sesuai standar Cambridge"],
    photo: "/programs/teens.jpg",
  },
  private: {
    id: "private",
    name: "Private Class",
    who: "Semua usia",
    price: "Rp200 rb",
    unit: "per sesi · 60 menit",
    points: ["Online dan/atau tatap muka", "Materi dapat disesuaikan dengan kebutuhan", "Konsultasi kebutuhan di awal", "Laporan berkala"],
    photo: "/programs/private.jpg",
  },
  exam: {
    id: "exam",
    name: "Exam Class",
    who: "IELTS · TOEFL · Cambridge",
    price: "Rp1,8 jt",
    unit: "per program · 12–16 pertemuan",
    points: ["Strategi mengerjakan setiap bagian tes", "Pre-test gratis di awal", "Task-based: waktu latihan maksimal", "Progress test & mock final test"],
    photo: "/programs/exam.jpg",
  },
  business: {
    id: "business",
    name: "Business Class",
    who: "Untuk perusahaan & institusi",
    price: "Rp22 jt",
    unit: "per program · 20 jam",
    points: ["12–18 peserta per program", "Silabus & materi disusun sesuai kebutuhan", "Jumlah pertemuan & jadwal fleksibel", "Pengajar datang ke kantor", "Laporan capaian belajar di akhir"],
    photo: "/programs/business.jpg",
  },
};

export const programContent = {
  kids: {
    title: "Pilih kelas sesuai usia anak.",
    sub: "Semua program diawali tes penempatan gratis, agar anak masuk ke level yang tepat.",
    list: ["kids", "teens", "private"] as Program["id"][],
    extra: "Untuk persiapan ujian Cambridge, IELTS, atau TOEFL, lihat Exam Class pada pilihan Dewasa & Bisnis.",
  },
  adult: {
    title: "Program untuk tim maupun pribadi.",
    sub: "Semua program diawali konsultasi kebutuhan dan free trial class.",
    list: ["business", "private", "exam"] as Program["id"][],
    extra: "",
  },
  from: "Mulai dari",
  free: { kids: "Tes penempatan gratis", adult: "Free trial class" },
};

/* ------------------------------------------------------------------ */
/* Section ajakan free trial class       (sekaligus "cara mulai")      */
/* ------------------------------------------------------------------ */

/** Foto stok HD sementara (Unsplash). TODO: ganti dengan foto kelas asli resolusi tinggi. */
export const STOCK = {
  kidsTrial: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=2400&q=80",
  adultTrial: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=2400&q=80",
};

export const trialContent: Record<
  Audience,
  {
    title: string;
    sub: string;
    steps: string[];
    perks: string[];
    photo: string;
    cta: { label: string; href: string };
    note: string;
  }
> = {
  kids: {
    title: "Coba dulu, gratis.",
    sub: "Ajak si kecil ikut satu kelas bersama kami. Ayah dan Bunda bisa melihat langsung suasananya sebelum memutuskan.",
    steps: ["Tes penempatan", "Trial class", "Mulai belajar"],
    perks: ["Gratis", "Tanpa komitmen", "Guru bersertifikat", "Native speaker"],
    photo: STOCK.kidsTrial,
    cta: { label: "Daftar free trial class", href: wa("Halo English Now, saya ingin mendaftarkan anak saya untuk free trial class.") },
    note: "Gratis, tanpa komitmen. Langsung terhubung ke admin kami via WhatsApp.",
  },
  adult: {
    title: "Coba dulu, gratis.",
    sub: "Untuk tim maupun pribadi. Ceritakan kebutuhan Anda, lalu ikuti satu trial class gratis sebelum memutuskan.",
    steps: ["Konsultasi kebutuhan", "Trial class", "Program dimulai"],
    perks: ["Gratis", "Tanpa komitmen", "Sesuai kebutuhan", "Jadwal fleksibel"],
    photo: STOCK.adultTrial,
    cta: { label: "Jadwalkan free trial class", href: wa("Halo English Now, saya ingin menjadwalkan free trial class untuk kelas dewasa/bisnis.") },
    note: "Gratis, tanpa komitmen. Langsung terhubung ke tim kami via WhatsApp.",
  },
};

/* ------------------------------------------------------------------ */
/* Section Testimoni                                                   */
/* ------------------------------------------------------------------ */

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  program: string;
  /** kutipan pendek yang ditonjolkan (diambil dari testimoni aslinya) */
  quote: string;
  /** testimoni lengkap, tampil saat "Baca cerita lengkap" diklik */
  full: string;
  photo: string;
  /** true = CONTOH, bukan testimoni asli. Wajib diganti sebelum website tayang. */
  sample?: boolean;
}

const stock = (id: string) => `https://images.unsplash.com/${id}?w=1400&q=80&fit=crop`;

const T: Record<string, Testimonial> = {
  bunda: {
    id: "bunda",
    name: "Bunda Faqih & Filia",
    role: "Orang tua siswa",
    program: "Kids & Teens Class",
    quote: "Belajar bahasa Inggris jadi seru!",
    full: "English Now menjadi solusi terbaik bagi anak-anak saya, Faqih (10) dan Filia (15). Pengajarnya kompeten, memahami metode yang efektif untuk anak dan remaja, serta mampu menyesuaikan pembelajaran dengan kebutuhan siswa. Kelasnya nyaman, interaktif, dan menyenangkan. Terima kasih English Now, belajar bahasa Inggris jadi seru!",
    photo: "/testimonials/bunda.jpg",
  },
  mikayla: {
    id: "mikayla",
    name: "Mikayla Khairansaafia",
    role: "Siswa SMPN 44 Bandung",
    program: "Teens Class",
    quote: "We get to play many games while learning.",
    full: "I would like to share my experience studying at English Now. When the teacher explains in class, it's very easy to understand. For me, the class is so much fun because we get to play many games while learning. That's why I feel very happy and excited to study at English Now every Thursday. That's all from me, thank you 🤍",
    photo: "/testimonials/mikayla.jpg",
  },
  faheem: {
    id: "faheem",
    name: "Faheem Ahmad",
    role: "Siswa SMA Alfa Centauri",
    program: "IELTS Preparation",
    quote: "I can see a positive result in my IELTS test.",
    full: "Joining English Now has really helped me improve my English. I've gained a lot of new knowledge about how to make my writing well received, how to examine texts, and how to make my grammar and vocabulary range even wider. The lessons are very clear and enjoyable, which makes learning easier. I'm truly grateful for the guidance from the teacher, and I can see a positive result through my IELTS test.",
    photo: "/testimonials/faheem.jpg",
  },
  fikri: {
    id: "fikri",
    name: "Fikri M. R.",
    role: "Dosen Telkom University",
    program: "Business English Workshop",
    quote: "I thought it would be very serious. It turned out to be so much fun.",
    full: "Thank you English Now! At first, I thought the workshop would be very serious, but it turned out to be so much fun and engaging. We connected well with each other, and I learned many new things about teaching and pedagogy that I hadn't learned before. It was an excellent and valuable experience.",
    photo: "/testimonials/fikri.jpg",
  },
};

/**
 * TESTIMONI CONTOH (sample: true): nama, isi, dan foto stok BUKAN orang sungguhan.
 * Hanya untuk melihat tata letak. Ganti dengan testimoni asli sebelum website tayang.
 * Saat dev, kartunya diberi label "Contoh" supaya tidak terlewat.
 */
const SAMPLE: Record<string, Testimonial> = {
  parent2: {
    id: "parent2",
    name: "Ayah Rafa",
    role: "Orang tua siswa",
    program: "Kids Class",
    quote: "Sekarang Rafa berani menyapa dalam bahasa Inggris.",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari orang tua siswa.",
    photo: stock("photo-1511895426328-dc8714191300"),
    sample: true,
  },
  student2: {
    id: "student2",
    name: "Nayla",
    role: "Siswa SD",
    program: "Kids Class",
    quote: "My teacher is so kind and funny!",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari siswa.",
    photo: stock("photo-1503454537195-1dcabb73ffb9"),
    sample: true,
  },
  hr: {
    id: "hr",
    name: "Rina S.",
    role: "HR Manager",
    program: "Business Class",
    quote: "Materinya benar-benar disesuaikan dengan pekerjaan tim kami.",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari peserta business class.",
    photo: stock("photo-1573496359142-b8d87734a5a2"),
    sample: true,
  },
};

export const testimonialContent: Record<Audience, { title: string; sub: string; list: Testimonial[] }> = {
  kids: {
    title: "Kata mereka tentang English Now.",
    sub: "Cerita dari orang tua dan siswa kami.",
    list: [T.bunda, T.mikayla, SAMPLE.parent2, T.faheem, SAMPLE.student2],
  },
  adult: {
    title: "Kata mereka tentang English Now.",
    sub: "Dari dosen, profesional, hingga peserta persiapan IELTS.",
    list: [T.fikri, SAMPLE.hr, T.faheem],
  },
};

/**
 * Logo institusi untuk "Dipercaya oleh" (hanya di mode Dewasa).
 * TODO: baru 6 dari ±11 logo (dipotong dari website lama). Tambahkan file
 * logo resolusi tinggi (PNG transparan/SVG) ke /public/logos lalu daftarkan di sini.
 */
export const LOGOS = [
  { src: "/logos/logo-1.png", name: "SSC" },
  { src: "/logos/logo-2.png", name: "UIN Sunan Gunung Djati Bandung" },
  { src: "/logos/logo-3.png", name: "HME FPTK UPI" },
  { src: "/logos/logo-4.png", name: "Telkom University" },
  { src: "/logos/logo-5.png", name: "KAI" },
  { src: "/logos/logo-6.png", name: "SD Alfa Centauri" },
];

/* ------------------------------------------------------------------ */
/* Section Galeri                                                      */
/* ------------------------------------------------------------------ */

const g = (id: string) => `https://images.unsplash.com/${id}?w=700&q=75&fit=crop`;

/**
 * Foto galeri: campuran foto kelas asli (dari website lama) + foto stok sementara.
 * TODO: ganti semua dengan foto kegiatan kelas asli.
 */
export const galleryContent: Record<Audience, { title: string; sub: string; photos: string[] }> = {
  kids: {
    title: "Serunya kelas kami.",
    sub: "",
    photos: [
      "/programs/kids.jpg", g("photo-1503676260728-1c00da094a0b"), "/why/practice.jpg", g("photo-1509062522246-3755977927d7"),
      "/programs/teens.jpg", g("photo-1544717305-2782549b5136"), "/why/native.jpg", g("photo-1577896851231-70ef18881754"),
      "/testimonials/bunda.jpg", g("photo-1546410531-bb4caa6b424d"), "/programs/private.jpg", g("photo-1588072432836-e10032774350"),
      "/testimonials/mikayla.jpg", g("photo-1497633762265-9d179a990aa6"),
    ],
  },
  adult: {
    title: "Suasana kelas kami.",
    sub: "",
    photos: [
      "/programs/business.jpg", g("photo-1552664730-d307ca884978"), "/programs/exam.jpg", g("photo-1517245386807-bb43f82c33c4"),
      "/testimonials/fikri.jpg", g("photo-1531482615713-2afd69097998"), "/why/teachers.jpg", g("photo-1524178232363-1fb2b075b655"),
      "/programs/private.jpg", g("photo-1522202176988-66273c2fd55f"), "/testimonials/faheem.jpg", g("photo-1556761175-5973dc0f32e7"),
      g("photo-1600880292203-757bb62b4baf"), g("photo-1523240795612-9a054b0db644"),
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Section FAQ                                                         */
/* ------------------------------------------------------------------ */

export const faqContent: Record<Audience, { title: string; sub: string; items: { q: string; a: string }[]; ask: string }> = {
  kids: {
    title: "Pertanyaan yang sering ditanyakan.",
    sub: "Belum menemukan jawabannya? Tanyakan langsung ke admin kami.",
    ask: wa("Halo English Now, saya punya pertanyaan tentang kelas anak."),
    items: [
      { q: "Apakah ada free trial class?", a: "Ya, tersedia 1x trial class gratis agar anak dapat merasakan pengalaman belajar sebelum mendaftar." },
      { q: "Mulai usia berapa anak bisa ikut kelas?", a: "Kids Class untuk usia 6–12 tahun (SD kelas 1–6), dan Teens Class untuk usia 12–19 tahun (SMP–SMA)." },
      { q: "Berapa jumlah siswa dalam satu kelas?", a: "Satu kelas berisi 8–15 siswa, supaya setiap anak tetap mendapat kesempatan berbicara." },
      { q: "Apakah ada laporan dan sertifikat?", a: "Ya, laporan akhir dan sertifikat diberikan setelah siswa menyelesaikan program pembelajaran." },
      { q: "Apakah bisa mendaftar di pertengahan semester?", a: "Siswa tetap dapat mengikuti kelas selama tertinggal kurang dari 6 pertemuan. Jika lebih, kami sarankan mendaftar di semester berikutnya." },
      { q: "Apakah tersedia les privat?", a: "Bisa. Private class terbuka untuk semua usia dan tingkat kemampuan, secara online maupun tatap muka." },
    ],
  },
  adult: {
    title: "Pertanyaan yang sering ditanyakan.",
    sub: "Belum menemukan jawabannya? Tanyakan langsung ke tim kami.",
    ask: wa("Halo English Now, saya punya pertanyaan tentang kelas dewasa/bisnis."),
    items: [
      { q: "Apakah ada free trial class?", a: "Ya, tersedia 1x trial class gratis agar Anda atau tim dapat merasakan pengalaman belajar sebelum mendaftar." },
      { q: "Apa materi & kurikulum untuk Business Class?", a: "Materi disesuaikan dengan kebutuhan perusahaan, mulai dari business communication, presentation skills, hingga meeting & discussion. Sebelum program dimulai, kami melakukan diskusi kebutuhan untuk menyesuaikan materi, target pembelajaran, dan metode pelatihan." },
      { q: "Bagaimana jadwal dan lokasi Business Class?", a: "Jumlah pertemuan dan jadwal fleksibel mengikuti perusahaan. Pengajar kami datang langsung ke kantor Anda." },
      { q: "Apakah tersedia les privat untuk dewasa?", a: "Bisa. Private class terbuka untuk semua usia dan tingkat kemampuan, mulai dari pelajar hingga profesional, secara online maupun tatap muka." },
      { q: "Apakah ada persiapan IELTS atau TOEFL?", a: "Ada. Exam Class membahas strategi setiap bagian tes, dilengkapi pre-test gratis serta progress & mock final test." },
      { q: "Apakah ada laporan dan sertifikat?", a: "Ya, laporan capaian belajar dan sertifikat diberikan setelah peserta menyelesaikan program." },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

/** TODO: isi data kontak & media sosial asli */
export const CONTACT = {
  address: "Jl. Contoh No. 123, Bandung",
  hours: "Senin–Sabtu, 09.00–18.00",
  email: "halo@englishnow.id",
  social: [
    { name: "Instagram", href: "https://instagram.com/" },
    { name: "TikTok", href: "https://tiktok.com/" },
    { name: "YouTube", href: "https://youtube.com/" },
    { name: "LinkedIn", href: "https://linkedin.com/" },
  ],
};

export const footerContent = {
  blurb: "Kursus bahasa Inggris untuk anak, remaja, dewasa, dan perusahaan. Pengajar bersertifikat Cambridge, native speaker, dan kelas yang menyenangkan.",
  columns: [
    {
      title: "Program",
      links: [
        { label: "Kids Class", href: "#biaya" },
        { label: "Teens Class", href: "#biaya" },
        { label: "Private Class", href: "#biaya" },
        { label: "Exam Class", href: "#biaya" },
        { label: "Business Class", href: "#biaya" },
      ],
    },
    {
      title: "Jelajahi",
      links: [
        { label: "Kenapa English Now", href: "#kenapa" },
        { label: "Pengajar", href: "#pengajar" },
        { label: "Testimoni", href: "#testimoni" },
        { label: "Galeri", href: "#galeri" },
        { label: "FAQ", href: "#faq" },
      ],
    },
  ],
};
