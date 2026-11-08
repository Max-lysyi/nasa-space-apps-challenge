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
      flagWaveRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3.5) * 0.12;
    }
    if (groupRef.current) {
      const a = alphaRef.current;
      groupRef.current.visible = a > 0.01;
      groupRef.current.scale.setScalar(Math.max(0.001, a));
    }
  });

  return (
    // Positioned at the lunar South Pole (-Y axis of Moon sphere)
    <group ref={groupRef} position={[0, -1.005, 0]} rotation={[Math.PI, 0, 0]}>
      {/* Glowing South Pole surface beacon */}
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <pointLight color="#f59e0b" intensity={2.5} distance={2} />

      {/* Pulsing beacon ground halo */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.09, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Flagpole */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.36, 8]} />
        <meshStandardMaterial
          color="#e5e7eb"
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>

      {/* Flag cloth */}
      <group position={[0, 0.28, 0]}>
        <mesh ref={flagWaveRef} position={[0.09, 0, 0]}>
          <planeGeometry args={[0.18, 0.11]} />
          <meshStandardMaterial
            color="#1e3a8a"
            roughness={0.6}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Red accent stripe */}
        <mesh position={[0.09, 0.01, 0.002]}>
          <planeGeometry args={[0.18, 0.024]} />
          <meshBasicMaterial
            color="#ef4444"
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* White star dot */}
        <mesh position={[0.04, 0.02, 0.003]}>
          <circleGeometry args={[0.012, 12]} />
          <meshBasicMaterial color="#ffffff" />
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

  useFrame((state, delta) => {
    // Silky smooth dampening of scroll progress (reverses cleanly on scroll up!)
    currentProgress.current = THREE.MathUtils.lerp(
      currentProgress.current,
      scrollProgressRef.current,
      0.08
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

    // ── STAGE 0: HERO (p: 0.0 -> 0.16) ───────────────────────────────────────
    // Earth prominent in space, Moon in orbit around Earth
    orbitTimeRef.current += delta * 0.55;
    const heroOrbitRadius = 2.7;
    const orbitX = Math.cos(orbitTimeRef.current) * heroOrbitRadius;
    const orbitY = Math.sin(orbitTimeRef.current * 0.8) * 0.55;
    const orbitZ = Math.sin(orbitTimeRef.current) * 1.8;

    // Target transforms for Moon
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.0;
    let targetRotX = 0;
    let targetRotZ = 0;

    let flagAlpha = 0;
    let satAlpha = 0;

    // Earth transform
    let earthOpacity = 1.0;
    const earthScale = 1.35;
    const earthX = -0.5 * xResponsive;
    const earthY = 0.1;
    let earthZ = -0.8;

    if (p < 0.16) {
      // Stage 0: Hero
      const t = p / 0.16;
      targetX = THREE.MathUtils.lerp(orbitX, -2.4 * xResponsive, t);
      targetY = THREE.MathUtils.lerp(orbitY, 0.0, t);
      targetZ = THREE.MathUtils.lerp(orbitZ, 0.4, t);
      targetScale = THREE.MathUtils.lerp(0.85, 1.55, t);
      targetRotX = THREE.MathUtils.lerp(0.1, 1.15, t);
      targetRotZ = THREE.MathUtils.lerp(0, 0.18, t);

      earthOpacity = Math.max(0, 1 - t * 1.4);
      earthZ = THREE.MathUtils.lerp(-0.8, -7.0, t);
    } else if (p < 0.48) {
      // Stage 1: Section 01 — The South Pole Paradox (Moon at LEFT)
      earthOpacity = 0;
      targetX = -2.5 * xResponsive;
      targetY = 0.0;
      targetZ = 0.4;
      targetScale = 1.6;
      // Tilt Moon so South Pole faces viewer with grazing 1.54° sunlight
      targetRotX = 1.18;
      targetRotZ = 0.2;

      // Flag & Beacon visible during Section 01
      const flagFadeIn = Math.min(1, Math.max(0, (p - 0.2) / 0.08));
      const flagFadeOut = Math.min(1, Math.max(0, (0.48 - p) / 0.08));
      flagAlpha = Math.min(flagFadeIn, flagFadeOut);
    } else if (p < 0.54) {
      // Transition from Left to Right
      earthOpacity = 0;
      const t = (p - 0.48) / 0.06;
      const easeT = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(-2.5 * xResponsive, 2.4 * xResponsive, easeT);
      targetY = THREE.MathUtils.lerp(0.0, -0.05, easeT);
      targetZ = THREE.MathUtils.lerp(0.4, 0.5, easeT);
      targetScale = THREE.MathUtils.lerp(1.6, 1.5, easeT);
      targetRotX = THREE.MathUtils.lerp(1.18, 0.35, easeT);
      targetRotZ = THREE.MathUtils.lerp(0.2, -0.15, easeT);
    } else if (p < 0.76) {
      // Stage 2: Section 02 — Vacuum Horizons & Earth Libration (Moon at RIGHT)
      earthOpacity = 0;
      targetX = 2.4 * xResponsive;
      targetY = -0.05;
      targetZ = 0.5;
      targetScale = 1.5;
      targetRotX = 0.35;
      targetRotZ = -0.15;

      // Satellite orbiting with communication beam visible
      const satFadeIn = Math.min(1, Math.max(0, (p - 0.54) / 0.06));
      const satFadeOut = Math.min(1, Math.max(0, (0.76 - p) / 0.06));
      satAlpha = Math.min(satFadeIn, satFadeOut);
    } else if (p < 0.84) {
      // Transition from Right to Center Macro Close-up
      earthOpacity = 0;
      const t = (p - 0.76) / 0.08;
      const easeT = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(2.4 * xResponsive, 0.0, easeT);
      targetY = THREE.MathUtils.lerp(-0.05, -0.45, easeT);
      targetZ = THREE.MathUtils.lerp(0.5, 1.15, easeT);
      targetScale = THREE.MathUtils.lerp(1.5, 2.3, easeT);
      targetRotX = THREE.MathUtils.lerp(0.35, 0.5, easeT);
      targetRotZ = THREE.MathUtils.lerp(-0.15, 0, easeT);
    } else {
      // Stage 3: Section 03 — Agile Mission Planning (CENTER MACRO)
      earthOpacity = 0;
      targetX = 0.0;
      targetY = -0.45;
      targetZ = 1.15;
      targetScale = 2.3;
      targetRotX = 0.5;
      targetRotZ = 0;
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
