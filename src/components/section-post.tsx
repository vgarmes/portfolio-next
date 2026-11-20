import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { mdxComponents } from "@/mdx-components";
import ArticleHeader from "@/components/article-header";
import { TableOfContents } from "@/components/table-of-contents";
import { BackTopButton } from "@/components/back-top-button";
import { getPost, getPosts, sections, type SectionKey } from "@/lib/data";

// source.generateParams() only works with an optional catch-all route.
export function postStaticParams(section: SectionKey): { slug: string }[] {
  return getPosts(section).map((post) => ({ slug: post.slugs[0] }));
}

export function postMetadata(section: SectionKey, slug: string): Metadata {
  return { title: getPost(section, slug)?.data.title };
}

/** A single post page, with a back link to its section's index. */
export const SectionPost: React.FC<{ section: SectionKey; slug: string }> = ({
  section,
  slug,
}) => {
  const page = getPost(section, slug);
  if (!page) notFound();

  const { title, href } = sections[section];
  const Mdx = page.data.body;

  return (
    <article className="space-y-2">
      <aside className="static top-32 left-20 max-h-[calc(100vh-4rem)] flex-col gap-3 pb-8 xl:fixed xl:flex xl:pb-0">
        <Link
          href={href}
          className="flex items-center gap-1 py-1 text-sm leading-tight"
        >
          <Undo2 className="size-4" />
          {title}
        </Link>
        <div className="hidden xl:block">
          <TableOfContents toc={page.data.toc} />
        </div>
      </aside>
      <ArticleHeader title={page.data.title} date={page.data.date} />
      <div className="mt-12 flex-1 pb-6">
        <Mdx components={mdxComponents} />
      </div>
      <div className="flex items-center justify-end pt-4">
        <BackTopButton />
      </div>
    </article>
  );
};
