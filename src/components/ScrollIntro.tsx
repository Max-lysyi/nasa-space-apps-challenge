"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Rocket, ArrowDown, Zap } from "lucide-react";

interface ScrollIntroProps {
  onLaunch: () => void;
  workspacePreview?: React.ReactNode;
}

function IntroCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollIntro({ onLaunch, workspacePreview }: ScrollIntroProps) {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-text-muted text-sm tracking-[0.3em] uppercase mb-4">
            2026 NASA Space Apps Challenge
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            LUNAR LANDING
            <br />
            SITE NAVIGATOR
          </h1>
          <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Evaluate candidate landing sites at the Moon&apos;s south pole.
            Visualize Sun &amp; Earth positions, power windows, and communication
            links — in seconds.
          </p>

          {/* Quick launch button in Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={onLaunch}
              className="group px-7 py-3.5 bg-accent-gold/20 hover:bg-accent-gold/30 border border-accent-gold/40 hover:border-accent-gold text-accent-gold font-semibold rounded-full text-sm cursor-pointer transition-all shadow-xl shadow-accent-gold/10 hover:scale-105 active:scale-95 flex items-center gap-2.5 animate-pulse-glow"
            >
              <Rocket className="w-4 h-4 text-accent-gold transition-transform group-hover:-translate-y-0.5" />
              <span>Launch Mission Navigator</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 z-10 flex flex-col items-center gap-2 text-text-muted"
        >
          <span className="text-xs tracking-widest uppercase">
            Scroll to explore
          </span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Card 1 — THE SOUTH POLE PARADOX */}
      <section className="max-w-6xl mx-auto px-8 md:px-16 min-h-[85vh] flex flex-col justify-center py-24">
        <IntroCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* 3D Moon Placeholder Spacer (Left Column) — lets the 3D Moon with Artemis Flag shine through */}
            <div className="h-72 md:h-96 flex items-center justify-center pointer-events-none" />

            <div>
              <p className="text-accent-gold text-sm font-mono tracking-[0.2em] uppercase mb-3">
                01 / Understanding the Challenge
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                THE SOUTH POLE
                <br />
                PARADOX
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                The Moon&apos;s tiny{" "}
                <span className="text-white font-semibold">1.54° axial tilt</span>{" "}
                creates a landscape of extremes at the south pole.{" "}
                <span className="text-accent-gold font-semibold">
                  Peaks of Eternal Light
                </span>{" "}
                — ridges bathed in near-continuous sunlight — exist just meters
                from{" "}
                <span className="text-accent-blue font-semibold">
                  Permanently Shadowed Regions
                </span>{" "}
                where temperatures plunge to −230 °C.
              </p>
              <p className="text-text-secondary leading-relaxed">
                This makes the lunar south pole the most valuable — and most
                challenging — real estate in the solar system for landing missions.
              </p>
            </div>
          </div>
        </IntroCard>
      </section>

      {/* Card 2 — VACUUM HORIZONS */}
      <section className="max-w-6xl mx-auto px-8 md:px-16 min-h-[85vh] flex flex-col justify-center py-24">
        <IntroCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 md:order-1">
              <p className="text-accent-blue text-sm font-mono tracking-[0.2em] uppercase mb-3">
                02 / Why Terrain Matters
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                VACUUM HORIZONS
                <br />
                <span className="text-accent-blue">&amp; EARTH LIBRATION</span>
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Zero atmosphere means{" "}
                <span className="text-white font-semibold">
                  zero refraction
                </span>
                . On the Moon, the only horizon is the physical terrain — local
                crater ridges are what block both sunlight and Direct-to-Earth
                (DTE) radio links.
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                Earth wobbles{" "}
                <span className="text-accent-blue font-semibold">
                  ±6.7° latitude / ±7.9° longitude
                </span>{" "}
                near the lunar horizon due to{" "}
                <span className="text-white font-semibold">
                  optical libration
                </span>
                . A ridge just 2° high can block DTE communication for days.
              </p>
            </div>

            {/* 3D Satellite & Moon Placeholder Spacer (Right Column) — lets the 3D Moon & orbiting satellite shine through */}
            <div className="order-1 md:order-2 h-72 md:h-96 flex items-center justify-center pointer-events-none" />
          </div>
        </IntroCard>
      </section>

      {/* Card 3 — AGILE MISSION PLANNING */}
      <section className="max-w-6xl mx-auto px-8 md:px-16 min-h-[85vh] flex flex-col justify-center py-24">
        <IntroCard>
          <div className="max-w-4xl mx-auto text-center">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <p className="text-accent-emerald text-sm font-mono tracking-[0.2em] uppercase mb-3">
                03 / Why This Tool Exists
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                AGILE MISSION PLANNING
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Hardware delays, launch window slips, and landing dispersion
                ellipses mean plans change constantly. A{" "}
                <span className="text-white font-semibold">500-meter shift</span>{" "}
                off a ridge into a crater, or a{" "}
                <span className="text-white font-semibold">2-week delay</span>,
                can turn{" "}
                <span className="text-accent-emerald font-semibold">
                  89% sunlight
                </span>{" "}
                into{" "}
                <span className="text-accent-red font-semibold">
                  12% shadow
                </span>
                .
              </p>
            </div>

            {/* Before / After gauges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: false }}
                className="glass-panel p-6 w-48"
              >
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Ridge Crest
                </p>
                <p className="text-4xl font-bold text-accent-emerald telemetry-value">
                  89%
                </p>
                <p className="text-sm text-text-secondary mt-1">sunlit</p>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-emerald rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "89%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    viewport={{ once: false }}
                  />
                </div>
              </motion.div>

              <Zap className="w-6 h-6 text-text-muted rotate-90 sm:rotate-0" />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: false }}
                className="glass-panel p-6 w-48"
              >
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  500m into Crater
                </p>
                <p className="text-4xl font-bold text-accent-red telemetry-value">
                  12%
                </p>
                <p className="text-sm text-text-secondary mt-1">sunlit</p>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-red rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "12%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    viewport={{ once: false }}
                  />
                </div>
              </motion.div>
            </div>


          </div>
        </IntroCard>
      </section>
      <section className="max-w-6xl mx-auto px-8 md:px-16 min-h-[85vh] flex flex-col justify-center py-24">
        <IntroCard>
          {/* Blurred Non-Interactive 3D Workspace Preview */}
          {workspacePreview && (
            <div className="relative mt-12 w-full max-w-6xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep/60 shadow-2xl">
                {/* Blurred and non-interactive preview container */}
                <div className="filter blur-[3px] opacity-65 pointer-events-none select-none transition-all duration-700 overflow-hidden max-h-[75vh]">
                  {workspacePreview}
                </div>

                {/* Smooth radial dark gradient overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(3,5,8,0.3) 0%, rgba(3,5,8,0.7) 60%, rgba(3,5,8,0.95) 100%)",
                  }}
                />

                {/* Centered glowing amber CTA button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30">
                  <p className="text-xs uppercase tracking-widest text-text-muted mb-4 font-mono">
                    Tactical HUD · Real-Time Ephemeris Ready
                  </p>
                  <button
                    onClick={onLaunch}
                    className="pointer-events-auto z-30 px-8 py-4 bg-gradient-to-r from-accent-gold/30 via-accent-gold/20 to-accent-gold/30 hover:from-accent-gold/40 hover:to-accent-gold/40 border border-accent-gold/60 rounded-full text-accent-gold font-bold text-lg shadow-2xl shadow-accent-gold/30 scale-105 hover:scale-110 transition-transform cursor-pointer flex items-center gap-3 animate-pulse-glow"
                  >
                    <span>🚀</span> Launch Mission Navigator
                  </button>
                </div>
              </div>
            </div>
          )}
        </IntroCard>
      </section>
    </div>
  );
}

