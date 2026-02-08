import { cn } from "@/lib/utils";
import NextLink from "next/link";

interface Props {
  isExternal?: boolean;
  href: string;
  children?: React.ReactNode;
  className?: string;
}

export const Link: React.FC<Props> = ({
  isExternal,
  href,
  className,
  children,
}) => {
  const LinkComponent = isExternal ? "a" : NextLink;

  return (
    <LinkComponent
      className={cn(
        "hover:decoration-foreground underline decoration-gray-800 decoration-1 underline-offset-2 transition-colors",
        className,
      )}
      href={href}
      {...(isExternal && { rel: "noopener noreferrer", target: "_blank" })}
    >
      {children}
    </LinkComponent>
  );
};
