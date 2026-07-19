"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ImageViewerProps = {
  images: { id: string; url: string }[];
  initialIndex?: number;
  onClose: () => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

export default function ImageViewer({
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const img = images[index];

  const resetTransform = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetTransform();
  }, [index, resetTransform]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1);
      if (e.key === "ArrowRight" && index < images.length - 1) setIndex((i) => i + 1);
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
      if (e.key === "-") setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
      if (e.key === "0") resetTransform();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, resetTransform]);

  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    e.preventDefault();
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    setOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  }

  function onMouseUp() {
    dragging.current = false;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink/80 backdrop-blur-sm"
      onClick={onClose}
      ref={containerRef}
    >
      <div
        className="absolute inset-0 z-0"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "default" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-1/2 max-h-[85vh] max-w-[90vw] select-none object-contain"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-ink shadow-lg transition-colors hover:bg-card"
      >
        ✕
      </button>

      {/* Navigation arrows */}
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-ink shadow-lg transition-colors hover:bg-card"
        >
          ‹
        </button>
      )}
      {index < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-ink shadow-lg transition-colors hover:bg-card"
        >
          ›
        </button>
      )}

      {/* Bottom toolbar */}
      <div
        className="absolute bottom-4 z-10 flex items-center gap-2 rounded-lg bg-card/80 px-4 py-2 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))}
          className="flex h-8 w-8 items-center justify-center rounded text-ink transition-colors hover:bg-line"
          title="Zoom out (-)"
        >
          −
        </button>
        <span className="min-w-[4ch] text-center font-mono text-xs text-ink-soft">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))}
          className="flex h-8 w-8 items-center justify-center rounded text-ink transition-colors hover:bg-line"
          title="Zoom in (+)"
        >
          +
        </button>
        <button
          onClick={resetTransform}
          className="flex h-8 items-center rounded px-2 font-mono text-[10px] uppercase tracking-wider text-ink-soft transition-colors hover:bg-line hover:text-ink"
          title="Reset (0)"
        >
          Fit
        </button>
        {images.length > 1 && (
          <span className="ml-2 border-l border-line pl-3 font-mono text-xs text-muted-fg">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>,
    document.body
  );
}
