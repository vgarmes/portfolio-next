import NextLink from "next/link";
import { Link } from "@/components/link";

export const Hero: React.FC = () => {
  return (
    <section className="mb-8">
      <header className="mb-16 flex flex-col items-start">
        <NextLink className="inline-block font-medium no-underline" href="/">
          Victor Mestre
        </NextLink>
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
          <Link href="https://tactilegames.com/">Tactile Games</Link>, where I
          contribute to the Core Tech team by developing internal tools with a
          strong focus on user interfaces and usability.
        </p>
      </div>
    </section>
  );
};
