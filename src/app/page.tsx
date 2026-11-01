import { Connect } from "@/components/connect";
import { Hero } from "@/components/hero";
import { Now } from "@/components/now";
import { Projects } from "@/components/projects";
import { Writing } from "@/components/writing";

export default function Home() {
  return (
    <div className="space-y-8">
      <Hero />
      <Projects />
      <Writing />
      <Now />
      <Connect />
    </div>
  );
}
