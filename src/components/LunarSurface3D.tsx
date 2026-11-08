"use client";

import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import { Camera, Eye, Globe, ZoomIn } from "lucide-react";
import type { LandingSite, EphemerisResult, ViewMode } from "@/lib/types";
import { DEG_TO_RAD } from "@/lib/constants";
import { CURATED_SITES, createCustomSite } from "@/lib/landingSites";
import { subSolarPoint, computeLibration } from "@/lib/lunarEphemeris";

interface LunarSurface3DProps {
  site: LandingSite;
  ephemeris: EphemerisResult;
  date: Date;
  onSiteChange?: (site: LandingSite) => void;
}

// Generate terrain mesh from site's horizon mask profile
function TerrainMesh({ site }: { site: LandingSite }) {
  const geometry = useMemo(() => {
    const size = 10;
    const segments = 64;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);

      // Convert position to azimuth angle from center
      const azimuth =
        ((Math.atan2(z, x) * 180) / Math.PI + 360 + 90) % 360;
      const dist = Math.sqrt(x * x + z * z);

      // Get terrain height from horizon mask
      const azIdx = Math.floor(azimuth) % 360;
      const maskHeight = site.terrainProfile.horizonMask[azIdx];

      // Create terrain: raised edges based on horizon mask, flat center
      const edgeFactor = Math.pow(Math.min(dist / (size * 0.45), 1), 1.5);
      const height = edgeFactor * maskHeight * 0.06;

      // Add crater-like depression features
      const crater1 =
        Math.max(0, 0.3 - dist * 0.15) *
        Math.sin(azimuth * DEG_TO_RAD * 3) *
        0.1;
      const crater2 =
        Math.max(0, 0.2 - Math.abs(dist - 2.5) * 0.15) *
        Math.cos(azimuth * DEG_TO_RAD * 5) *
        0.05;

      positions.setZ(i, height + crater1 + crater2);
    }

    geo.computeVertexNormals();
    return geo;
  }, [site]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color="#8a8a8a"
        roughness={0.95}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

