"use client";

// Based on the LikeButton by Delba Oliveira: https://github.com/delbaoliveira
import cx from "clsx";
import styles from "./like-button.module.css";
import { LoadingDots } from "./loading-dots";
import { useState } from "react";

interface Props {
  likes: number;
  userLikes?: number;
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ConfettiProps {
  active: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({ active }) => (
  <svg
    id="confetti"
    viewBox="467 392 58 57"
    xmlns="http://www.w3.org/2000/svg"
    className="pointer-events-none absolute top-1/2 left-1/2 w-14.5 -translate-x-1/2 -translate-y-1/2 overflow-visible"
  >
    <g
      className={styles.confettiGroup}
      fill="none"
      fillRule="evenodd"
      transform="translate(467 392)"
    >
      <g
        className={styles.grp}
        transform="translate(7 6)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#9CD8C3"
          cx="2"
          cy="6"
          r="2"
          style={{
            transform: active ? "scale(0) translate(-30px, -15px)" : "none",
          }}
        />
        <circle
          fill="#8CE8C3"
          cx="5"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(-55px, -30px)" : "none",
          }}
        />
      </g>

      <g
        className={styles.grp}
        transform="translate(0 28)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#CC8EF5"
          cx="2"
          cy="7"
          r="2"
          style={{
            transform: active ? "scale(0) translate(-30px, 0px)" : "none",
          }}
        />
        <circle
          fill="#91D2FA"
          cx="3"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(-60px, -5px)" : "none",
          }}
        />
      </g>

      <g
        className={styles.grp}
        transform="translate(52 28)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#8CE8C3"
          cx="4"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(30px, 0px)" : "none",
          }}
        />
        <circle
          fill="#9CD8C3"
          cx="2"
          cy="7"
          r="2"
          style={{
            transform: active ? "scale(0) translate(60px, 10px)" : "none",
          }}
        />
      </g>

      <g
        className={styles.grp}
        transform="translate(44 6)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#CC8EF5"
          cx="2"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(30px, -15px)" : "none",
          }}
        />
        <circle
          fill="#CC8EF5"
          cx="5"
          cy="6"
          r="2"
          style={{
            transform: active ? "scale(0) translate(60px, -15px)" : "none",
          }}
        />
      </g>

      <g
        className={styles.grp}
        transform="translate(14 50)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#91D2FA"
          cx="6"
          cy="5"
          r="2"
          style={{
            transform: active ? "scale(0) translate(-10px, 20px)" : "none",
          }}
        />
        <circle
          fill="#91D2FA"
          cx="2"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(-60px, 30px)" : "none",
          }}
        />
      </g>

      <g
        className={styles.grp}
        transform="translate(35 50)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#F48EA7"
          cx="6"
          cy="5"
          r="2"
          style={{
            transform: active ? "scale(0) translate(30px, 15px)" : "none",
          }}
        />
        <circle
          fill="#F48EA7"
          cx="2"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(40px, 50px)" : "none",
          }}
        />
      </g>
      <g
        className={styles.grp}
        transform="translate(24)"
        style={{ opacity: active ? 1 : 0 }}
      >
        <circle
          fill="#9FC7FA"
          cx="2.5"
          cy="3"
          r="2"
          style={{
            transform: active ? "scale(0) translate(0px, -30px)" : "none",
          }}
        />
        <circle
          fill="#9FC7FA"
          cx="7.5"
          cy="2"
          r="2"
          style={{
            transform: active ? "scale(0) translate(10px, -50px)" : "none",
          }}
        />
      </g>
    </g>
  </svg>
);

export const LikeButton: React.FC<Props> = ({
  likes = 0,
  userLikes = 0,
  disabled = false,
  isLoading = false,
  onClick,
}) => {
  const [initialLikes, setInitialLikes] = useState<number | null>(null);
  if (!isLoading && initialLikes === null) {
    setInitialLikes(userLikes);
  }
  const reachedMaxLikes = userLikes >= 3;
  const shouldAnimate = initialLikes !== null && userLikes !== initialLikes;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex">
        <button
          className={cx(
            "relative transform overflow-hidden rounded-lg bg-linear-to-tl from-zinc-300 to-zinc-100 p-1 transition-all duration-300 ease-out enabled:hover:scale-110 enabled:active:scale-90 dark:from-white/5 dark:to-white/30",
            { "animate-pulse": isLoading },
          )}
          disabled={disabled}
          onClick={onClick}
        >
          <div
            className={cx(
              "absolute inset-0 transform-gpu bg-linear-to-t from-indigo-500 via-purple-500 to-pink-500 transition-transform",
              {
                "translate-y-full": userLikes === 0,
                "translate-y-5": userLikes === 1,
                "translate-y-3": userLikes === 2,
              },
            )}
          ></div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            className={cx(
              "relative h-6 w-6 fill-white stroke-zinc-400 group-hover:scale-110 dark:stroke-transparent",
              {
                [styles.animateHeart]: reachedMaxLikes && shouldAnimate,
              },
            )}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
        <Confetti active={reachedMaxLikes && shouldAnimate} />
      </div>

      {isLoading ? (
        <LoadingDots />
      ) : (
        <div
          className={cx("relative text-sm font-semibold whitespace-nowrap", {
            "text-pink-600 dark:text-pink-500": userLikes > 0,
          })}
        >
          {likes} likes
          {shouldAnimate && (
            <div className="absolute top-0 right-0 translate-x-[calc(100%+4px)] text-xs">
              <div key={userLikes} className={styles.floatingText}>
                +1
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
