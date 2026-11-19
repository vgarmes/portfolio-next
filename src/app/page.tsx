import { Connect } from "@/components/connect";
import { Hero } from "@/components/hero";
import { Now } from "@/components/now";
import { Projects } from "@/components/projects";
import { SectionPreview } from "@/components/section-preview";

export default function Home() {
  return (
    <div className="space-y-8">
      <Hero />
      <Projects />
      <SectionPreview section="writing" />
      <Now />
      <Connect />
    </div>
  );
}
