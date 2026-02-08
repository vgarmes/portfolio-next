"use client";

import { Demo } from "@/components/demo";
import clsx from "clsx";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";

export const ScratchCard: React.FC = () => {
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [showCopyButton, setShowCopyButton] = useState(false);

  const hiddenContent = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Paint the scratch surface and reveal hidden content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // TODO: Add cursor icon
    // canvas.style.cursor = `url("/coin_cursor.png") 16 16, auto`;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas element not found");

    // Draw metallic gradient
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    gradient.addColorStop(0, "#d9d9d9");
    gradient.addColorStop(1, "#a6a6a6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add metallic noise (procedural, no external image)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const rand = (Math.random() - 0.5) * 50;
      data[i] += rand;
      data[i + 1] += rand;
      data[i + 2] += rand;
    }
    ctx.putImageData(imageData, 0, 0);

    // Configure scratch stroke
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 20;

    // Hidden content starts with opacity 0 to avoid flashing before canvas is painted
    hiddenContent.current?.style.setProperty("opacity", "1");
  }, []);

  // Register touch/mouse event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getErasedPercentage() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return 0;

      // Sample the central row of the canvas
      const imageData = ctx.getImageData(
        0,
        canvas!.height / 2,
        canvas!.width,
        1,
      );
      const data = imageData.data;

      let erasedPixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) erasedPixels++;
      }

      return (erasedPixels / canvas!.width) * 100;
    }

    function stopDrawing() {
      isDrawing.current = false;
      if (getErasedPercentage() > 90) {
        setShowCopyButton(true);
      }
    }

    function handleTouchMove(e: globalThis.TouchEvent) {
      e.preventDefault();
      const ctx = canvas!.getContext("2d");
      if (!isDrawing.current || !ctx) return;

      const rect = canvas!.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastPos.current = { x, y };
    }

    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("mouseup", stopDrawing);
    document.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", stopDrawing);
      document.removeEventListener("touchend", stopDrawing);
    };
  }, []);

  function getPos(
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
  ) {
    if ("touches" in e) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  }

  function startDrawing(
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
  ) {
    if (!canvasRef.current) return;
    isDrawing.current = true;
    lastPos.current = getPos(e);
  }

  function scratch(
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
  ) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!isDrawing.current || !ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos.current = { x, y };
  }
  return (
    <Demo>
      <div className="flex w-full items-center justify-center">
        <div className="flex flex-col items-start gap-2 overflow-x-auto px-3 py-12 sm:flex-row sm:items-center">
          <p className="text-muted-foreground text-xs">API Key</p>
          <div className="flex items-center gap-3">
            <div className="bg-background relative h-8 w-82.5 overflow-hidden rounded-md border">
              {/* <!-- Hidden content --> */}
              <div
                id="hidden-content"
                ref={hiddenContent}
                className="absolute inset-0 flex items-center px-3 opacity-0 select-none"
              >
                <span className="text-foreground truncate font-mono text-sm">
                  sk_4f8a29c0b7d14e2fa91c6d03a8f5e7bd
                </span>
              </div>
              {/* <!-- Scratchable area --> */}
              <canvas
                id="canvas"
                ref={canvasRef}
                width="300"
                height="200"
                className="absolute h-full w-full"
                onMouseDown={startDrawing}
                onTouchStart={startDrawing}
                onMouseMove={scratch}
                onMouseEnter={(e) => {
                  if (isDrawing.current) {
                    // restart coordinates if mouse left and re-entered while drawing
                    const { offsetX, offsetY } = e.nativeEvent;
                    lastPos.current = { x: offsetX, y: offsetY };
                  }
                }}
              ></canvas>
            </div>
            <button
              id="copy-button"
              className={clsx(
                "flex size-4 cursor-pointer items-center justify-center opacity-0 transition-all",
                {
                  "opacity-100": showCopyButton,
                },
              )}
              title="Copy code"
              onClick={() => {
                const text = hiddenContent.current?.textContent;
                if (text) navigator.clipboard.writeText(text.trim());
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Demo>
  );
};
