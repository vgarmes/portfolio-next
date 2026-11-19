import { craft, posts } from "fumadocs-mdx:collections/server";
import { loader } from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";

export const writingSource = loader({
  baseUrl: "/writing",
  source: toFumadocsSource(posts, []),
});

export const craftSource = loader({
  baseUrl: "/craft",
  source: toFumadocsSource(craft, []),
});
