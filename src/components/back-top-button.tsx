"use client";

import { CornerLeftUp } from "lucide-react";

export const BackTopButton: React.FC = () => {
  return (
    <button
      id="scroll-top"
      className="hover:text-foreground text-muted-foreground flex cursor-pointer items-center gap-1 text-sm font-medium"
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
    >
      <CornerLeftUp className="size-4" />
      Back to top
    </button>
  );
};
