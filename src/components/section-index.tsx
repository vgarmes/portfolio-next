import Aside from "@/components/aside";
import { getPosts, sections, type SectionKey } from "@/lib/data";
import { formatDate } from "@/lib/date";
import { Undo2 } from "lucide-react";
import Link from "next/link";

/** The full list of a section's posts, e.g. /writing or /craft. */
export const SectionIndex: React.FC<{ section: SectionKey }> = ({
  section,
}) => {
  const posts = getPosts(section);

  return (
    <article>
      <Aside>
        <Link
          href="/"
          className="flex items-center gap-1 py-1 text-sm leading-tight"
        >
          <Undo2 className="size-4" />
          Index
        </Link>
      </Aside>
      <header>
        <h1 className="scroll-mt-16 font-medium">{sections[section].title}</h1>
      </header>

      <div className="mt-12 divide-y border-y hover:[&>a]:not-hover:opacity-40">
        {posts.map((post) => (
          <Link
            key={post.url}
            tabIndex={0}
            className="flex items-center justify-between gap-4 py-3 transition-opacity hover:opacity-100 hover:transition-none focus:!opacity-100 focus:transition-none"
            href={post.url}
          >
            <p className="truncate">{post.data.title}</p>

            <time
              className="text-muted-foreground text-sm whitespace-nowrap"
              dateTime={post.data.date.toISOString()}
            >
              {formatDate(post.data.date)}
            </time>
          </Link>
        ))}
      </div>
    </article>
  );
};
