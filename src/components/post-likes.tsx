import { LikeButton } from "./like-button";
import { useEffect, useRef } from "react";

interface Props {
  slug: string;
  likes?: number;
  userLikes?: number;
  isLoading?: boolean;
  onLike: () => void;
}

export const PostLikes: React.FC<Props> = ({
  slug,
  likes = 0,
  userLikes = 0,
  isLoading,
  onLike,
}) => {
  const incrementLikes = useRef(0);
  const reachedMaxLikes = userLikes >= 3;

  const handleClick = () => {
    if (reachedMaxLikes) {
      return;
    }
    incrementLikes.current += 1;
    onLike();
  };

  useEffect(() => {
    // Debounced post request
    if (incrementLikes.current === 0) {
      return;
    }
    function likePost() {
      fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/posts/${slug}/like`, {
        method: "POST",
        body: JSON.stringify({ count: incrementLikes.current }),
      });
      incrementLikes.current = 0;
    }
    const timeoutId = setTimeout(likePost, 1000);
    return () => clearTimeout(timeoutId);
  }, [slug, userLikes]);

  return (
    <LikeButton
      likes={likes}
      userLikes={userLikes}
      disabled={isLoading || reachedMaxLikes}
      isLoading={isLoading}
      onClick={handleClick}
    />
  );
};
