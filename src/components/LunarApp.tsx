"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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

import { ScrollIntro } from "./ScrollIntro";
import { TelemetryBar } from "./TelemetryBar";
import { SiteSelector } from "./SiteSelector";
import { HorizonSkyView } from "./HorizonSkyView";
import { RegionalMap2D } from "./RegionalMap2D";
import { TimelineController } from "./TimelineController";
import { ScenarioComparison } from "./ScenarioComparison";
import { LunarSurface3D } from "./LunarSurface3D";

export function LunarApp() {
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ── Core state ────────────────────────────────────────────────────────────
  const [selectedSite, setSelectedSite] = useState<LandingSite>(
    CURATED_SITES[0],
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date("2026-03-15T12:00:00Z"),
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("educator");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>("1h");
  const [showComparison, setShowComparison] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // ── Computed data (memoised) ──────────────────────────────────────────────
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

  // ── Playback timer ────────────────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────────────
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
      {/* ── Scroll-Driven Intro ─────────────────────────────────────────────── */}
      {showIntro && (
        <ScrollIntro onLaunch={scrollToWorkspace} />
      )}

      {/* ── Mission Workspace ───────────────────────────────────────────────── */}
      <div ref={workspaceRef} className="relative min-h-screen">
        {/* Top Telemetry Bar */}
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
          {/* Site Selector */}
          <SiteSelector
            selectedSite={selectedSite}
            onSiteChange={handleSiteChange}
            skillLevel={skillLevel}
          />

          {showComparison ? (
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
              {/* 3D Surface View - 8 columns */}
              <div className="lg:col-span-8 h-[640px] rounded-xl overflow-hidden glass-panel">
                <LunarSurface3D
                  site={selectedSite}
                  ephemeris={ephemeris}
                  date={selectedDate}
                />
              </div>

              {/* Right column: Horizon + Map stacked - 4 columns */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* 360° Horizon Sky View */}
                <div className="h-[310px] glass-panel rounded-xl overflow-hidden p-4">
                  <HorizonSkyView
                    site={selectedSite}
                    ephemeris={ephemeris}
                    timeline={timeline}
                    skillLevel={skillLevel}
                  />
                </div>

                {/* 2D Regional Map */}
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

        {/* Bottom Timeline Controller */}
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

