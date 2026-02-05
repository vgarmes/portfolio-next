import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import {
  parseCodeBlockAttributes,
  type RehypeCodeOptions,
} from "fumadocs-core/mdx-plugins";
import {
  defineConfig,
  defineCollections,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import * as z from "zod";

export const posts = defineCollections({
  type: "doc",
  dir: "src/content/writing",
  schema: frontmatterSchema.extend({
    title: z.string(),
    date: z.iso.date(),
  }),
});

function parseLineNumber(str: string, data: Record<string, unknown>) {
  return str.replace(/lineNumbers=(\d+)|lineNumbers/, (_, ...args) => {
    data["data-line-numbers"] = true;

    if (args[0] !== undefined)
      data["data-line-numbers-start"] = Number(args[0]);

    return "";
  });
}

const rehypeCodeOptions: RehypeCodeOptions = {
  themes: {
    light: "github-light-high-contrast",
    dark: "vesper",
  },
  defaultColor: false,
  transformers: [
    {
      pre(hast) {
        hast.properties["data-code"] = this.source;
        hast.properties["data-lang"] = this.options.lang;
      },
    },
    transformerNotationHighlight(),
    transformerNotationDiff(),
  ],
  parseMetaString(meta) {
    const parsed = parseCodeBlockAttributes(meta, ["title"]);
    const data: Record<string, unknown> = parsed.attributes;
    parsed.rest = parseLineNumber(parsed.rest, data);

    data.__parsed_raw = parsed.rest;
    return data;
  },
};

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions,
  },
});
