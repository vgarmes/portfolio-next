import {
  defineConfig,
  defineCollections,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import * as z from "zod";

export const posts = defineCollections({
  type: "doc",
  dir: "src/content/writing",
  // add required frontmatter properties
  schema: frontmatterSchema.extend({
    title: z.string(),
    date: z.iso.date(),
  }),
});

export default defineConfig();
