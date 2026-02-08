import type { MDXComponents } from "mdx/types";
import { ComponentPropsWithoutRef } from "react";
import CodeBlock from "./components/code-block";
import { CodeBlockProps } from "./types";
import { cn } from "./lib/utils";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;

export const mdxComponents: MDXComponents = {
  h1: (props: HeadingProps) => (
    <h1 id="overview" className="scroll-mt-16 font-medium" {...props} />
  ),
  h2: ({ id, children, ...props }: HeadingProps) => (
    <a
      href={"#" + id}
      className="not-prose group group relative mt-12 mb-6 inline-block w-fit no-underline md:mt-14"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="absolute top-0.75 -left-6 opacity-0 shadow-none transition-opacity outline-none group-hover:opacity-100 group-focus:opacity-100"
      >
        <path
          d="M10 19.0004L9.82843 19.1719C8.26634 20.734 5.73368 20.734 4.17158 19.1719L3.82843 18.8288C2.26634 17.2667 2.26633 14.734 3.82843 13.1719L7.17158 9.8288C8.73368 8.2667 11.2663 8.2667 12.8284 9.8288L13.1716 10.1719C13.8252 10.8256 14.2053 11.6491 14.312 12.5004"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M9.68799 12.5004C9.79463 13.3516 10.1748 14.1752 10.8284 14.8288L11.1715 15.1719C12.7336 16.734 15.2663 16.734 16.8284 15.1719L20.1715 11.8288C21.7336 10.2667 21.7336 7.73404 20.1715 6.17194L19.8284 5.8288C18.2663 4.2667 15.7336 4.2667 14.1715 5.8288L14 6.00037"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
      <h2
        className="font-medium"
        id={id}
        style={{ scrollMarginTop: "32px" }}
        {...props}
      >
        {children}
      </h2>
    </a>
  ),
  p: (props: ParagraphProps) => <p className="mb-6 opacity-90" {...props} />,
  pre: (props: CodeBlockProps) => <CodeBlock {...props} />,
  code: ({ className, ...props }: CodeBlockProps) => {
    // Inline Code.
    if (typeof props.children === "string") {
      return (
        <code
          className={cn(
            "bg-muted relative rounded-md px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem] wrap-break-word outline-none",
            className,
          )}
          {...props}
        />
      );
    }

    // Default codeblock.
    return <code {...props} />;
  },
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "decoration-muted-foreground text-inherit underline decoration-1 underline-offset-4 transition-colors hover:decoration-inherit",
        className,
      )}
      {...props}
    />
  ),
};
