import { projects } from "@/lib/projects";

export const Projects: React.FC = () => {
  return (
    <section className="mt-16 space-y-5 sm:mt-32 sm:space-y-6">
      <h3 className="font-medium">Projects</h3>
      <ul className="flex flex-col gap-7 sm:gap-4">
        {projects.map((project) => (
          <li key={project.url}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted hover:text-foreground dark:hover:bg-input/30 -mx-3 flex flex-col rounded-md px-3 sm:py-3"
            >
              <span>{project.title}</span>
              <span className="text-muted-foreground">
                {project.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">More soon</p>
    </section>
  );
};
