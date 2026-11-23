import { cache } from "react";
import { craftSource, writingSource } from "./source";

/** The post collections on the site, each with its own index and URL prefix. */
export const sections = {
  writing: { title: "Writing", href: "/writing", source: writingSource },
  craft: { title: "Craft", href: "/craft", source: craftSource },
} as const;

export type SectionKey = keyof typeof sections;

// Drafts are unlisted in production: their URL works and the page is labeled
// "Draft", but they are left out of every list. In development they are listed
// too, so they can be worked on.
const showDrafts = process.env.NODE_ENV === "development";
const isListed = (page: { data: { draft: boolean } }) =>
  showDrafts || !page.data.draft;

/** Any post by slug, drafts included. */
export const getPost = cache((section: SectionKey, slug: string) =>
  sections[section].source.getPage([slug]),
);

/** Every post with a page, drafts included, for static generation. */
export const getAllPosts = cache((section: SectionKey) =>
  sections[section].source.getPages(),
);

/** The posts shown in lists, newest first. */
export const getPosts = cache((section: SectionKey) =>
  getAllPosts(section)
    .filter(isListed)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
);
