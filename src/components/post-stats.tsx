"use client";

import { useState, useEffect } from "react";
import { PostLikes } from "./post-likes";

interface Props {
  slug: string;
}

export const PostStats = ({ slug }: Props) => {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/posts/${slug}/stats`,
      );
      if (response.status !== 200) {
        setStatus("error");
        return;
      }
      const data = (await response.json()) as {
        totalLikes: number;
        userLikes: number;
      };

      setLikes(data.totalLikes);
      // Visitors could previously like up to 3 times, any like counts as liked
      setLiked(data.userLikes > 0);
      setStatus("success");
    };

    const incrementViews = () =>
      fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/posts/${slug}/view`, {
        method: "POST",
      });

    fetchStats().then(() => incrementViews());
  }, [slug]);

  return (
    <PostLikes
      slug={slug}
      likes={likes}
      liked={liked}
      onLike={() => {
        setLikes(likes + 1);
        setLiked(true);
      }}
      isLoading={status === "loading"}
      disabled={status === "error"}
    />
  );
};
