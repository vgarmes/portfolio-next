import { getNowPlaying } from "@/lib/now-playing";
import { NowPlayingStack } from "./now-playing-stack";

export const NowPlaying: React.FC = async () => {
  const items = await getNowPlaying();
  return <NowPlayingStack items={items} />;
};
