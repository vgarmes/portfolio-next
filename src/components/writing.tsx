import { getPosts } from "@/lib/data";
import { formatDate } from "@/lib/date";
import { ArrowUpRight } from "lucide-react";
import { Link } from "./link";
import NextLink from "next/link";

export const Writing: React.FC = () => {
  const posts = getPosts();

  return (
    <section className="mt-16 space-y-5 sm:mt-32 sm:space-y-6">
      <h3 className="font-medium">Writing</h3>
      <ul className="flex flex-col gap-7 sm:gap-4">
        {posts.slice(0, 5).map((post) => (
          <li key={post.url}>
            <NextLink
              href={post.url}
              className="hover:bg-muted hover:text-foreground dark:hover:bg-input/30 -mx-3 flex gap-1 rounded-md px-3 sm:py-3 md:grid md:grid-cols-[1fr_140px] md:gap-4"
            >
              <div className="flex flex-col">
                <span>{post.data.title}</span>
                <span className="text-muted-foreground">
                  {post.data.description}
                </span>
              </div>
              <time
                className="text-muted-foreground hidden text-right text-sm leading-6 md:block"
                dateTime={post.data.date.toISOString()}
              >
                {formatDate(post.data.date)}
              </time>
            </NextLink>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Link href="/writing">All writing</Link>
        <span className="text-muted-foreground text-sm">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </section>
  );
};
