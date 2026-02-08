"use client";

import { useState, useEffect } from "react";
import { PostLikes } from "./post-likes";

interface Props {
  slug: string;
}

const apiHost = process.env.NEXT_PUBLIC_API_HOST;

export const PostStats = ({ slug }: Props) => {
  const [likes, setLikes] = useState(0);
  const [userLikes, setUserLikes] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch(`${apiHost}/api/posts/${slug}/stats`);
      if (response.status !== 200) {
        setStatus("error");
        return;
      }
      const data = (await response.json()) as {
        totalLikes: number;
        userLikes: number;
      };

      setLikes(data.totalLikes);
      setUserLikes(data.userLikes);
      setStatus("success");
    };

    const incrementViews = () =>
      fetch(`${apiHost}/api/posts/${slug}/view`, { method: "POST" });

    fetchStats().then(() => incrementViews());
  }, [slug]);

  return (
    <PostLikes
      slug={slug}
      likes={likes}
      userLikes={userLikes}
      onLike={() => {
        setLikes(likes + 1);
        setUserLikes(userLikes + 1);
      }}
      isLoading={status === "loading"}
    />
  );
};
