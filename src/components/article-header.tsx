import { formatDate } from "@/lib/date";

const ArticleHeader: React.FC<{ title: string; date: Date }> = ({
  title,
  date,
}) => {
  const formattedDate = formatDate(date);

  return (
    <header>
      <h1 id="overview" className="scroll-mt-16 font-medium">
        {title}
      </h1>
      <time
        className="text-muted-foreground flex flex-wrap items-center gap-6 gap-y-4"
        dateTime={date.toISOString()}
      >
        {formattedDate}
      </time>
    </header>
  );
};

export default ArticleHeader;
