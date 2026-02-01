// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  posts: create.doc("posts", {"test.mdx": () => import("../src/content/writing/test.mdx?collection=posts"), }),
};
export default browserCollections;