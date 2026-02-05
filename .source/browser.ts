// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  posts: create.doc("posts", {"terminal-setup-2025.mdx": () => import("../src/content/writing/terminal-setup-2025.mdx?collection=posts"), "test.mdx": () => import("../src/content/writing/test.mdx?collection=posts"), }),
};
export default browserCollections;