import { formatDate } from "@/lib/date";

const ArticleHeader: React.FC<{
  title: string;
  date: Date;
  draft?: boolean;
}> = ({ title, date, draft }) => {
  const formattedDate = formatDate(date);

  return (
    <header>
      <h1 id="overview" className="scroll-mt-16 font-medium">
        {title}
      </h1>
      <div className="text-muted-foreground flex flex-wrap items-center gap-3">
        <time dateTime={date.toISOString()}>{formattedDate}</time>
        {draft && (
          <span className="rounded-full border px-2 py-0.5 text-xs leading-4">
            Draft
          </span>
        )}
      </div>
    </header>
  );
};

export default ArticleHeader;
