export interface Project {
  title: string;
  description: string;
  url: string;
}

export const projects: Project[] = [
  {
    title: "VMU Archive",
    description:
      "An archive of Dreamcast VMU screen art, extracted from the games' discs.",
    url: "https://vmu-archive.vercel.app/",
  },
  {
    title: "gamelib",
    description:
      "A tracker for my video game collection.",
    url: "https://game-lib.vercel.app/",
  },
  {
    title: "Craft",
    description: "A collection of small UI experiments and interactions.",
    url: "/craft",
  },
];
