"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import SofaModel from "@/components/sofa/SofaModel";
import type { SofaConfig } from "@/lib/sofa";

export type SofaCanvasHandle = {
  capture: () => string;
};

function CameraRig({ seats }: { seats: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const dist = 2.6 + seats * 0.42;
    camera.position.set(dist * 0.55, 1.55, dist);
  }, [camera, seats]);
  return null;
}

function CaptureBridge({
  captureRef,
}: {
  captureRef: { current: () => string };
}) {
  const gl = useThree((state) => state.gl);
  captureRef.current = () => gl.domElement.toDataURL("image/png");
  return null;
}

export default function SofaCanvas({
  config,
  autoRotate = true,
  onReady,
}: {
  config: SofaConfig;
  autoRotate?: boolean;
  onReady?: (handle: SofaCanvasHandle) => void;
}) {
  const captureFn = useRef(() => "");
  const camera = useMemo(() => {
    const dist = 2.6 + config.seats * 0.42;
    return { position: [dist * 0.55, 1.55, dist] as [number, number, number], fov: 38 };
  }, [config.seats]);

  useEffect(() => {
    onReady?.({
      capture: () => captureFn.current(),
    });
  }, [onReady]);

  return (
    <Canvas
      shadows
      camera={camera}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <color attach="background" args={["#f7f6f2"]} />
      <hemisphereLight args={["#ffffff", "#e8dcc4", 0.95]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.35} color="#fff4dc" />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#7ee0c4" />
      <CaptureBridge captureRef={captureFn} />
      <Suspense fallback={null}>
        <CameraRig seats={config.seats} />
        <SofaModel config={config} />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.45}
          scale={10}
          blur={2.2}
          far={4}
        />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[6.5, 48]} />
        <meshStandardMaterial color="#e8dcc4" roughness={0.9} metalness={0.05} />
      </mesh>
      <OrbitControls
        enablePan={false}
        minPolarAngle={0.7}
        maxPolarAngle={1.35}
        minDistance={3}
        maxDistance={9}
        autoRotate={autoRotate}
        autoRotateSpeed={0.7}
        target={[0, 0.7, 0]}
      />
    </Canvas>
  );
}
