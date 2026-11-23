// source.config.ts
import {
  transformerNotationDiff,
  transformerNotationHighlight
} from "@shikijs/transformers";
import {
  parseCodeBlockAttributes
} from "fumadocs-core/mdx-plugins";
import {
  defineConfig,
  defineCollections,
  frontmatterSchema
} from "fumadocs-mdx/config";
import * as z from "zod";
var postSchema = frontmatterSchema.extend({
  title: z.string(),
  date: z.coerce.date(),
  /** Drafts show in `next dev` but are left out of production builds. */
  draft: z.boolean().default(false),
  image: z.object({
    src: z.string(),
    alt: z.string()
  }).optional()
});
var posts = defineCollections({
  type: "doc",
  dir: "src/content/writing",
  schema: postSchema
});
var craft = defineCollections({
  type: "doc",
  dir: "src/content/craft",
  schema: postSchema
});
function parseLineNumber(str, data) {
  return str.replace(/lineNumbers=(\d+)|lineNumbers/, (_, ...args) => {
    data["data-line-numbers"] = true;
    if (args[0] !== void 0)
      data["data-line-numbers-start"] = Number(args[0]);
    return "";
  });
}
var rehypeCodeOptions = {
  themes: {
    light: "github-light-high-contrast",
    dark: "vesper"
  },
  defaultColor: false,
  transformers: [
    {
      pre(hast) {
        hast.properties["data-code"] = this.source;
        hast.properties["data-lang"] = this.options.lang;
      }
    },
    transformerNotationHighlight(),
    transformerNotationDiff()
  ],
  parseMetaString(meta) {
    const parsed = parseCodeBlockAttributes(meta, ["title"]);
    const data = parsed.attributes;
    parsed.rest = parseLineNumber(parsed.rest, data);
    data.__parsed_raw = parsed.rest;
    return data;
  }
};
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions
  }
});
export {
  craft,
  source_config_default as default,
  posts
};
