import type { MDXComponents } from "mdx/types";
import { ComponentPropsWithoutRef } from "react";

type HeadingProps = ComponentPropsWithoutRef<"h1">;

export const mdxComponents: MDXComponents = {
  h1: (props: HeadingProps) => (
    <h1 id="overview" className="scroll-mt-16 font-medium" {...props} />
  ),
};
