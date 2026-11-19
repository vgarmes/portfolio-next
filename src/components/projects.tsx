import NextLink from "next/link";
import { projects } from "@/lib/projects";

export const Projects: React.FC = () => {
  return (
    <section className="mt-16 space-y-5 sm:mt-32 sm:space-y-6">
      <h3 className="font-medium">Projects</h3>
      <ul className="flex flex-col gap-7 sm:gap-4">
        {projects.map((project) => {
          // Internal pages (like /craft) open in the same tab, external sites in a new one.
          const isExternal = /^https?:\/\//.test(project.url);
          const LinkComponent = isExternal ? "a" : NextLink;
          return (
            <li key={project.url}>
              <LinkComponent
                href={project.url}
                {...(isExternal && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="hover:bg-muted hover:text-foreground dark:hover:bg-input/30 -mx-3 flex flex-col rounded-md px-3 sm:py-3"
              >
                <span>{project.title}</span>
                <span className="text-muted-foreground">
                  {project.description}
                </span>
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
