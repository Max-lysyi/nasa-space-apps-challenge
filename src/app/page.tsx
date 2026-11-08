"use client";

import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import type {
  LandingSite,
  SkillLevel,
  PlaybackSpeed,
  EphemerisResult,
  LunarCycleMetrics,
  TimelinePoint,
} from "@/lib/types";
import { CURATED_SITES } from "@/lib/landingSites";
import {
  computeEphemeris,
  computeLunarCycleMetrics,
  computeTimeline,
} from "@/lib/lunarEphemeris";
import { HOURS_PER_LUNAR_CYCLE, MS_PER_HOUR } from "@/lib/constants";

import { ScrollIntro } from "@/components/ScrollIntro";
import { TelemetryBar } from "@/components/TelemetryBar";
import { SiteSelector } from "@/components/SiteSelector";
import { HorizonSkyView } from "@/components/HorizonSkyView";
import { RegionalMap2D } from "@/components/RegionalMap2D";
import { TimelineController } from "@/components/TimelineController";
import { ScenarioComparison } from "@/components/ScenarioComparison";

// Dynamically import 3D canvas with SSR disabled to prevent WebGL/server pre-render mismatches
const LunarSurface3D = dynamic(
  () => import("@/components/LunarSurface3D").then((mod) => mod.LunarSurface3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-space-black/60 text-text-muted gap-2">
        <div className="w-6 h-6 border-2 border-accent-gold/40 border-t-accent-gold rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider">LOADING 3D LUNAR TOPOGRAPHY...</span>
      </div>
    ),
  },
);

function NavigatorContent() {
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ── Core state ────────────────────────────────────────────────────────────
  const [selectedSite, setSelectedSite] = useState<LandingSite>(
    CURATED_SITES[0],
  );
  // Default to a deterministic mission timestamp (Spring 2026 south pole exploration epoch)
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date("2026-03-15T12:00:00Z"),
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("educator");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>("1h");
  const [showComparison, setShowComparison] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // ── Computed ephemeris & metrics (memoized) ──────────────────────────────
  const ephemeris: EphemerisResult = useMemo(
    () => computeEphemeris(selectedDate, selectedSite),
    [selectedDate, selectedSite],
  );

  const cycleMetrics: LunarCycleMetrics = useMemo(
    () => computeLunarCycleMetrics(selectedDate, selectedSite),
    [selectedDate, selectedSite],
  );

  const timeline: TimelinePoint[] = useMemo(
    () => computeTimeline(selectedDate, selectedSite, HOURS_PER_LUNAR_CYCLE, 1),
    [selectedDate, selectedSite],
  );

  // ── Playback simulation timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const speedMap: Record<PlaybackSpeed, number> = {
      "1h": 1,
      "24h": 24,
      cycle: HOURS_PER_LUNAR_CYCLE / 30,
    };
    const hoursPerTick = speedMap[playbackSpeed];
    const interval = setInterval(() => {
      setSelectedDate(
        (d) => new Date(d.getTime() + hoursPerTick * MS_PER_HOUR),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // ── Interaction Handlers ──────────────────────────────────────────────────
  const scrollToWorkspace = useCallback(() => {
    setShowIntro(false);
    workspaceRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleDateChange = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  const handleSiteChange = useCallback((site: LandingSite) => {
    setSelectedSite(site);
  }, []);

  return (
    <div className="relative min-h-screen bg-space-black">
      {/* ── Apple-style Scroll-Driven Intro ───────────────────────────────── */}
      {showIntro && <ScrollIntro onLaunch={scrollToWorkspace} />}

      {/* ── Main Tactical HUD Workspace ──────────────────────────────────── */}
      <div ref={workspaceRef} className="relative min-h-screen">
        {/* Top Dynamic Telemetry Bar */}
        <TelemetryBar
          ephemeris={ephemeris}
          metrics={cycleMetrics}
          skillLevel={skillLevel}
          onSkillLevelChange={setSkillLevel}
          onShowComparison={() => setShowComparison(!showComparison)}
          showComparison={showComparison}
        />

        {/* Main Content Grid */}
        <div className="p-6 pt-24 pb-52 max-w-[1920px] mx-auto">
          {/* Site Selector with Curated + Custom coordinate input */}
          <SiteSelector
            selectedSite={selectedSite}
            onSiteChange={handleSiteChange}
            skillLevel={skillLevel}
          />

          {showComparison ? (
            /* Side-by-Side Scenario Comparison */
            <div className="mt-6">
              <ScenarioComparison
                siteA={selectedSite}
                dateA={selectedDate}
                skillLevel={skillLevel}
              />
            </div>
          ) : (
            /* Main Visualization Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* 3D Lunar Surface View - 8 columns */}
              <div className="lg:col-span-8 h-[640px] rounded-xl overflow-hidden glass-panel">
                <LunarSurface3D
                  site={selectedSite}
                  ephemeris={ephemeris}
                  date={selectedDate}
                />
              </div>

              {/* Right column: 360° Horizon Sky View + 2D Regional Map - 4 columns */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* 360° Local Horizon Sky-Dome */}
                <div className="h-[310px] glass-panel rounded-xl overflow-hidden p-4">
                  <HorizonSkyView
                    site={selectedSite}
                    ephemeris={ephemeris}
                    timeline={timeline}
                    skillLevel={skillLevel}
                  />
                </div>

                {/* 2D Regional Map with Crater Topography & Sun Vector */}
                <div className="h-[306px] glass-panel rounded-xl overflow-hidden p-4">
                  <RegionalMap2D
                    selectedSite={selectedSite}
                    onSiteChange={handleSiteChange}
                    ephemeris={ephemeris}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Multi-Track Timeline Controller */}
        <TimelineController
          date={selectedDate}
          onDateChange={handleDateChange}
          timeline={timeline}
          isPlaying={isPlaying}
          onPlayToggle={() => setIsPlaying(!isPlaying)}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          skillLevel={skillLevel}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-space-black flex items-center justify-center text-text-muted text-sm font-mono">
          INITIALIZING LUNAR LANDING SITE NAVIGATOR...
        </div>
      }
    >
      <NavigatorContent />
    </Suspense>
  );
}
