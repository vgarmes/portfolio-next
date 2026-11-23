import { cache } from "react";
import { craftSource, writingSource } from "./source";

/** The post collections on the site, each with its own index and URL prefix. */
export const sections = {
  writing: { title: "Writing", href: "/writing", source: writingSource },
  craft: { title: "Craft", href: "/craft", source: craftSource },
} as const;

export type SectionKey = keyof typeof sections;

// Drafts are visible while developing and hidden everywhere in production:
// left out of every list, and their URL is a 404.
const showDrafts = process.env.NODE_ENV === "development";
const isPublic = (page: { data: { draft: boolean } }) =>
  showDrafts || !page.data.draft;

export const getPost = cache((section: SectionKey, slug: string) => {
  const page = sections[section].source.getPage([slug]);
  return page && isPublic(page) ? page : undefined;
});

export const getPosts = cache((section: SectionKey) =>
  sections[section].source
    .getPages()
    .filter(isPublic)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
);
