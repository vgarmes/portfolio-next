import { cn } from "@/lib/utils";
import CopyButton from "./copy-button";
import { CodeBlockProps } from "@/types";
import { type IconName, Icons } from "./icons";
import { ReactNode } from "react";

const getDisplayedTitle = (title?: string, dataLang?: string) => {
  if (title) return title;
  if (dataLang === "bash" || dataLang === "sh") return "Terminal";
  return undefined;
};

const getDisplayedIcon = (
  fallbackIcon: ReactNode,
  dataLang?: string,
): ReactNode | undefined => {
  if (!dataLang) return fallbackIcon;

  return Icons[dataLang as IconName]?.() ?? fallbackIcon;
};

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  "data-code": dataCode,
  "data-lang": dataLang,
  icon,
  title,
  className,
  ...props
}) => {
  const displayedTitle = getDisplayedTitle(title, dataLang);

  const displayedIcon = getDisplayedIcon(icon, dataLang);
  return (
    <div className="relative my-6 overflow-hidden rounded-xl border shadow-sm">
      {displayedTitle && (
        <div className="bg-background flex h-12 items-center rounded-t-md border-b py-0 pr-3 pl-4">
          <div className="text-muted-foreground flex grow items-center justify-start gap-2">
            {typeof displayedIcon === "string" ? (
              <div
                className="[&_svg]:size-3.5"
                dangerouslySetInnerHTML={{
                  __html: displayedIcon,
                }}
              />
            ) : (
              displayedIcon
            )}
            <span className="text-[0.8125rem]">{displayedTitle}</span>
          </div>
        </div>
      )}

      <pre
        className={cn(
          "no-scrollbar overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto",
          className,
        )}
        {...props}
      >
        {children}
      </pre>
      <CopyButton textToCopy={dataCode} className="absolute top-2 right-2" />
    </div>
  );
};

export default CodeBlock;
