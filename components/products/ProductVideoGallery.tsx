"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductVideo = {
  id: string;
  video_url: string;
  video?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  title?: string;
  alt_text?: string;
  is_cover?: boolean;
  is_featured?: boolean;
  ordering?: number;
  duration?: number | null;
  mime_type?: string;
};

type ProductVideoGalleryProps = {
  videos: ProductVideo[];
  className?: string;
  /** If true, the cover video autoplays muted */
  autoplay?: boolean;
  /** Aspect ratio for the video container (default 16/9) */
  aspectRatio?: number;
};

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoPlayer({
  video,
  poster,
  autoPlay,
  onEnded,
}: {
  video: string;
  poster?: string | null;
  autoPlay?: boolean;
  onEnded?: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay ?? false);
  const [isMuted, setIsMuted] = React.useState(autoPlay ?? true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [showControls, setShowControls] = React.useState(true);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = React.useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = React.useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    } else {
      videoRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  }, []);

  const handleTimeUpdate = React.useCallback(() => {
    if (!videoRef.current || !videoRef.current.duration) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  }, []);

  const handleProgressClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !videoRef.current.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      videoRef.current.currentTime = pct * videoRef.current.duration;
      setProgress(pct * 100);
    },
    []
  );

  const handleVolumeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  }, []);

  const handleMouseMove = React.useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  React.useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [autoPlay]);

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-black group"
      style={{ aspectRatio: "16 / 9" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={video}
        poster={poster || undefined}
        className="h-full w-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
        playsInline
        preload="metadata"
        aria-label="Product video"
      />

      {/* Center play button overlay when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          aria-label="Play video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-8 w-8 text-gray-900" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div
          className="mb-2 h-1 w-full cursor-pointer rounded-full bg-white/30"
          onClick={handleProgressClick}
        >
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 accent-white"
              aria-label="Volume"
            />
          </div>
          <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors" aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductVideoGallery({ videos, className, autoplay = false, aspectRatio = 16 / 9 }: ProductVideoGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const visibleVideos = React.useMemo(() => {
    if (autoplay) {
      const cover = videos.find((v) => v.is_cover);
      return cover ? [cover] : videos;
    }
    return videos;
  }, [videos, autoplay]);

  const activeVideo = visibleVideos[activeIndex] ?? null;

  if (!videos.length) return null;

  const videoSrc = activeVideo?.video_url || activeVideo?.video || "";

  if (autoplay) {
    return (
      <div className={cn("relative w-full overflow-hidden", className)}>
        <VideoPlayer video={videoSrc} poster={activeVideo?.thumbnail_url || activeVideo?.thumbnail} autoPlay />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: `${aspectRatio}` }}>
        <VideoPlayer video={videoSrc} poster={activeVideo?.thumbnail_url || activeVideo?.thumbnail} />
      </div>

      {visibleVideos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {visibleVideos.map((video, i) => (
            <button
              key={video.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative flex-shrink-0 w-24 h-16 overflow-hidden rounded-lg border-2 transition-all",
                i === activeIndex ? "border-primary shadow-md" : "border-transparent hover:border-primary/40"
              )}
            >
              {(video.thumbnail_url || video.thumbnail) ? (
                <Image
                  src={video.thumbnail_url || video.thumbnail || ""}
                  alt={video.title || video.alt_text || `Video ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-muted-foreground" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              {video.duration ? (
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
                  {formatDuration(video.duration)}
                </span>
              ) : null}
              {video.is_cover && (
                <span className="absolute left-1 top-1 rounded bg-primary/80 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                  Cover
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
