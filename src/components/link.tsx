import { cn } from "@/lib/utils";
import NextLink from "next/link";

interface Props {
  isExternal?: boolean;
  href: string;
  children?: React.ReactNode;
  className?: string;
}

export const Link: React.FC<Props> = ({
  isExternal = false,
  href,
  className,
  children,
}) => {
  const LinkComponent = isExternal ? "a" : NextLink;

  return (
    <LinkComponent
      className={cn(
        "underline decoration-neutral-300 decoration-1 underline-offset-2 transition-colors hover:decoration-neutral-500 dark:decoration-neutral-500 dark:hover:decoration-neutral-300",
        className,
      )}
      href={href}
      {...(isExternal && { rel: "noopener noreferrer", target: "_blank" })}
    >
      {children}
    </LinkComponent>
  );
};
