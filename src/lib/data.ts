import { cache } from "react";
import { craftSource, writingSource } from "./source";

/** The post collections on the site, each with its own index and URL prefix. */
export const sections = {
  writing: { title: "Writing", href: "/writing", source: writingSource },
  craft: { title: "Craft", href: "/craft", source: craftSource },
} as const;

export type SectionKey = keyof typeof sections;

export const getPost = cache((section: SectionKey, slug: string) =>
  sections[section].source.getPage([slug]),
);

export const getPosts = cache((section: SectionKey) =>
  sections[section].source
    .getPages()
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
);
