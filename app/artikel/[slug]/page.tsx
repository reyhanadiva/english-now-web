import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/article/article-view";
import { ARTICLE_DOCS, getArticle } from "@/lib/articles";
import { articleContent } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLE_DOCS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return { title: `${a.title} | English Now`, description: a.deck };
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
  return <ArticleView doc={doc} related={related} />;
}
