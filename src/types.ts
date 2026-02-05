import type { ComponentProps, ReactNode } from "react";

export interface CodeBlockProps extends ComponentProps<"pre"> {
  "data-code": string;
  "data-lang"?: string;
  title?: string;
  icon?: ReactNode;
}
