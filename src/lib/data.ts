import { cache } from "react";
import { source } from "./source";

// getPost will be used twice, but execute only once
export const getPost = cache((slug: string[] | undefined) => {
  const res = source.getPage(slug);
  return res;
});
