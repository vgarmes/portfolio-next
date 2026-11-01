export interface Project {
  title: string;
  description: string;
  url: string;
}

export const projects: Project[] = [
  {
    title: "VMU Archive",
    description: "A searchable archive of Dreamcast VMU screen art.",
    url: "https://vmu-archive.vercel.app/",
  },
];
