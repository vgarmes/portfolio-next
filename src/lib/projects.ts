export interface Project {
  title: string;
  description: string;
  url: string;
}

export const projects: Project[] = [
  {
    title: "VMU Archive",
    description:
      "A searchable archive of Dreamcast VMU screen art, extracted pixel for pixel from the games' discs.",
    url: "https://vmu-archive.vercel.app/",
  },
  {
    title: "GameLib",
    description:
      "A tracker for my video game collection: what I own, what I'm playing and what I've finished.",
    url: "https://game-lib.vercel.app/",
  },
];