// Sun directional indicator
function SunIndicator({ ephemeris }: { ephemeris: EphemerisResult }) {
  const azRad = ephemeris.sun.azimuth * DEG_TO_RAD;
  const elevRad = Math.max(0, ephemeris.sun.elevation) * DEG_TO_RAD;
  const dist = 8;

  const x = dist * Math.sin(azRad) * Math.cos(elevRad);
  const y = dist * Math.sin(elevRad);
  const z = -dist * Math.cos(azRad) * Math.cos(elevRad);

  return (
    <group>
      {/* Sun directional light */}
      <directionalLight
        position={[x, Math.max(y, 0.5), z]}
        intensity={ephemeris.isSunVisible ? 2.5 : 0.05}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Sun sphere */}
      {ephemeris.isSunVisible && (
        <mesh position={[x, y, z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}

      {/* Sun direction line */}
      <Line
        points={[
          [0, 0.1, 0],
          [x * 0.6, y * 0.6, z * 0.6],
        ]}
        color="#f59e0b"
        lineWidth={1.5}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
    </group>
  );
}

// Earth indicator
function EarthIndicator({ ephemeris }: { ephemeris: EphemerisResult }) {
  const azRad = ephemeris.earth.azimuth * DEG_TO_RAD;
  const elevRad = Math.max(-0.1, ephemeris.earth.elevation * DEG_TO_RAD);
  const dist = 7;

  const x = dist * Math.sin(azRad) * Math.cos(elevRad);
  const y = dist * Math.sin(elevRad);
  const z = -dist * Math.cos(azRad) * Math.cos(elevRad);

  return (
    <group>
      {/* Earth sphere */}
      <mesh position={[x, Math.max(y, -0.5), z]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color={ephemeris.isEarthVisible ? "#3b82f6" : "#1e3a5f"}
        />
      </mesh>

      {/* Earth direction line */}
      <Line
        points={[
          [0, 0.1, 0],
          [x * 0.5, Math.max(y * 0.5, -0.3), z * 0.5],
        ]}
        color="#3b82f6"
        lineWidth={1.5}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
    </group>
  );
}

// Landing site pin for local terrain
function SitePin() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y =
        0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={ref} position={[0, 0.15, 0]}>
      <mesh>
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// Compass rose on the ground plane
function CompassRose() {
  const labels = [
    { text: "N", pos: [0, 0.01, -5.3] as [number, number, number] },
    { text: "S", pos: [0, 0.01, 5.3] as [number, number, number] },
    { text: "E", pos: [5.3, 0.01, 0] as [number, number, number] },
    { text: "W", pos: [-5.3, 0.01, 0] as [number, number, number] },
  ];

  return (
    <group>
      {labels.map((l) => (
        <Text
          key={l.text}
          position={l.pos}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.25}
          color="rgba(255,255,255,0.3)"
          anchorX="center"
          anchorY="middle"
        >
          {l.text}
        </Text>
      ))}
      {[2, 4].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[r - 0.01, r + 0.01, 64]} />
          <meshBasicMaterial
            color="white"
            transparent
            opacity={0.06}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── 3D Directional Vector Arrow for Globe View ──────────────────────────────
function VectorArrow({
  dir,
  length,
  color,
  label,
}: {
  dir: [number, number, number];
  length: number;
  color: string;
  label: string;
}) {
  const v = useMemo(() => new THREE.Vector3(...dir).normalize(), [dir]);
  const rot = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    return new THREE.Euler().setFromQuaternion(q);
  }, [v]);

  return (
    <group position={[v.x * 2.52, v.y * 2.52, v.z * 2.52]}>
      <group rotation={rot}>
        <mesh position={[0, length * 0.45, 0]}>
          <cylinderGeometry args={[0.02, 0.02, length * 0.9, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, length * 0.95, 0]}>
          <coneGeometry args={[0.065, 0.15, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      <Html position={[v.x * length * 1.05, v.y * length * 1.05, v.z * length * 1.05]} center distanceFactor={12}>
        <div
          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase whitespace-nowrap shadow-lg pointer-events-none"
          style={{ backgroundColor: color, color: "#000" }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

// ── Interactive Site Pin on 3D Moon Globe ───────────────────────────────────
function SitePinOnGlobe({
  s,
  isSelected,
  onSelect,
  onZoom,
}: {
  s: LandingSite;
  isSelected: boolean;
  onSelect: () => void;
  onZoom: () => void;
}) {
  const R = 2.5;
  const phi = s.latitude * DEG_TO_RAD;
  const lam = s.longitude * DEG_TO_RAD;
  const x = -R * Math.cos(phi) * Math.sin(lam);
  const y = R * Math.sin(phi);
  const z = R * Math.cos(phi) * Math.cos(lam);

  const norm = useMemo(() => new THREE.Vector3(x, y, z).normalize(), [x, y, z]);
  const rot = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
    return new THREE.Euler().setFromQuaternion(q);
  }, [norm]);

  return (
    <group position={[x, y, z]}>
      <group rotation={rot}>
        {/* Shaft */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
          <meshBasicMaterial color={isSelected ? "#f59e0b" : "#ef4444"} />
        </mesh>
        {/* Sphere head */}
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={isSelected ? "#f59e0b" : "#ef4444"} />
        </mesh>
        {/* Pulsing ring on active site */}
        {isSelected && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.12, 32]} />
            <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* Interactive floating label badge */}
      <Html position={[norm.x * 0.35, norm.y * 0.35, norm.z * 0.35]} center distanceFactor={10}>
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onSelect();
              onZoom();
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap cursor-pointer transition-all shadow-xl ${
              isSelected
                ? "bg-accent-gold text-black font-bold ring-2 ring-accent-gold/60 scale-105"
                : "bg-black/85 text-white/90 border border-white/20 hover:bg-white/20"
            }`}
            title="Click to select · Double-click to zoom into terrain"
          >
            {s.shortName}
          </button>
        </div>
      </Html>
    </group>
  );
}

// ── Full 3D Moon Globe View Component ───────────────────────────────────────
function MoonGlobeView({
  date,
  selectedSite,
  onSiteChange,
  onZoomToTerrain,
}: {
  date: Date;
  selectedSite: LandingSite;
  onSiteChange?: (site: LandingSite) => void;
  onZoomToTerrain: () => void;
}) {
  const moonTexture = useTexture("/textures/moon.jpg");
  const subSolar = useMemo(() => subSolarPoint(date), [date]);
  const libration = useMemo(() => computeLibration(date), [date]);

  const sunLatRad = subSolar.latDeg * DEG_TO_RAD;
  const sunLonRad = subSolar.lonDeg * DEG_TO_RAD;
  const sunDir: [number, number, number] = [
    -Math.cos(sunLatRad) * Math.sin(sunLonRad),
    Math.sin(sunLatRad),
    Math.cos(sunLatRad) * Math.cos(sunLonRad),
  ];

  const earthLatRad = libration.latDeg * DEG_TO_RAD;
  const earthLonRad = libration.lonDeg * DEG_TO_RAD;
  const earthDir: [number, number, number] = [
    -Math.cos(earthLatRad) * Math.sin(earthLonRad),
    Math.sin(earthLatRad),
    Math.cos(earthLatRad) * Math.cos(earthLonRad),
  ];

  const handleGlobeClick = (e: { stopPropagation: () => void; point?: THREE.Vector3 }) => {
    e.stopPropagation();
    if (!e.point || !onSiteChange) return;
    const p = e.point;
    const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    const ny = p.y / r;
    const lat = Math.asin(Math.max(-1, Math.min(1, ny))) * (180 / Math.PI);
    const lon = ((Math.atan2(-p.x, p.z) * 180 / Math.PI) + 360) % 360;
    const custom = createCustomSite(
      parseFloat(lat.toFixed(2)),
      parseFloat(lon.toFixed(2)),
      0,
      `Target (${lat.toFixed(1)}°, ${lon.toFixed(1)}°E)`
    );
    onSiteChange(custom);
  };

  return (
    <group>
      {/* Real-time Sun Directional Light matching terminator */}
      <directionalLight
        position={[sunDir[0] * 18, sunDir[1] * 18, sunDir[2] * 18]}
        intensity={3.2}
        color="#fff8ea"
      />
      {/* Subtle space ambient backlight */}
      <ambientLight intensity={0.06} color="#94a3b8" />

      {/* 3D Moon Globe Sphere */}
      <mesh onClick={handleGlobeClick}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial
          map={moonTexture}
          bumpMap={moonTexture}
          bumpScale={0.035}
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>

      {/* Sun & Earth 3D Directional Vector Arrows */}
      <VectorArrow dir={sunDir} length={1.3} color="#f59e0b" label="☀️ SUN" />
      <VectorArrow dir={earthDir} length={1.3} color="#3b82f6" label="🌍 EARTH" />

      {/* All Curated Landing Site Pins */}
      {CURATED_SITES.map((s) => (
        <SitePinOnGlobe
          key={s.id}
          s={s}
          isSelected={s.id === selectedSite.id}
          onSelect={() => onSiteChange?.(s)}
          onZoom={onZoomToTerrain}
        />
      ))}

      {/* Render active custom site if not curated */}
      {selectedSite.category === "custom" && (
        <SitePinOnGlobe
          s={selectedSite}
          isSelected={true}
          onSelect={() => {}}
          onZoom={onZoomToTerrain}
        />
      )}
    </group>
  );
}

// Scene component handling views
function Scene({
  site,
  ephemeris,
  viewMode,
  date,
  onSiteChange,
  setViewMode,
}: {
  site: LandingSite;
  ephemeris: EphemerisResult;
  viewMode: ViewMode;
  date: Date;
  onSiteChange?: (site: LandingSite) => void;
  setViewMode: (v: ViewMode) => void;
}) {
  if (viewMode === "globe") {
    return (
      <>
        <MoonGlobeView
          date={date}
          selectedSite={site}
          onSiteChange={onSiteChange}
          onZoomToTerrain={() => setViewMode("orbital")}
        />
        <OrbitControls
          enablePan
          enableZoom
          minDistance={3.0}
          maxDistance={14}
          target={[0, 0, 0]}
        />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.08} color="#b0c4de" />
      <TerrainMesh site={site} />
      <SunIndicator ephemeris={ephemeris} />
      <EarthIndicator ephemeris={ephemeris} />
      <SitePin />
      <CompassRose />

      {viewMode === "orbital" ? (
        <OrbitControls
          enablePan
          enableZoom
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0, 0]}
        />
      ) : (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          target={[0, 1.5, -2]}
        />
      )}
    </>
  );
}

export function LunarSurface3D({
  site,
  ephemeris,
  date,
  onSiteChange,
}: LunarSurface3DProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("orbital");

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={
          viewMode === "globe"
            ? { position: [0, 1.2, 6.2], fov: 45 }
            : viewMode === "orbital"
              ? { position: [6, 5, 6], fov: 45 }
              : { position: [0, 0.3, 0.1], fov: 90 }
        }
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={["#030508"]} />
        {viewMode !== "globe" && <fog attach="fog" args={["#030508", 12, 20]} />}
        <Suspense fallback={null}>
          <Scene
            site={site}
            ephemeris={ephemeris}
            viewMode={viewMode}
            date={date}
            onSiteChange={onSiteChange}
            setViewMode={setViewMode}
          />
        </Suspense>
      </Canvas>

      {/* View mode toggle with 🌐 Globe Mode button */}
      <div className="absolute top-3 left-3 flex gap-1.5 z-20">
        <button
          onClick={() => setViewMode("orbital")}
          className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === "orbital"
              ? "bg-white/15 text-white font-medium"
              : "bg-white/5 text-text-muted hover:bg-white/10"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Orbital
        </button>
        <button
          onClick={() => setViewMode("surface")}
          className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === "surface"
              ? "bg-white/15 text-white font-medium"
              : "bg-white/5 text-text-muted hover:bg-white/10"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Surface
        </button>
        <button
          onClick={() => setViewMode("globe")}
          className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === "globe"
              ? "bg-accent-gold/25 text-accent-gold font-bold border border-accent-gold/40 shadow-lg shadow-accent-gold/10"
              : "bg-white/5 text-text-muted hover:bg-white/10"
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-accent-gold" />
          🌐 Globe
        </button>
      </div>

      {/* Quick Action when Globe is active: Zoom to Local Terrain */}
      {viewMode === "globe" && (
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={() => setViewMode("orbital")}
            className="px-3 py-1.5 bg-accent-gold/20 hover:bg-accent-gold/30 border border-accent-gold/50 rounded-lg text-accent-gold font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom to Local Terrain</span>
          </button>
        </div>
      )}

      {/* Site info overlay */}
      <div className="absolute bottom-4 left-4 text-[10px] text-text-muted font-mono bg-black/60 px-2.5 py-1.5 rounded-lg border border-white/10 z-10 backdrop-blur-sm">
        <span>
          {site.shortName} · {date.toISOString().slice(0, 16)}Z {viewMode === "globe" ? "· Full Lunar Globe" : ""}
        </span>
      </div>

      {/* Status indicators */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium ${
            ephemeris.isSunVisible
              ? "bg-accent-gold/20 text-accent-gold"
              : "bg-white/5 text-text-muted"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${ephemeris.isSunVisible ? "bg-accent-gold" : "bg-text-muted"}`}
          />
          {ephemeris.isSunVisible ? "SUNLIT" : "SHADOW"}
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium ${
            ephemeris.isEarthVisible
              ? "bg-accent-blue/20 text-accent-blue"
              : "bg-white/5 text-text-muted"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${ephemeris.isEarthVisible ? "bg-accent-blue" : "bg-text-muted"}`}
          />
          {ephemeris.isEarthVisible ? "DTE LINK" : "NO DTE"}
        </div>
      </div>
    </div>
  );
}
