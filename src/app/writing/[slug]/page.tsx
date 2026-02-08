import { notFound } from "next/navigation";
import { mdxComponents } from "@/mdx-components";
import ArticleHeader from "@/components/article-header";
import { Metadata } from "next";
import { getPost, getPosts } from "@/lib/data";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { TableOfContents } from "@/components/table-of-contents";
import { PostStats } from "@/components/post-stats";
import { BackTopButton } from "@/components/back-top-button";

export function generateStaticParams(): { slug: string }[] {
  return getPosts().map((post) => ({ slug: post.slugs[0] })); // because source.generateParams() can only be used with an optional catch-all route
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;

  // fetch post information
  const post = getPost(slug);
  return {
    title: post?.data.title,
  };
}

export default async function Page({ params }: Props) {
  const slug = (await params).slug;
  const page = getPost(slug);

  if (!page) {
    return notFound();
  }

  const Mdx = page.data.body;

  return (
    <article className="space-y-2">
      <aside className="static top-32 left-20 max-h-[calc(100vh-4rem)] flex-col gap-3 pb-8 xl:fixed xl:flex xl:pb-0">
        <Link
          href="/writing"
          className="flex items-center gap-1 py-1 text-sm leading-tight"
        >
          <Undo2 className="size-4" />
          Writing
        </Link>
        <div className="hidden xl:block">
          <TableOfContents toc={page.data.toc} />
        </div>
      </aside>
      <ArticleHeader title={page.data.title} date={page.data.date} />
      <div className="mt-12 flex-1 pb-6">
        <Mdx components={mdxComponents} />
      </div>
      <div className="flex items-center justify-between pt-4">
        <PostStats slug={slug} />
        <BackTopButton />
      </div>
    </article>
  );
}
