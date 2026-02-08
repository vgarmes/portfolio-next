import { cache } from "react";
import { source } from "./source";

export const getPost = cache((slug: string) => {
  const res = source.getPage([slug]);
  return res;
});

export const getPosts = cache(() => {
  return source.getPages().sort((a, b) => {
    const dateA = new Date(a.data.date);
    const dateB = new Date(b.data.date);

    return dateB.getTime() - dateA.getTime();
  });
});
