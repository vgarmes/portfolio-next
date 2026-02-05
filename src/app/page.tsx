import Writing from "@/components/writing";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <header className="mb-16 flex flex-col items-start">
          <Link className="inline-block font-medium no-underline" href="/">
            Victor Mestre
          </Link>
          <span className="text-medium text-muted-foreground leading-none font-medium">
            Frontend Engineer
          </span>
        </header>

        <div className="space-y-8">
          <p>
            Crafting great web experiences that blend functionality and design.
          </p>

          <p>
            Currently, I work at{" "}
            <Link href="https://sybogames.com/">Sybo Games</Link>, where I
            contribute to the central technology team by developing internal
            tools with a strong focus on user interfaces and usability.
          </p>
        </div>
      </section>

      <Writing />
    </div>
  );
}
