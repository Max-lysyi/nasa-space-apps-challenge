"use client";

import { useState } from "react";
import {
  MapPin,
  ChevronDown,
  Plus,
  Star,
  Globe,
  Rocket,
  Flag,
} from "lucide-react";
import type { LandingSite, SkillLevel } from "@/lib/types";
import { CURATED_SITES, createCustomSite } from "@/lib/landingSites";

interface SiteSelectorProps {
  selectedSite: LandingSite;
  onSiteChange: (site: LandingSite) => void;
  skillLevel: SkillLevel;
}

const categoryIcons: Record<string, React.ReactNode> = {
  artemis: <Rocket className="w-3.5 h-3.5 text-accent-gold" />,
  clps: <Star className="w-3.5 h-3.5 text-accent-emerald" />,
  apollo: <Flag className="w-3.5 h-3.5 text-text-secondary" />,
  international: <Globe className="w-3.5 h-3.5 text-accent-blue" />,
  custom: <MapPin className="w-3.5 h-3.5 text-accent-red" />,
};

const categoryLabels: Record<string, string> = {
  artemis: "Artemis / CLPS Target",
  clps: "CLPS Target",
  apollo: "Historic Apollo",
  international: "International",
  custom: "Custom",
};

export function SiteSelector({
  selectedSite,
  onSiteChange,
  skillLevel,
}: SiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customLat, setCustomLat] = useState("-89.0");
  const [customLon, setCustomLon] = useState("180.0");
  const [customElev, setCustomElev] = useState("0");
  const [customName, setCustomName] = useState("");

  const handleCustomSubmit = () => {
    const site = createCustomSite(
      parseFloat(customLat),
      parseFloat(customLon),
      parseFloat(customElev),
      customName || undefined,
    );
    onSiteChange(site);
    setShowCustom(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selected Site Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-panel rounded-xl p-4 md:p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
      >
        {categoryIcons[selectedSite.category]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">
              {selectedSite.name}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted flex-shrink-0">
              {categoryLabels[selectedSite.category]}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 font-mono">
            {selectedSite.latitude.toFixed(2)}°
            {selectedSite.latitude >= 0 ? "N" : "S"},{" "}
            {selectedSite.longitude.toFixed(2)}°E · Elev:{" "}
            {selectedSite.elevation > 0 ? "+" : ""}
            {selectedSite.elevation.toLocaleString()}m
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-panel rounded-xl p-3 max-h-96 overflow-y-auto">
          {CURATED_SITES.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                onSiteChange(site);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                selectedSite.id === site.id
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              {categoryIcons[site.category]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {site.name}
                </p>
                <p className="text-[10px] text-text-muted font-mono">
                  {site.latitude.toFixed(2)}°
                  {site.latitude >= 0 ? "N" : "S"},{" "}
                  {site.longitude.toFixed(1)}°E · {site.elevation > 0 ? "+" : ""}
                  {site.elevation.toLocaleString()}m
                </p>
                {skillLevel === "educator" && (
                  <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                    {site.description}
                  </p>
                )}
              </div>
            </button>
          ))}

          {/* Custom coordinates */}
          <div className="border-t border-white/10 mt-2 pt-2">
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-accent-blue" />
                <span className="text-sm text-accent-blue font-medium">
                  Custom Coordinates
                </span>
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <input
                  type="text"
                  placeholder="Site name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-text-muted outline-none focus:border-accent-blue/50"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-text-muted">
                      Latitude (°)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-accent-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted">
                      Longitude (°E)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={customLon}
                      onChange={(e) => setCustomLon(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-accent-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted">
                      Elevation (m)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={customElev}
                      onChange={(e) => setCustomElev(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-accent-blue/50"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomSubmit}
                  className="w-full bg-accent-blue/20 border border-accent-blue/30 text-accent-blue text-sm font-medium py-1.5 rounded-lg hover:bg-accent-blue/30 transition-colors cursor-pointer"
                >
                  Add Site
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

