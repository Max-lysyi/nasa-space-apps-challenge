"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { Camera, Eye } from "lucide-react";
import type { LandingSite, EphemerisResult } from "@/lib/types";
import type { ViewMode } from "@/lib/types";
import { DEG_TO_RAD } from "@/lib/constants";

interface LunarSurface3DProps {
  site: LandingSite;
  ephemeris: EphemerisResult;
  date: Date;
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

      // Add some crater-like depression features
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

// Landing site pin
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
      {/* Grid rings */}
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

// Scene component
function Scene({
  site,
  ephemeris,
  viewMode,
}: {
  site: LandingSite;
  ephemeris: EphemerisResult;
  viewMode: ViewMode;
}) {
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

export function LunarSurface3D({ site, ephemeris, date }: LunarSurface3DProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("orbital");

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={
          viewMode === "orbital"
            ? { position: [6, 5, 6], fov: 45 }
            : { position: [0, 0.3, 0.1], fov: 90 }
        }
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={["#030508"]} />
        <fog attach="fog" args={["#030508", 12, 20]} />
        <Scene site={site} ephemeris={ephemeris} viewMode={viewMode} />
      </Canvas>

      {/* View mode toggle */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        <button
          onClick={() => setViewMode("orbital")}
          className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === "orbital"
              ? "bg-white/15 text-white"
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
              ? "bg-white/15 text-white"
              : "bg-white/5 text-text-muted hover:bg-white/10"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Surface
        </button>
      </div>

      {/* Site info overlay */}
      <div className="absolute bottom-4 left-4 text-[10px] text-text-muted font-mono bg-black/60 px-2.5 py-1.5 rounded-lg border border-white/10 z-10 backdrop-blur-sm">
        <span>
          {site.shortName} · {date.toISOString().slice(0, 16)}Z
        </span>
      </div>

      {/* Status indicators */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
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

