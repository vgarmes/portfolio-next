import CopyButton from "./copy-button";
import { CodeBlockProps } from "@/types";

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  "data-code": dataCode,
  "data-lang": dataLang,
  icon,
  title,
  ...props
}) => {
  const displayedTitle =
    title ??
    (dataLang === "bash" || dataLang === "sh" ? "Terminal" : undefined);
  return (
    <div className="relative my-6 overflow-hidden rounded-xl border shadow-sm">
      {displayedTitle && (
        <div className="bg-background flex h-12 items-center rounded-t-md border-b py-0 pr-3 pl-4">
          <div className="text-muted-foreground flex grow items-center justify-start gap-2">
            {typeof icon === "string" ? (
              <div
                className="[&_svg]:size-3.5"
                dangerouslySetInnerHTML={{
                  __html: icon,
                }}
              />
            ) : (
              icon
            )}
            <span className="text-[0.8125rem]">{displayedTitle}</span>
          </div>
        </div>
      )}

      <pre {...props}>{children}</pre>
      <CopyButton textToCopy={dataCode} className="absolute top-2 right-2" />
    </div>
  );
};

export default CodeBlock;
