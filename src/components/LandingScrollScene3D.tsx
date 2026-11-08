"use client";

import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";

// ── 3D NASA / Artemis Flag & Glowing South Pole Beacon ───────────────────────
function ArtemisFlagAndBeacon({
  alphaRef,
}: {
  alphaRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const flagWaveRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flagWaveRef.current) {
      flagWaveRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 4.0) * 0.18;
    }
    if (groupRef.current) {
      const a = alphaRef.current;
      groupRef.current.visible = a > 0.01;
      groupRef.current.scale.setScalar(Math.max(0.001, a));
    }
  });

  return (
    // Positioned at the lunar South Pole, tilted slightly toward viewer for high camera visibility
    <group ref={groupRef} position={[0, -0.99, 0.12]} rotation={[Math.PI + 0.22, 0, 0]}>
      {/* Intense glowing South Pole beacon */}
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <pointLight color="#f59e0b" intensity={5.0} distance={3.5} />

      {/* Pulsing beacon ground halo concentric rings */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.16, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.24, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Flagpole - taller & thicker */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.56, 12]} />
        <meshStandardMaterial
          color="#f3f4f6"
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
      {/* Gold spherical finial at top of pole */}
      <mesh position={[0, 0.57, 0]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Larger NASA / Artemis Flag cloth (0.32 x 0.20) */}
      <group position={[0, 0.44, 0]}>
        <mesh ref={flagWaveRef} position={[0.16, 0, 0]}>
          <planeGeometry args={[0.32, 0.20]} />
          <meshStandardMaterial
            color="#1e3a8a"
            roughness={0.5}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Artemis Red accent chevron/stripe */}
        <mesh position={[0.16, 0.015, 0.003]}>
          <planeGeometry args={[0.32, 0.045]} />
          <meshBasicMaterial
            color="#ef4444"
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* White star cluster */}
        <mesh position={[0.07, 0.035, 0.004]}>
          <circleGeometry args={[0.022, 16]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ── 3D Lunar Relay Satellite with Solar Wings & Communication Beam ──────────
function RelaySatellite({
  alphaRef,
}: {
  alphaRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const satRef = useRef<THREE.Group>(null);
  const beamMeshRef = useRef<THREE.Mesh>(null);
  const satPosVec = useRef(new THREE.Vector3());
  const polePosVec = useRef(new THREE.Vector3(0, -1.0, 0));
  const midPosVec = useRef(new THREE.Vector3());
  const dirVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state) => {
    const a = alphaRef.current;
    if (groupRef.current) {
      groupRef.current.visible = a > 0.01;
      groupRef.current.scale.setScalar(Math.max(0.001, a));
    }
    if (a <= 0.01) return;

    if (satRef.current) {
      const t = state.clock.elapsedTime * 0.9;
      const orbitRadius = 1.85;

      // Inclined orbit around the Moon
      satRef.current.position.x = Math.cos(t) * orbitRadius;
      satRef.current.position.y = Math.sin(t * 1.1) * 0.7 - 0.25;
      satRef.current.position.z = Math.sin(t) * orbitRadius;

      // Always aim communication dish toward South Pole [0, -1, 0]
      satRef.current.lookAt(0, -1.0, 0);

      // Update 3D cylindrical laser communication beam
      if (beamMeshRef.current) {
        satPosVec.current.copy(satRef.current.position);
        midPosVec.current
          .addVectors(satPosVec.current, polePosVec.current)
          .multiplyScalar(0.5);
        dirVec.current
          .subVectors(satPosVec.current, polePosVec.current)
          .normalize();
        const dist = satPosVec.current.distanceTo(polePosVec.current);

        beamMeshRef.current.position.copy(midPosVec.current);
        beamMeshRef.current.scale.set(1, dist, 1);
        beamMeshRef.current.quaternion.setFromUnitVectors(
          upVec.current,
          dirVec.current
        );

        const mat = beamMeshRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 7) * 0.3;
          mat.opacity = Math.min(1, a * pulse);
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inclined orbital path ring */}
      <mesh rotation={[0.45, 0.25, 0.2]}>
        <torusGeometry args={[1.85, 0.004, 8, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </mesh>

      {/* Orbiting Satellite Body */}
      <group ref={satRef}>
        {/* Gold foil Multi-Layer Insulation (MLI) bus */}
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.2]} />
          <meshStandardMaterial
            color="#eab308"
            metalness={0.92}
            roughness={0.25}
          />
        </mesh>

        {/* Photovoltaic Solar Array Wings */}
        <mesh position={[0.32, 0, 0]}>
          <boxGeometry args={[0.42, 0.12, 0.015]} />
          <meshStandardMaterial
            color="#1d4ed8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[-0.32, 0, 0]}>
          <boxGeometry args={[0.42, 0.12, 0.015]} />
          <meshStandardMaterial
            color="#1d4ed8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Parabolic Dish Antenna */}
        <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.015, 0.05, 16, 1, true]} />
          <meshStandardMaterial
            color="#f1f5f9"
            metalness={0.95}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Pulsing Cyan Communication Beam to the South Pole */}
      <mesh ref={beamMeshRef}>
        <cylinderGeometry args={[0.007, 0.007, 1, 8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ── 3D CLPS Lunar Lander & 500m Dispersion Target Rings ─────────────────────
function CLPSLanderAndDispersionTargets({
  alphaRef,
}: {
  alphaRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const landerRef = useRef<THREE.Group>(null);
  const thrusterPlumeRef = useRef<THREE.Mesh>(null);
  const lidarConeRef = useRef<THREE.Mesh>(null);
  const greenPulseRef = useRef<THREE.Mesh>(null);
  const redPulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const a = alphaRef.current;
    if (groupRef.current) {
      groupRef.current.visible = a > 0.01;
      groupRef.current.scale.setScalar(Math.max(0.001, a));
    }
    if (a <= 0.01) return;

    const t = state.clock.elapsedTime;

    // Hovering & descending motion for CLPS Lunar Lander
    if (landerRef.current) {
      landerRef.current.position.y = 1.25 + Math.sin(t * 1.6) * 0.06;
      landerRef.current.position.x = -0.08 + Math.cos(t * 1.1) * 0.04;
      landerRef.current.rotation.z = Math.sin(t * 1.3) * 0.05;
      landerRef.current.rotation.x = Math.cos(t * 1.5) * 0.04;
    }

    // Flickering cyan retro-propulsion thruster plume
    if (thrusterPlumeRef.current) {
      const flicker = 0.85 + Math.sin(t * 24) * 0.15;
      thrusterPlumeRef.current.scale.set(1, flicker, 1);
      const mat = thrusterPlumeRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = (0.7 + Math.sin(t * 18) * 0.25) * a;
    }

    // Scanning LiDAR cone oscillating between Green Ridge Target and Red Crater Hazard
    if (lidarConeRef.current) {
      const sweep = Math.sin(t * 2.4);
      lidarConeRef.current.rotation.z = sweep * 0.26;
      const mat = lidarConeRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = (0.28 + Math.sin(t * 8) * 0.12) * a;
    }

    // Target rings pulsing
    if (greenPulseRef.current) {
      const pScale = 1.0 + Math.sin(t * 3.5) * 0.15;
      greenPulseRef.current.scale.setScalar(pScale);
    }
    if (redPulseRef.current) {
      const pScale = 1.0 + Math.sin(t * 3.5 + Math.PI) * 0.15;
      redPulseRef.current.scale.setScalar(pScale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── 500m LANDING DISPERSION TARGET RINGS (On Lunar Surface) ── */}

      {/* Target A: Emerald Green (89% Sunlit Ridge) */}
      <group position={[-0.24, 0.90, 0.38]} rotation={[-0.42, -0.22, 0.15]}>
        {/* Outer targeting ring */}
        <mesh>
          <ringGeometry args={[0.075, 0.09, 32]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        {/* Pulsing inner ring */}
        <mesh ref={greenPulseRef}>
          <ringGeometry args={[0.04, 0.055, 32]} />
          <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
        {/* Center reticle dot */}
        <mesh>
          <circleGeometry args={[0.018, 16]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
        </mesh>
        {/* Ground illumination */}
        <pointLight color="#10b981" intensity={2.0} distance={1.2} />
      </group>

      {/* Target B: Crimson Red (12% Shadow Crater — 500m Offset Hazard) */}
      <group position={[0.08, 0.88, 0.44]} rotation={[-0.45, 0.10, -0.08]}>
        {/* Outer hazard warning ring */}
        <mesh>
          <ringGeometry args={[0.075, 0.09, 32]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        {/* Pulsing hazard ring */}
        <mesh ref={redPulseRef}>
          <ringGeometry args={[0.04, 0.055, 32]} />
          <meshBasicMaterial color="#f87171" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
        {/* Center hazard cross */}
        <mesh>
          <boxGeometry args={[0.04, 0.008, 0.002]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.008, 0.04, 0.002]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Hazard ground warning light */}
        <pointLight color="#ef4444" intensity={2.0} distance={1.2} />
      </group>

      {/* Connecting 500m Dispersion Baseline Bar */}
      <group position={[-0.08, 0.89, 0.41]} rotation={[-0.43, -0.06, 0.05]}>
        <mesh>
          <boxGeometry args={[0.31, 0.005, 0.004]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.7} />
        </mesh>
        {/* Central 500m diamond marker */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.025, 0.025, 0.005]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* ── 3D CLPS LUNAR LANDER SPACECRAFT ── */}
      <group ref={landerRef} position={[-0.08, 1.25, 0.50]}>
        {/* Main Descent Stage Body (Golden Multi-Layer Insulation) */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.11, 0.10, 8]} />
          <meshStandardMaterial
            color="#eab308"
            metalness={0.92}
            roughness={0.2}
          />
        </mesh>

        {/* Avionics & Equipment Upper Deck (Silver Metallic) */}
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.065, 0.075, 0.05, 8]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>

        {/* High Gain Communication Antenna Dish */}
        <mesh position={[0.05, 0.12, 0]} rotation={[0.4, 0.3, 0]}>
          <cylinderGeometry args={[0.04, 0.005, 0.015, 12, 1, true]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>

        {/* 4 Cantilevered Landing Gear Legs with Footpads */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <group key={i} rotation={[0, angle, 0]}>
            {/* Upper diagonal strut */}
            <mesh position={[0.11, -0.04, 0]} rotation={[0, 0, -0.7]}>
              <cylinderGeometry args={[0.005, 0.005, 0.13, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Lower footpad strut */}
            <mesh position={[0.16, -0.09, 0]} rotation={[0, 0, 0.2]}>
              <cylinderGeometry args={[0.004, 0.004, 0.07, 6]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Circular landing footpad */}
            <mesh position={[0.17, -0.12, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.004, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Main Descent Engine Bell Nozzle */}
        <mesh position={[0, -0.065, 0]}>
          <cylinderGeometry args={[0.018, 0.038, 0.04, 12, 1, true]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>

        {/* Glowing Blue/Cyan Retro-Propulsion Thruster Plume */}
        <group position={[0, -0.14, 0]}>
          <mesh ref={thrusterPlumeRef} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.035, 0.12, 16]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Inner core flame */}
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.018, 0.07, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Thruster point light */}
          <pointLight color="#38bdf8" intensity={2.5} distance={1.2} />
        </group>

        {/* Scanning LiDAR / Laser Hazard Detection Cone */}
        <mesh ref={lidarConeRef} position={[0, -0.32, 0]}>
          <coneGeometry args={[0.18, 0.48, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── Main Scene Internals (Earth, Moon, Motion Interpolation) ─────────────────
function CelestialScrollExperience({
  scrollProgressRef,
}: {
  scrollProgressRef: React.MutableRefObject<number>;
}) {
  const { viewport } = useThree();
  const currentProgress = useRef(0);
  const orbitTimeRef = useRef(0);

  // Load high-resolution realistic planetary textures
  const [moonMap, earthMap, earthNormal] = useTexture([
    "/textures/moon.jpg",
    "/textures/earth.jpg",
    "/textures/earth_normal.jpg",
  ]);

  const earthGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  const earthMeshRef = useRef<THREE.Mesh>(null);

  // Dynamic opacities tracked via mutable refs to prevent React 60fps re-renders
  const flagAlphaRef = useRef(0);
  const satAlphaRef = useRef(0);
  const landerAlphaRef = useRef(0);

  useFrame((state, delta) => {
    // Fast, responsive damping (responds immediately to scroll wheel/touchpad without trailing lag)
    const factor = 1 - Math.exp(-14 * delta);
    currentProgress.current = THREE.MathUtils.lerp(
      currentProgress.current,
      scrollProgressRef.current,
      factor
    );
    const p = currentProgress.current;

    // Continuous celestial axial rotations
    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y += delta * 0.12;
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.rotation.y += delta * 0.05;
    }

    // Responsive position multiplier based on viewport width
    const xResponsive = Math.min(1.0, Math.max(0.45, viewport.width / 9.5));

    // Target transforms for Moon
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.0;
    let targetRotX = 0;
    let targetRotZ = 0;

    let flagAlpha = 0;
    let satAlpha = 0;
    let landerAlpha = 0;

    // Earth transform
    let earthOpacity = 1.0;
    const earthScale = 1.35;
    const earthX = -0.4 * xResponsive;
    let earthY = 0.1;
    let earthZ = -0.8;

    // ── 5 PRECISE SCROLL FRAMES ─────────────────────────────────────────────

    // Frame 0: Hero (p: 0.00 -> 0.18)
    orbitTimeRef.current += delta * 0.55;
    const heroOrbitRadius = 2.7;
    const orbitX = Math.cos(orbitTimeRef.current) * heroOrbitRadius;
    const orbitY = Math.sin(orbitTimeRef.current * 0.8) * 0.55;
    const orbitZ = Math.sin(orbitTimeRef.current) * 1.8;

    if (p < 0.18) {
      // Stage 0: Hero — Moon orbits Earth; as user scrolls (0.02->0.18), Earth moves up/fades out, Moon glides left
      const t = p / 0.18;
      targetX = THREE.MathUtils.lerp(orbitX, -2.3 * xResponsive, t);
      targetY = THREE.MathUtils.lerp(orbitY, 0.0, t);
      targetZ = THREE.MathUtils.lerp(orbitZ, 0.4, t);
      targetScale = THREE.MathUtils.lerp(0.85, 1.6, t);
      targetRotX = THREE.MathUtils.lerp(0.1, 1.18, t);
      targetRotZ = THREE.MathUtils.lerp(0, 0.2, t);

      earthOpacity = Math.max(0, 1 - t * 1.5);
      earthY = THREE.MathUtils.lerp(0.1, 2.0, t);
      earthZ = THREE.MathUtils.lerp(-0.8, -6.0, t);
    } else if (p < 0.35) {
      // Frame 1: Section 01 / THE SOUTH POLE PARADOX (Moon rock-solid on LEFT)
      earthOpacity = 0;
      targetX = -2.3 * xResponsive;
      targetY = 0.0;
      targetZ = 0.4;
      targetScale = 1.6;
      targetRotX = 1.18;
      targetRotZ = 0.2;

      // Flag & South Pole beacon fully active
      const flagIn = Math.min(1, Math.max(0, (p - 0.18) / 0.04));
      const flagOut = Math.min(1, Math.max(0, (0.37 - p) / 0.04));
      flagAlpha = Math.min(flagIn, flagOut);
    } else if (p < 0.44) {
      // Transition from Frame 1 to Frame 2 (Crossing from Left to Right, finishes by 0.44)
      earthOpacity = 0;
      const t = (p - 0.35) / 0.09;
      const easeT = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(-2.3 * xResponsive, 2.3 * xResponsive, easeT);
      targetY = THREE.MathUtils.lerp(0.0, -0.05, easeT);
      targetZ = THREE.MathUtils.lerp(0.4, 0.5, easeT);
      targetScale = THREE.MathUtils.lerp(1.6, 1.5, easeT);
      targetRotX = THREE.MathUtils.lerp(1.18, 0.35, easeT);
      targetRotZ = THREE.MathUtils.lerp(0.2, -0.15, easeT);
    } else if (p < 0.58) {
      // Frame 2: Section 02 / VACUUM HORIZONS & EARTH LIBRATION (Moon rock-solid on RIGHT)
      earthOpacity = 0;
      targetX = 2.3 * xResponsive;
      targetY = -0.05;
      targetZ = 0.5;
      targetScale = 1.5;
      targetRotX = 0.35;
      targetRotZ = -0.15;

      // Relay Satellite orbiting on the right with cyan laser beam active
      const satIn = Math.min(1, Math.max(0, (p - 0.42) / 0.04));
      const satOut = Math.min(1, Math.max(0, (0.60 - p) / 0.04));
      satAlpha = Math.min(satIn, satOut);
    } else if (p < 0.65) {
      // Transition from Frame 2 to Frame 3 (Moving to lower right/center to frame 89% vs 12% cards)
      earthOpacity = 0;
      const t = (p - 0.58) / 0.07;
      const easeT = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(2.3 * xResponsive, 0.95 * xResponsive, easeT);
      targetY = THREE.MathUtils.lerp(-0.05, -0.65, easeT);
      targetZ = THREE.MathUtils.lerp(0.5, 0.65, easeT);
      targetScale = THREE.MathUtils.lerp(1.5, 1.55, easeT);
      targetRotX = THREE.MathUtils.lerp(0.35, 0.40, easeT);
      targetRotZ = THREE.MathUtils.lerp(-0.15, 0.05, easeT);
    } else if (p < 0.82) {
      // Frame 3: Section 03 / AGILE MISSION PLANNING (CLPS Lander & 500m Dispersion Targets)
      earthOpacity = 0;
      targetX = 0.95 * xResponsive;
      targetY = -0.65;
      targetZ = 0.65;
      targetScale = 1.55;
      targetRotX = 0.40;
      targetRotZ = 0.05;

      // 3D CLPS Lander, Green 89% Ridge target, Red 12% Crater hazard & scanning cone active
      const landerIn = Math.min(1, Math.max(0, (p - 0.62) / 0.04));
      const landerOut = Math.min(1, Math.max(0, (0.85 - p) / 0.04));
      landerAlpha = Math.min(landerIn, landerOut);
    } else if (p < 0.90) {
      // Transition from Frame 3 to Frame 4 (Transition to Dead Center Macro Horizon)
      earthOpacity = 0;
      const t = (p - 0.82) / 0.08;
      const easeT = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(0.95 * xResponsive, 0.0, easeT);
      targetY = THREE.MathUtils.lerp(-0.65, -0.55, easeT);
      targetZ = THREE.MathUtils.lerp(0.65, 1.25, easeT);
      targetScale = THREE.MathUtils.lerp(1.55, 2.4, easeT);
      targetRotX = THREE.MathUtils.lerp(0.40, 0.55, easeT);
      targetRotZ = THREE.MathUtils.lerp(0.05, 0.0, easeT);
    } else {
      // Frame 4: Section 04 / Blurred Simulator Preview (Dead Center Macro Horizon Close-Up)
      earthOpacity = 0;
      targetX = 0.0;
      targetY = -0.55;
      targetZ = 1.25;
      targetScale = 2.4;
      targetRotX = 0.55;
      targetRotZ = 0.0;
    }

    // Apply smooth transforms to Moon
    if (moonGroupRef.current) {
      moonGroupRef.current.position.x = targetX;
      moonGroupRef.current.position.y = targetY;
      moonGroupRef.current.position.z = targetZ;
      moonGroupRef.current.scale.setScalar(targetScale);
      moonGroupRef.current.rotation.x = targetRotX;
      moonGroupRef.current.rotation.z = targetRotZ;
    }

    // Apply smooth transforms to Earth
    if (earthGroupRef.current) {
      earthGroupRef.current.position.set(earthX, earthY, earthZ);
      earthGroupRef.current.scale.setScalar(earthScale);
      earthGroupRef.current.visible = earthOpacity > 0.01;
    }

    flagAlphaRef.current = flagAlpha;
    satAlphaRef.current = satAlpha;
    landerAlphaRef.current = landerAlpha;
  });

  return (
    <>
      {/* Deep Space Starfield Background */}
      <Stars
        radius={120}
        depth={60}
        count={6000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Realistic Space Lighting */}
      <ambientLight intensity={0.08} color="#a0b0d0" />
      {/* Grazing directional sunlight casting deep crater shadows */}
      <directionalLight position={[12, 1.8, 7]} intensity={3.2} color="#ffffff" />
      {/* Subtle backfill light from deep space */}
      <directionalLight position={[-10, -2, -5]} intensity={0.2} color="#1e3a8a" />

      {/* ── 3D Earth (Hero section) ────────────────────────────────────────── */}
      <group ref={earthGroupRef}>
        <mesh ref={earthMeshRef}>
          <sphereGeometry args={[1.35, 64, 64]} />
          <meshStandardMaterial
            map={earthMap}
            normalMap={earthNormal}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        {/* Atmospheric Blue Fresnel / Glow Shell */}
        <mesh>
          <sphereGeometry args={[1.39, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* ── 3D Photorealistic Moon with Bump & Features ─────────────────────── */}
      <group ref={moonGroupRef}>
        <mesh ref={moonMeshRef}>
          <sphereGeometry args={[1.0, 64, 64]} />
          <meshStandardMaterial
            map={moonMap}
            bumpMap={moonMap}
            bumpScale={0.04}
            roughness={0.92}
            metalness={0.02}
          />
        </mesh>

        {/* Section 01: 3D NASA / Artemis Flag & South Pole Beacon */}
        <ArtemisFlagAndBeacon alphaRef={flagAlphaRef} />

        {/* Section 02: 3D Orbiting Relay Satellite & Communication Beam */}
        <RelaySatellite alphaRef={satAlphaRef} />

        {/* Section 03: 3D CLPS Lander & 500m Dispersion Target Rings */}
        <CLPSLanderAndDispersionTargets alphaRef={landerAlphaRef} />
      </group>
    </>
  );
}

// ── Exported Fixed Full-Screen Background Component ──────────────────────────
export function LandingScrollScene3D() {
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      scrollProgressRef.current = Math.min(1, Math.max(0, scrollY / maxScroll));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <CelestialScrollExperience scrollProgressRef={scrollProgressRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
