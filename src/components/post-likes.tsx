import { HeartButton } from "./heart-button";

// Keep in sync with the per visitor limit enforced by the API
const MAX_USER_LIKES = 3;

interface Props {
  slug: string;
  likes?: number;
  userLikes?: number;
  isLoading?: boolean;
  disabled?: boolean;
  onLike: () => void;
}

export const PostLikes: React.FC<Props> = ({
  slug,
  likes = 0,
  userLikes = 0,
  isLoading,
  disabled,
  onLike,
}) => {
  const reachedMaxLikes = userLikes >= MAX_USER_LIKES;

  const handleClick = () => {
    if (reachedMaxLikes) {
      return;
    }
    onLike();
    fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/posts/${slug}/like`, {
      method: "POST",
      body: JSON.stringify({ count: 1 }),
    });
  };

  return (
    <HeartButton
      likes={likes}
      maxedOut={reachedMaxLikes}
      disabled={disabled}
      isLoading={isLoading}
      onClick={handleClick}
    />
  );
};
