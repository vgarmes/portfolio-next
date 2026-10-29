import { getNowPlaying } from "@/lib/now-playing";
import { NowPlayingTicker } from "./now-playing-ticker";

export const NowPlaying: React.FC = async () => {
  const items = await getNowPlaying();
  return <NowPlayingTicker items={items} />;
};
