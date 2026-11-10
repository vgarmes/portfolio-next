import { Link } from "./link";
import { NowPlaying } from "./now-playing";

export const NowContent: React.FC = () => {
  return (
    <div className="space-y-7">
      <p>
        Surrounded by increasingly generic, AI-generated interfaces, I’ve been
        craving things that feel more personal and made by someone. Currently
        drawn to terminal UIs, Neocities sites, paper textures, dithering and
        the small imperfections that give them character.
      </p>
      <p>
        Listening to drum & bass and jungle that bring back memories of 90s
        games and late-night anime.{" "}
        <Link
          isExternal={true}
          href="https://open.spotify.com/playlist/2dM1tFzsgcl0aq2SwNfgkv?si=cd5ab4f523e74d5f"
        >
          This playlist
        </Link>{" "}
        has some of my favourites. And lately,{" "}
        <Link
          isExternal={true}
          href="https://open.spotify.com/playlist/6Jzz5GtDPfO9bMSEeHdrYd?si=039c8315ff0d474e"
        >
          dungeon synth
        </Link>
        , the soundtrack to losing myself in dark fantasy worlds.
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
