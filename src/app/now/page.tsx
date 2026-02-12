import { NowContent } from "@/components/now";
import { Undo2 } from "lucide-react";
import Link from "next/link";

const NowPage: React.FC = () => {
  return (
    <>
      <aside className="static top-32 left-20 max-h-[calc(100vh-4rem)] flex-col gap-3 pb-8 xl:fixed xl:flex xl:pb-0">
        <Link
          href="/"
          className="flex items-center gap-1 py-1 text-sm leading-tight"
        >
          <Undo2 className="size-4" />
          Index
        </Link>
      </aside>
      <header className="mb-12">
        <h1 className="font-medium">Now</h1>
      </header>
      <NowContent />
    </>
  );
};

export default NowPage;
