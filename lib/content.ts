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
export const WA_NUMBER = "6282126292501";
export const wa = (message: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
/** sapaan baku untuk semua pesan WhatsApp (mengikuti website lama) */
export const HI = "Halo Admin English Now,";

/**
 * Link formulir registrasi untuk siswa sekolah (SD–SMP–SMA), sama seperti website lama.
 * TODO: isi dengan URL formulir registrasi yang dipakai sekarang.
 * Selama masih kosong, tombol "Daftar" untuk Kids/Teens diarahkan ke WhatsApp.
 */
export const REGISTER_URL = "";

export const CTA = {
  /** Free trial class membuka pop-up formulir (lihat components/trial-modal.tsx). href = cadangan. */
  trial: { label: "Free Trial Class", href: wa(`${HI} saya ingin mencoba ikut free trial class.`) },
  consult: { label: "Konsultasi gratis", href: wa(`${HI} saya ingin konsultasi gratis mengenai program kelas bahasa Inggris.`) },
  /** tes level online di website English Now */
  level: {
    kids: "https://englishnow.co.id/level-check-kids/",
    adult: "https://englishnow.co.id/level-check/",
  },
};

/** konsultasi gratis untuk program tertentu */
export const consultHref = (program: string) => wa(`${HI} saya ingin konsultasi gratis mengenai program ${program}.`);

/**
 * Tombol daftar per program:
 *  - Kids & Teens (siswa sekolah SD–SMP–SMA) → formulir registrasi.
 *  - Private, Exam (dewasa), Business → WhatsApp.
 */
export const registerFor = (id: string, name: string) => {
  const school = id === "kids" || id === "teens";
  if (school && REGISTER_URL) return { label: "Daftar sekarang", href: REGISTER_URL };
  return {
    label: school ? "Daftar sekarang" : "Daftar via WhatsApp",
    href: wa(`${HI} saya ingin mendaftar ${name}.`),
  };
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
/**
 * Hero mengikuti StoryBrand: janji (title), EMPATI (sub: kami paham masalahnya), dan
 * OTORITAS (authority: bukti kompetensi di bidang bahasa Inggris).
 */
export const heroContent: Record<Audience, { title: string; sub: string; authority: string[] }> = {
  kids: {
    title: "Bekal anak untuk dunia yang lebih luas.",
    sub: "Anak hafal kosakata, tapi diam saat diajak bicara? Kami paham. Di sini anak dilatih berbicara sedikit demi sedikit, sampai berani.",
    authority: ["Pengajar bersertifikat CELTA & DELTA", "Native speaker", "Kurikulum Cambridge"],
  },
  adult: {
    title: "Satu bahasa, lebih banyak peluang.",
    sub: "Paham bacaannya, tapi kaku saat rapat, presentasi, atau wawancara? Kami paham. Kelas disusun dari situasi kerja yang Anda hadapi.",
    authority: ["Pengajar bersertifikat CELTA & DELTA", "Standar CEFR A1–C2", "Persiapan IELTS · TOEFL · Cambridge"],
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

/**
 * Level CEFR. Deskripsi Dewasa diringkas dari skala global CEFR (Council of Europe, Table 1 CEFR 3.3),
 * deskripsi Anak disederhanakan dari sumber yang sama.
 */
export const LEVELS = [
  {
    code: "A1",
    name: "Pemula",
    kids: "Memakai ungkapan sehari-hari yang sangat dasar dan memperkenalkan diri.",
    adult: "Memahami dan memakai ungkapan sehari-hari yang sangat dasar, memperkenalkan diri, dan menjawab pertanyaan pribadi sederhana, asalkan lawan bicara berbicara pelan dan jelas.",
    chat: ["Where do you live?", "I live in Bandung. I work in a bank.", "Do you like your job?"] as [string, string, string],
  },
  {
    code: "A2",
    name: "Dasar",
    kids: "Bertukar informasi sederhana tentang diri sendiri, keluarga, dan sekitar.",
    adult: "Bertukar informasi sederhana dalam situasi rutin, misalnya soal pekerjaan, belanja, atau lingkungan sekitar, dan menceritakan latar belakang diri secara sederhana.",
    chat: ["How do you get to work?", "By motorbike. It takes about twenty minutes.", "Do you prefer a motorbike or a car? Why?"] as [string, string, string],
  },
  {
    code: "B1",
    name: "Menengah",
    kids: "Memahami poin utama topik yang familiar dan menceritakan pengalaman.",
    adult: "Memahami poin utama topik yang familiar di pekerjaan atau waktu luang, menghadapi sebagian besar situasi saat bepergian, dan memberi alasan singkat untuk pendapat dan rencana.",
    chat: ["Tell me about a trip you enjoyed.", "Last year I went to Bali for work, and I visited the beach too.", "What did you like most about it?"] as [string, string, string],
  },
  {
    code: "B2",
    name: "Menengah atas",
    kids: "Berdiskusi cukup lancar dan menjelaskan sudut pandang.",
    adult: "Memahami ide utama teks yang kompleks, termasuk diskusi teknis di bidang sendiri, dan berinteraksi dengan penutur asli cukup lancar tanpa menyulitkan kedua pihak.",
    chat: ["Which would help the team more, training or new software?", "Training, I'd say. Software only helps if people know how to use it.", "Fair point. Shall we go with training, then?"] as [string, string, string],
  },
  {
    code: "C1",
    name: "Mahir",
    kids: "Memakai bahasa secara luwes untuk keperluan sosial dan akademik.",
    adult: "Memahami teks panjang yang menuntut beserta makna tersiratnya, dan memakai bahasa secara luwes dan efektif untuk keperluan sosial, akademik, dan profesional.",
    chat: ["How has remote work changed teamwork?", "It's made us more flexible, though spontaneous ideas arguably happen less often.", "How could companies make up for that?"] as [string, string, string],
  },
  {
    code: "C2",
    name: "Sangat mahir",
    kids: "Memahami hampir semua yang didengar atau dibaca dengan mudah.",
    adult: "Memahami hampir semua yang didengar atau dibaca dengan mudah, dan mengekspresikan diri secara spontan, sangat lancar, dan tepat, bahkan dalam situasi yang kompleks.",
    chat: ["Some say technology makes us less patient. What's your view?", "There's some truth in it, yet I'd argue it has reshaped patience rather than eroded it.", "That's a subtle distinction."] as [string, string, string],
  },
];

/**
 * Jenjang Cambridge English Qualifications untuk anak & remaja (peta petualangan versi Anak).
 * Deskripsi mengikuti penjelasan resmi Cambridge English untuk tiap ujian
 * (Starters/Movers/Flyers, A2 Key, B1 Preliminary, B2 First).
 */
export const KIDS_LEVELS = [
  { code: "Pre A1", name: "Starters", body: "Mengenal bahasa Inggris lisan dan tulisan sehari-hari, misalnya mengeja nama dan menyebutkan usia.", chat: ["How old are you?", "I'm seven.", "What's your favourite animal?"] as [string, string, string] },
  { code: "A1", name: "Movers", body: "Mulai bercakap sederhana, misalnya menjawab pertanyaan tentang kegiatan sehari-hari.", chat: ["Who do you play with at school?", "My friend Rafi. We play football.", "What do you have for lunch?"] as [string, string, string] },
  { code: "A2", name: "Flyers", body: "Menyusun dan merangkai kalimat, misalnya bercerita tentang pengalaman yang sudah lewat.", chat: ["What did you do last weekend?", "I went to the park with my family and we had a picnic.", "Tell me about your best friend."] as [string, string, string] },
  { code: "A2", name: "Key", body: "Berkomunikasi dalam situasi sederhana: memahami tulisan sederhana, memperkenalkan diri, dan menjawab pertanyaan dasar.", chat: ["How often do you see your friends?", "Every day at school, and on Sundays we ride our bikes.", "What's your favourite room at home? Why?"] as [string, string, string] },
  { code: "B1", name: "Preliminary", body: "Bahasa Inggris praktis sehari-hari: memahami bacaan sederhana dan menulis email tentang topik rutin.", chat: ["Do you prefer studying alone or with friends?", "With friends, because we can help each other.", "Why do you think that helps?"] as [string, string, string] },
  { code: "B2", name: "First", body: "Mengikuti percakapan berbagai topik, menyampaikan pendapat beserta alasannya, dan membaca media dengan pemahaman yang baik.", chat: ["Which of these ideas would help students most?", "I'd say a study club, although a reading corner is useful too.", "So, shall we choose the study club?"] as [string, string, string] },
];

/**
 * Sumber deskripsi level, ditampilkan kecil di bawah simulasi level.
 * Contoh percakapan (field `chat`) ditulis sendiri mengikuti jenis tugas & topik tes Speaking Cambridge:
 *  - Starters/Movers/Flyers: Part 4 pertanyaan pribadi (umur, hal favorit, sekolah, teman, akhir pekan lalu)
 *    — Cambridge English Young Learners Handbook.
 *  - A2 Key: Part 1 wawancara topik teman & rumah — A2 Key Handbook.
 *  - B1 Preliminary: Part 4 suka/tidak suka, pengalaman, pendapat — format ujian B1 Preliminary.
 *  - B2 First: Part 3 diskusi pilihan & mengambil keputusan bersama — format ujian B2 First.
 *  - Dewasa C1–C2: tingkat kerumitan mengikuti skala global CEFR.
 * Kalimatnya bukan kutipan soal ujian asli.
 */
export const LEVEL_SOURCE = {
  kids: "Mengacu pada Cambridge English Qualifications & CEFR · contoh percakapan mengikuti format tes Speaking Cambridge",
  adult: "Mengacu pada skala global CEFR (Council of Europe) · contoh percakapan mengikuti format tes Speaking Cambridge",
};

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
  /** hasil tes kemampuan bahasa Inggris, mis. "IELTS 7.5" atau "Cambridge C1" */
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
  { name: "Miss Anisa", certs: ["CELTA"], score: "IELTS 7.5", photo: u("photo-1494790108377-be9c29b29330") },
  { name: "Mr. Daniel", certs: ["CELTA", "DELTA"], native: "UK", photo: u("photo-1507003211169-0a1dd7228f2d") },
  { name: "Miss Clara", certs: ["TKT"], score: "Cambridge C1", photo: u("photo-1438761681033-6461ffad8d80") },
  { name: "Mr. Bayu", certs: ["CELTA"], score: "IELTS 7.5", photo: u("photo-1500648767791-00dcc994a43e") },
  { name: "Miss Gita", certs: ["TKT"], score: "Cambridge C1", photo: u("photo-1544005313-94ddf0286df2") },
  { name: "Mr. Hendra", certs: ["CELTA", "TKT"], score: "IELTS 7.5", photo: u("photo-1472099645785-5658abf4ff4e") },
  { name: "Miss Intan", certs: ["CELTA"], score: "Cambridge C1", photo: u("photo-1534528741775-53994a69daeb") },
  { name: "Mr. James", certs: ["CELTA"], native: "Australia", photo: u("photo-1506794778202-cad84cf45f1d") },
  { name: "Miss Kirana", certs: ["TKT"], score: "IELTS 7.5", photo: u("photo-1580489944761-15a19d654956") },
  { name: "Mr. Lukas", certs: ["DELTA"], score: "Cambridge C1", photo: u("photo-1599566150163-29194dcaad36") },
  { name: "Miss Maya", certs: ["CELTA"], score: "IELTS 7.5", photo: u("photo-1573496359142-b8d87734a5a2") },
  { name: "Mr. Nanda", certs: ["TKT"], score: "Cambridge C1", photo: u("photo-1519085360753-af0119f7cbe7") },
  { name: "Miss Olivia", certs: ["CELTA", "TKT"], score: "IELTS 7.5", photo: u("photo-1531123897727-8f129e1688ce") },
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

/**
 * Business Class: harga tidak ditonjolkan di depan. Alurnya: ngobrol dulu, penawaran, baru estimasi biaya.
 * TODO: isi diskon & syarat/periode yang sebenarnya. Selama "XX%" masih ada, itu hanya penanda slot.
 */
export const BUSINESS_OFFER = {
  tag: "Penawaran untuk tim",
  title: "Mulai dari obrolan tentang kebutuhan tim Anda.",
  sub: "Ceritakan tantangan komunikasi tim, kami susun silabusnya. Soal biaya, kita bahas setelah Anda melihat rencananya.",
  perks: [
    { label: "Konsultasi kebutuhan", badge: "Gratis" },
    { label: "Free trial class untuk tim", badge: "Gratis" },
    // TODO: ganti dengan diskon sungguhan (persen, periode, syarat)
    { label: "Diskon pendaftaran periode ini", badge: "XX%" },
  ],
  priceLink: "Lihat estimasi biaya",
  priceNote: "Estimasi saja. Biaya final mengikuti kebutuhan, jumlah peserta, dan diskon yang berlaku.",
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
    cta: { label: "Daftar free trial class", href: wa(`${HI} saya ingin mendaftarkan anak saya untuk free trial class.`) },
    note: "Gratis, tanpa komitmen. Isi data singkat, admin kami akan menghubungi via WhatsApp.",
  },
  adult: {
    title: "Coba dulu, gratis.",
    sub: "Untuk tim maupun pribadi. Ceritakan kebutuhan Anda, lalu ikuti satu trial class gratis sebelum memutuskan.",
    steps: ["Konsultasi kebutuhan", "Trial class", "Program dimulai"],
    perks: ["Gratis", "Tanpa komitmen", "Sesuai kebutuhan", "Jadwal fleksibel"],
    photo: STOCK.adultTrial,
    cta: { label: "Daftar free trial class", href: wa(`${HI} saya ingin mencoba ikut free trial class untuk kelas dewasa/bisnis.`) },
    note: "Gratis, tanpa komitmen. Isi data singkat, tim kami akan menghubungi via WhatsApp.",
  },
};

/* ------------------------------------------------------------------ */
/* Section Testimoni                                                   */
/* ------------------------------------------------------------------ */

/**
 * Standar testimoni (semua kartu memakai format yang sama, supaya cepat dibaca & bisa disaring):
 *  1. aspect  = hal yang dipuji (pilih salah satu dari ASPECTS), jadi kelihatan bagian mana yang bagus
 *  2. quote   = satu kalimat langsung ke inti (±15 kata)
 *  3. name, role, org = siapa & dari perusahaan/instansi/sekolah mana
 *  4. program = kelas yang diikuti
 */
export const ASPECTS = ["Pengajar", "Materi", "Suasana kelas", "Hasil"] as const;
export type Aspect = (typeof ASPECTS)[number];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  /** perusahaan / instansi / sekolah */
  org?: string;
  aspect: Aspect;
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
    aspect: "Pengajar",
    program: "Kids & Teens Class",
    quote: "Belajar bahasa Inggris jadi seru!",
    full: "English Now menjadi solusi terbaik bagi anak-anak saya, Faqih (10) dan Filia (15). Pengajarnya kompeten, memahami metode yang efektif untuk anak dan remaja, serta mampu menyesuaikan pembelajaran dengan kebutuhan siswa. Kelasnya nyaman, interaktif, dan menyenangkan. Terima kasih English Now, belajar bahasa Inggris jadi seru!",
    photo: "/testimonials/bunda.jpg",
  },
  mikayla: {
    id: "mikayla",
    name: "Mikayla Khairansaafia",
    role: "Siswa",
    org: "SMPN 44 Bandung",
    aspect: "Suasana kelas",
    program: "Teens Class",
    quote: "We get to play many games while learning.",
    full: "I would like to share my experience studying at English Now. When the teacher explains in class, it's very easy to understand. For me, the class is so much fun because we get to play many games while learning. That's why I feel very happy and excited to study at English Now every Thursday. That's all from me, thank you 🤍",
    photo: "/testimonials/mikayla.jpg",
  },
  faheem: {
    id: "faheem",
    name: "Faheem Ahmad",
    role: "Siswa",
    org: "SMA Alfa Centauri",
    aspect: "Hasil",
    program: "IELTS Preparation",
    quote: "I can see a positive result in my IELTS test.",
    full: "Joining English Now has really helped me improve my English. I've gained a lot of new knowledge about how to make my writing well received, how to examine texts, and how to make my grammar and vocabulary range even wider. The lessons are very clear and enjoyable, which makes learning easier. I'm truly grateful for the guidance from the teacher, and I can see a positive result through my IELTS test.",
    photo: "/testimonials/faheem.jpg",
  },
  fikri: {
    id: "fikri",
    name: "Fikri M. R.",
    role: "Dosen",
    org: "Telkom University",
    aspect: "Suasana kelas",
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
    aspect: "Hasil",
    program: "Kids Class",
    quote: "Sekarang Rafa berani menyapa dalam bahasa Inggris.",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari orang tua siswa.",
    photo: stock("photo-1511895426328-dc8714191300"),
    sample: true,
  },
  student2: {
    id: "student2",
    name: "Nayla",
    role: "Siswa",
    org: "SD Contoh Bandung",
    aspect: "Pengajar",
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
    org: "PT Contoh Manufaktur",
    aspect: "Materi",
    program: "Business Class",
    quote: "Materinya disesuaikan dengan pekerjaan tim kami.",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari peserta business class.",
    photo: stock("photo-1573496359142-b8d87734a5a2"),
    sample: true,
  },
  logistik: {
    id: "logistik",
    name: "Dimas P.",
    role: "Manajer Operasional",
    org: "PT Contoh Logistik",
    aspect: "Materi",
    program: "Business Class",
    quote: "Langsung terpakai untuk rapat dan email dengan mitra luar negeri.",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari peserta business class.",
    photo: stock("photo-1560250097-0b93528c311a"),
    sample: true,
  },
  energi: {
    id: "energi",
    name: "Budi A.",
    role: "Engineer",
    org: "PT Contoh Energi",
    aspect: "Hasil",
    program: "Exam Class (IELTS)",
    quote: "Strategi tiap bagian tes jelas, jadi latihan saya terarah.",
    full: "CONTOH TESTIMONI. Ganti dengan testimoni asli dari peserta exam class.",
    photo: stock("photo-1519085360753-af0119f7cbe7"),
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
    sub: "Dari dosen dan profesional perusahaan hingga peserta persiapan IELTS.",
    list: [T.fikri, SAMPLE.hr, SAMPLE.logistik, T.faheem, SAMPLE.energi],
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
  // TODO: 6 logo contoh di bawah ini diganti logo institusi asli (file PNG/SVG di /public/logos)
  { src: "", name: "Contoh Perusahaan A", dummy: true },
  { src: "", name: "Contoh Instansi B", dummy: true },
  { src: "", name: "Contoh Kampus C", dummy: true },
  { src: "", name: "Contoh Sekolah D", dummy: true },
  { src: "", name: "Contoh Komunitas E", dummy: true },
  { src: "", name: "Contoh Perusahaan F", dummy: true },
] as { src: string; name: string; dummy?: boolean }[];

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
    ask: wa(`${HI} saya ingin bertanya tentang kelas anak.`),
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
    ask: wa(`${HI} saya ingin bertanya tentang kelas dewasa/bisnis.`),
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
  address: "Jl. Terate No.12, Samoja, Kec. Batununggal, Kota Bandung, Jawa Barat 40273",
  addressShort: "Jl. Terate No.12, Samoja, Bandung",
  hours: "Senin–Jumat, 09.00–17.00",
  mapsUrl: "https://maps.app.goo.gl/PWGThfjpTqybYuvY6",
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
        { label: "Lokasi", href: "#lokasi" },
        { label: "FAQ", href: "#faq" },
      ],
    },
  ],
};
