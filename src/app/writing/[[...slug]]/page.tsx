import { source } from "@/lib/source";
import { notFound } from "next/navigation";
import { mdxComponents } from "@/mdx-components";
import ArticleHeader from "@/components/article-header";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    return notFound();
  }

  const Mdx = page.data.body;
  return (
    <div className="space-y-2">
      <ArticleHeader title={page.data.title} date={page.data.date} />
      <Mdx components={mdxComponents} />
    </div>
  );
}
