"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Calendar,
  Zap,
} from "lucide-react";
import type { TimelinePoint, PlaybackSpeed, SkillLevel } from "@/lib/types";
import { HOURS_PER_LUNAR_CYCLE, MS_PER_HOUR } from "@/lib/constants";

interface TimelineControllerProps {
  date: Date;
  onDateChange: (d: Date) => void;
  timeline: TimelinePoint[];
  isPlaying: boolean;
  onPlayToggle: () => void;
  playbackSpeed: PlaybackSpeed;
  onSpeedChange: (s: PlaybackSpeed) => void;
  skillLevel?: SkillLevel;
}

export function TimelineController({
  date,
  onDateChange,
  timeline,
  isPlaying,
  onPlayToggle,
  playbackSpeed,
  onSpeedChange,
}: TimelineControllerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Find current position in timeline
  const currentHour = timeline.length > 0
    ? (date.getTime() - timeline[0].timestamp.getTime()) / MS_PER_HOUR
    : 0;
  const progress = Math.max(0, Math.min(1, currentHour / HOURS_PER_LUNAR_CYCLE));

  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padL = 8;
    const padR = 8;
    const trackW = W - padL - padR;
    const trackH = 14;
    const trackGap = 2;
    const startY = 4;

    function hourToX(h: number): number {
      return padL + (h / HOURS_PER_LUNAR_CYCLE) * trackW;
    }

    // Background
    ctx.fillStyle = "rgba(3, 5, 8, 0.8)";
    ctx.fillRect(0, 0, W, H);

    // Track 1: Sunlight
    const t1y = startY;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.roundRect(padL, t1y, trackW, trackH, 3);
    ctx.fill();

    for (const pt of timeline) {
      if (pt.isSunVisible) {
        const x = hourToX(pt.hourOffset);
        const intensity = Math.max(0.2, pt.powerFactor);
        ctx.fillStyle = `rgba(245, 158, 11, ${intensity * 0.7})`;
        ctx.fillRect(x, t1y, Math.max(1, trackW / timeline.length), trackH);
      }
    }

    // Track label
    ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
    ctx.font = "8px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("☀ SUN", padL + 2, t1y + 10);

    // Track 2: DTE
    const t2y = t1y + trackH + trackGap;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.roundRect(padL, t2y, trackW, trackH, 3);
    ctx.fill();

    for (const pt of timeline) {
      if (pt.isEarthVisible) {
        const x = hourToX(pt.hourOffset);
        ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
        ctx.fillRect(x, t2y, Math.max(1, trackW / timeline.length), trackH);
      }
    }

    ctx.fillStyle = "rgba(59, 130, 246, 0.7)";
    ctx.font = "8px system-ui, sans-serif";
    ctx.fillText("🌍 DTE", padL + 2, t2y + 10);

    // Track 3: Combined
    const t3y = t2y + trackH + trackGap;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.roundRect(padL, t3y, trackW, trackH, 3);
    ctx.fill();

    for (const pt of timeline) {
      if (pt.isSunVisible && pt.isEarthVisible) {
        const x = hourToX(pt.hourOffset);
        ctx.fillStyle = "rgba(16, 185, 129, 0.6)";
        ctx.fillRect(x, t3y, Math.max(1, trackW / timeline.length), trackH);
      }
    }

    ctx.fillStyle = "rgba(16, 185, 129, 0.7)";
    ctx.font = "8px system-ui, sans-serif";
    ctx.fillText("✅ OPT", padL + 2, t3y + 10);

    // Playhead
    const px = hourToX(currentHour);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, startY - 2);
    ctx.lineTo(px, t3y + trackH + 2);
    ctx.stroke();

    // Playhead triangle
    ctx.beginPath();
    ctx.moveTo(px - 4, startY - 2);
    ctx.lineTo(px + 4, startY - 2);
    ctx.lineTo(px, startY + 3);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();

    // Day markers
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    for (let d = 0; d <= 29; d += 7) {
      const x = hourToX(d * 24);
      ctx.fillText(`D${d}`, x, t3y + trackH + 12);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, t3y + trackH);
      ctx.stroke();
    }
  }, [timeline, currentHour]);

  useEffect(() => {
    drawTimeline();
    const handleResize = () => drawTimeline();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawTimeline]);

  // Click on timeline to seek
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || timeline.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padL = 8;
      const padR = 8;
      const trackW = rect.width - padL - padR;
      const frac = Math.max(0, Math.min(1, (x - padL) / trackW));
      const hourOffset = frac * HOURS_PER_LUNAR_CYCLE;
      const newDate = new Date(
        timeline[0].timestamp.getTime() + hourOffset * MS_PER_HOUR,
      );
      onDateChange(newDate);
    },
    [timeline, onDateChange],
  );

  const stepHours = (h: number) => {
    onDateChange(new Date(date.getTime() + h * MS_PER_HOUR));
  };

  const dateStr = date.toISOString().slice(0, 16);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel rounded-none border-x-0 border-b-0 bg-space-black/85 backdrop-blur-xl">
      <div className="max-w-[1920px] mx-auto px-6 py-3">
        {/* Timeline Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-14 cursor-pointer rounded-lg"
          style={{ display: "block" }}
          onClick={handleTimelineClick}
        />

        {/* Controls Row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Date picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => {
                const d = new Date(e.target.value + "Z");
                if (!isNaN(d.getTime())) onDateChange(d);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-accent-blue/50 w-44"
            />
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Playback controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => stepHours(-24)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5 text-text-secondary" />
            </button>
            <button
              onClick={onPlayToggle}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={() => stepHours(24)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </div>

          {/* Speed buttons */}
          <div className="flex items-center gap-1">
            {(["1h", "24h", "cycle"] as PlaybackSpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                  playbackSpeed === speed
                    ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
                    : "bg-white/5 text-text-muted hover:bg-white/10"
                }`}
              >
                {speed === "1h" ? "1h/s" : speed === "24h" ? "24h/s" : "Loop"}
              </button>
            ))}
          </div>

          {/* Optimal Landing Window Button */}
          <button
            onClick={() => {
              if (!timeline || timeline.length === 0) return;
              let bestScore = -Infinity;
              let bestPoint = timeline[0];
              for (const pt of timeline) {
                let score = 0;
                if (pt.isSunVisible && pt.isEarthVisible) {
                  score = 1000 + pt.sunElevation * 15 + pt.earthElevation * 2;
                } else if (pt.isSunVisible) {
                  score = 100 + pt.sunElevation * 10;
                } else if (pt.isEarthVisible) {
                  score = 50 + pt.earthElevation * 2;
                } else {
                  score = pt.sunElevation;
                }
                if (score > bestScore) {
                  bestScore = score;
                  bestPoint = pt;
                }
              }
              onDateChange(bestPoint.timestamp);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-accent-emerald/15 hover:bg-accent-emerald/25 text-accent-emerald border border-accent-emerald/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Auto-scan lunar cycle and jump to optimal simultaneous Sun + DTE landing window"
          >
            <Zap className="w-3 h-3 text-accent-emerald" />
            <span>Optimal Window</span>
          </button>

          <div className="flex-1" />

          {/* Current time display */}
          <div className="text-right">
            <p className="text-[10px] text-text-muted">
              Day{" "}
              <span className="text-white font-mono">
                {(currentHour / 24).toFixed(1)}
              </span>{" "}
              / {(HOURS_PER_LUNAR_CYCLE / 24).toFixed(1)} of lunar cycle
            </p>
            <div className="w-32 h-1.5 rounded-full bg-white/5 mt-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-gold to-accent-emerald transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

