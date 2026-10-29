import * as z from "zod";

export type NowPlayingKind = "reading" | "listening" | "playing";

export interface NowPlayingItem {
  kind: NowPlayingKind;
  title: string;
  cover: string;
}

// Hardcoded until they get their own API
const staticItems: NowPlayingItem[] = [
  {
    kind: "reading",
    title: "Between Two Fires",
    cover:
      "https://production-img.hardcover.app/enlarge?height=407&type=webp&url=https%3A%2F%2Fassets.hardcover.app%2Feditions%2F30423309%2F5478029573138530.jpg&width=270",
  },
];

const GAME_ENDPOINT = "https://game-lib.vercel.app/api/now-playing";

const gameSchema = z.object({
  title: z.string().min(1),
  coverUrl: z.url(),
});

async function getPlayingGame(): Promise<NowPlayingItem | null> {
  try {
    const response = await fetch(GAME_ENDPOINT, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const result = gameSchema.safeParse(await response.json());
    if (!result.success) return null;

    return {
      kind: "playing",
      title: result.data.title,
      cover: result.data.coverUrl,
    };
  } catch {
    return null;
  }
}

export async function getNowPlaying(): Promise<NowPlayingItem[]> {
  const game = await getPlayingGame();
  return game ? [...staticItems, game] : staticItems;
}
