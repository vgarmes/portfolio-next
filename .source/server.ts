// @ts-nocheck
import * as __fd_glob_0 from "../src/content/writing/test.mdx?collection=posts"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const posts = await create.doc("posts", "src/content/writing", {"test.mdx": __fd_glob_0, });