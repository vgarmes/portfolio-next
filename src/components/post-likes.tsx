import { HeartButton } from "./heart-button";

interface Props {
  slug: string;
  likes?: number;
  liked?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onLike: () => void;
}

export const PostLikes: React.FC<Props> = ({
  slug,
  likes = 0,
  liked = false,
  isLoading,
  disabled,
  onLike,
}) => {
  const handleClick = () => {
    if (liked) {
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
      liked={liked}
      disabled={disabled}
      isLoading={isLoading}
      onClick={handleClick}
    />
  );
};
