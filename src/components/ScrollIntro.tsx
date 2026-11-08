"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Rocket, Sun, Globe, ArrowDown, Zap } from "lucide-react";

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
        {/* Star field background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.4) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.5) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 80% 60%, rgba(255,255,255,0.3) 0%, transparent 100%), " +
              "radial-gradient(1.5px 1.5px at 10% 80%, rgba(255,255,255,0.7) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 70% 50%, rgba(255,255,255,0.4) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.5) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 50% 90%, rgba(255,255,255,0.3) 0%, transparent 100%), " +
              "radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.4) 0%, transparent 100%), " +
              "radial-gradient(1.5px 1.5px at 85% 35%, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />

        {/* Moon glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-t from-gray-300/10 via-gray-400/5 to-transparent blur-3xl" />

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
            {/* Visual — Moon with dramatic terminator */}
            <div className="relative flex items-center justify-center">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full relative overflow-hidden">
                {/* Lit hemisphere */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/60 to-gray-200/30 rounded-full" />
                {/* Dark hemisphere */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900/90 rounded-full" />
                {/* Surface texture */}
                <div
                  className="absolute inset-0 rounded-full opacity-40"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 40%, rgba(100,100,100,0.3) 0%, transparent 40%), " +
                      "radial-gradient(circle at 60% 60%, rgba(80,80,80,0.2) 0%, transparent 30%), " +
                      "radial-gradient(circle at 45% 75%, rgba(60,60,60,0.4) 0%, transparent 25%)",
                  }}
                />
                {/* South pole highlight */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent-gold/80 blur-sm" />
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-gold" />
              </div>
              {/* Sun indicator */}
              <Sun className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 text-accent-gold/60" />
            </div>

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

            {/* Visual — Horizon silhouette with wobbling Earth */}
            <div className="order-1 md:order-2 relative h-56 flex items-end justify-center">
              {/* Sky dome */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-space-deep rounded-2xl" />

              {/* Terrain silhouette */}
              <svg
                viewBox="0 0 400 120"
                className="relative z-10 w-full h-32"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,100 Q20,85 40,90 Q60,75 80,85 Q100,50 120,65 Q140,45 160,55 Q180,40 200,45 Q220,50 240,55 Q260,65 280,50 Q300,60 320,70 Q340,80 360,75 Q380,85 400,90 L400,120 L0,120 Z"
                  fill="#1a1d24"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
              </svg>

              {/* Earth icon wobbling */}
              <motion.div
                className="absolute top-6 right-20 z-20"
                animate={{
                  x: [0, 12, 0, -12, 0],
                  y: [0, -8, 4, -8, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Globe className="w-8 h-8 text-accent-blue" />
              </motion.div>

              {/* Libration label */}
              <div className="absolute top-4 right-4 text-xs text-text-muted font-mono z-20">
                ±7.9° lon / ±6.7° lat
              </div>
            </div>
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

            {/* Blurred Non-Interactive 3D Workspace Preview */}
            {workspacePreview && (
              <div className="relative mt-12 w-full max-w-6xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep/60 shadow-2xl">
                  {/* Blurred and non-interactive preview container */}
                  <div className="filter blur-[6px] opacity-65 pointer-events-none select-none transition-all duration-700 overflow-hidden max-h-[75vh]">
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
          </div>
        </IntroCard>
      </section>
    </div>
  );
}

