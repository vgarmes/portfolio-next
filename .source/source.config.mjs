// source.config.ts
import {
  defineConfig,
  defineCollections,
  frontmatterSchema
} from "fumadocs-mdx/config";
import * as z from "zod";
var posts = defineCollections({
  type: "doc",
  dir: "src/content/writing",
  // add required frontmatter properties
  schema: frontmatterSchema.extend({
    title: z.string(),
    date: z.iso.date()
  })
});
var source_config_default = defineConfig();
export {
  source_config_default as default,
  posts
};
