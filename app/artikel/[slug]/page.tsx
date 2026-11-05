import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/article/article-view";
import { ARTICLE_DOCS, getArticle } from "@/lib/articles";
import { articleContent } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLE_DOCS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  const url = `/artikel/${a.slug}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${a.title} | English Now`,
    description: a.deck,
    alternates: { canonical: url },
    // artikel contoh tidak boleh masuk mesin pencari; otomatis hilang saat sample dihapus
    robots: a.sample ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      siteName: "English Now",
      locale: "id_ID",
      title: a.title,
      description: a.deck,
      publishedTime: a.date,
      authors: [a.author.name],
      images: [{ url: a.cover, alt: a.title }],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.deck, images: [a.cover] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const doc = getArticle(slug);
  if (!doc) notFound();
  // bacaan lain: artikel dari daftar audiens yang sama (selain yang sedang dibuka)
  const related = articleContent[doc.audience].list
    .filter((a) => !a.href.endsWith(doc.slug))
    .slice(0, 3)
    .map((a) => ({ title: a.title, cover: a.cover, category: a.category, href: a.href }));

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: doc.title,
      description: doc.deck,
      image: [`${SITE_URL}${doc.cover}`],
      datePublished: doc.date,
      dateModified: doc.date,
      inLanguage: "id-ID",
      author: { "@type": "Organization", name: doc.author.name },
      publisher: { "@type": "Organization", name: "English Now", logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-mark.png` } },
      mainEntityOfPage: `${SITE_URL}/artikel/${doc.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Artikel", item: `${SITE_URL}/#artikel` },
        { "@type": "ListItem", position: 3, name: doc.title },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <ArticleView doc={doc} related={related} />
    </>
  );
}
