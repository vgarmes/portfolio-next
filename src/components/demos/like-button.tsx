"use client";

import { LikeButton } from "@/components/like-button";
import { useEffect, useState } from "react";
import { Demo } from "../demo";

export const LikeButtonDemo = () => {
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (likes < 3) return;
    const timeout = setTimeout(() => {
      setLikes(0);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [likes]);

  const handleClick = () => {
    if (likes >= 3) {
      return;
    }

    setLikes(likes + 1);
  };

  return (
    <Demo>
      <LikeButton
        likes={likes}
        userLikes={likes}
        onClick={handleClick}
        disabled={likes >= 3}
      />
    </Demo>
  );
};
