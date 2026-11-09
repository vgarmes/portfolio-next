import { Link } from "./link";
import { NowPlaying } from "./now-playing";

export const NowContent: React.FC = () => {
  return (
    <div className="space-y-7">
      <p>
        Going through a “phase” of returning to{" "}
        <Link href="/writing/going-analog">analog things</Link>. Drawn to the
        tech I grew up with and to timeless, minimalistic interfaces, almost
        terminal-like.
      </p>
      <p>
        Listening to drum & bass and jungle-music that brings back the nostalgia
        of 90s games and late-night anime.{" "}
        <Link
          isExternal={true}
          href="https://open.spotify.com/playlist/2dM1tFzsgcl0aq2SwNfgkv?si=cd5ab4f523e74d5f"
        >
          This playlist
        </Link>{" "}
        is a curation of some of my favorites. And lately,{" "}
        <Link
          isExternal={true}
          href="https://open.spotify.com/playlist/6Jzz5GtDPfO9bMSEeHdrYd?si=039c8315ff0d474e"
        >
          dungeon synth
        </Link>
        , the soundtrack to playing HeroQuest and losing myself in dark fantasy
        worlds.
      </p>
    </div>
  );
};

export const Now: React.FC = () => {
  return (
    <section className="mt-16 sm:mt-32">
      <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
        <h3 className="font-medium">Now</h3>
        <NowPlaying />
      </div>
      <NowContent />
    </section>
  );
};
