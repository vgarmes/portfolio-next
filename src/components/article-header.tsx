import { formatDate } from "@/lib/date";

const ArticleHeader: React.FC<{ title: string; date: string }> = ({
  title,
  date,
}) => {
  const formattedDate = formatDate(date);
  const isoDate = new Date(date).toISOString();
  return (
    <header>
      <h1 id="overview" className="scroll-mt-16 font-medium">
        {title}
      </h1>
      <time
        className="text-muted-foreground flex flex-wrap items-center gap-6 gap-y-4"
        dateTime={isoDate}
      >
        {formattedDate}
      </time>
    </header>
  );
};

export default ArticleHeader;
