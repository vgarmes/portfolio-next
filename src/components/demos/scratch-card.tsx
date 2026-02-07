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
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [showCopyButton, setShowCopyButton] = useState(false);

  const hiddenContent = useRef<HTMLDivElement>(null);
  const copyButton = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    canvas.style.cursor = `url("/coin_cursor.png") 16 16, auto`;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas element not found");
    }
    // 1. Draw metallic gradient
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
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 20;

    // 2. Add metallic noise (procedural, no external image)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const rand = (Math.random() - 0.5) * 50; // noise intensity
      data[i] += rand; // R
      data[i + 1] += rand; // G
      data[i + 2] += rand; // B
    }
    ctx.putImageData(imageData, 0, 0);

    // hidden content starts with opacity 0 to avoid flashing it before canvas is painted
    hiddenContent.current?.style.setProperty("opacity", "1");

    function stopDrawing() {
      setIsDrawing(false);

      const erasedPercentage = getErasedPercentage();

      if (erasedPercentage > 90 && copyButton) {
        setShowCopyButton(true);
      }
    }

    function getErasedPercentage() {
      const canvas = canvasRef.current;
      const ctx = canvasRef.current?.getContext("2d");

      if (!canvas || !ctx) return 0;

      // just get the central line of the canvas
      const imageData = ctx.getImageData(0, canvas.height / 2, canvas.width, 1);
      const data = imageData.data;

      let erasedPixels = 0;

      // Each pixel has 4 values (R, G, B, A)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) erasedPixels++; // alpha = 0 means erased
      }

      const totalPixels = canvas.width; // width * 1px

      return (erasedPixels / totalPixels) * 100; // percentage
    }

    document.addEventListener("mouseup", stopDrawing);
    document.addEventListener("touchend", stopDrawing);
  }, []);

  function startDrawing(e: MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;

    // store initial coordinates
    setLastPos({ x: offsetX, y: offsetY });
  }

  const startTouchDrawing = (e: TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setLastPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };

  function scratch(e: MouseEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!isDrawing || !ctx) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);

    ctx.stroke();

    setLastPos({ x, y });
  }

  function scratchTouch(e: TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); // Prevent scrolling
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!isDrawing || !ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);

    ctx.stroke();

    setLastPos({ x, y });
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
                onTouchStart={startTouchDrawing}
                onTouchMove={scratchTouch}
                onMouseMove={scratch}
                onMouseEnter={(e) => {
                  if (isDrawing) {
                    // restart coordinates if mouse left and re-entered while drawing
                    const { offsetX, offsetY } = e.nativeEvent;
                    // guardar las coordenadas iniciales
                    setLastPos({ x: offsetX, y: offsetY });
                  }
                }}
              ></canvas>
            </div>
            <button
              id="copy-button"
              ref={copyButton}
              className={clsx(
                "transform-all flex size-4 cursor-pointer items-center justify-center opacity-0",
                {
                  "opacity-100": showCopyButton,
                },
              )}
              title="Copy code"
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
