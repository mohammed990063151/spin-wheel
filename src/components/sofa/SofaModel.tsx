"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import {
  fabricFeel,
  getFabricColor,
  type SofaConfig,
} from "@/lib/sofa";

function SeatMaterial({
  color,
  roughness,
  metalness,
}: {
  color: string;
  roughness: number;
  metalness: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
    />
  );
}

export default function SofaModel({ config }: { config: SofaConfig }) {
  const color = getFabricColor(config.fabricColor);
  const feel = fabricFeel(config.fabricType);
  const frame = useMemo(() => {
    const seatW = 0.74;
    const gap = 0.035;
    const seats = config.seats;
    const innerW = seats * seatW + (seats - 1) * gap;
    const armW = config.arm === "none" ? 0 : config.arm === "flared" ? 0.26 : 0.2;
    const totalW = innerW + armW * 2;
    const depth = 0.96;
    const seatH = 0.2;
    const baseH = 0.16;
    const legH =
      config.legs === "hidden" ? 0.045 : config.legs === "wood" ? 0.11 : config.legs === "gold" ? 0.16 : 0.15;
    const baseY = legH + baseH / 2;
    const seatY = legH + baseH + seatH / 2 + 0.01;
    const backH = 0.5;
    const backY = seatY + seatH / 2 + backH / 2 - 0.04;
    return {
      seatW,
      gap,
      seats,
      innerW,
      armW,
      totalW,
      depth,
      seatH,
      baseH,
      legH,
      baseY,
      seatY,
      backH,
      backY,
    };
  }, [config.arm, config.legs, config.seats]);

  const pillowCount =
    config.pillows === "none" ? 0 : config.pillows === "pair" ? 2 : 3;

  const legColor =
    config.legs === "gold" ? "#c3a786" : config.legs === "hairpin" ? "#333333" : "#6B4A2A";

  const startX = -frame.innerW / 2 + frame.seatW / 2;

  return (
    <group>
      <RoundedBox
        args={[frame.innerW + 0.08, frame.baseH, frame.depth - 0.08]}
        radius={0.03}
        smoothness={4}
        position={[0, frame.baseY, 0.02]}
      >
        <SeatMaterial color={color.hex} roughness={Math.min(1, feel.roughness + 0.08)} metalness={feel.metalness} />
      </RoundedBox>

      {Array.from({ length: frame.seats }).map((_, i) => {
        const x = startX + i * (frame.seatW + frame.gap);
        return (
          <group key={`seat-${i}`}>
            <RoundedBox
              args={[frame.seatW, frame.seatH, frame.depth - 0.18]}
              radius={0.045}
              smoothness={5}
              position={[x, frame.seatY, 0.06]}
            >
              <SeatMaterial color={color.hex} roughness={feel.roughness} metalness={feel.metalness} />
            </RoundedBox>
            <RoundedBox
              args={[frame.seatW, frame.backH, 0.2]}
              radius={0.05}
              smoothness={5}
              position={[x, frame.backY, -frame.depth / 2 + 0.16]}
            >
              <SeatMaterial color={color.hex} roughness={feel.roughness} metalness={feel.metalness} />
            </RoundedBox>
          </group>
        );
      })}

      {config.arm !== "none" &&
        ([-1, 1] as const).map((side) => {
          const x =
            side * (frame.innerW / 2 + frame.armW / 2 + (config.arm === "flared" ? 0.01 : 0));
          if (config.arm === "rounded") {
            return (
              <group key={`arm-${side}`} position={[x, frame.seatY + 0.08, 0.02]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <capsuleGeometry args={[0.11, 0.62, 8, 16]} />
                  <SeatMaterial color={color.hex} roughness={feel.roughness} metalness={feel.metalness} />
                </mesh>
              </group>
            );
          }
          const w = config.arm === "flared" ? 0.24 : 0.18;
          const scaleZ = config.arm === "flared" ? 1.08 : 1;
          return (
            <RoundedBox
              key={`arm-${side}`}
              args={[w, 0.52, (frame.depth - 0.1) * scaleZ]}
              radius={config.arm === "flared" ? 0.07 : 0.03}
              smoothness={4}
              position={[x, frame.seatY + 0.14, config.arm === "flared" ? 0.04 : 0]}
            >
              <SeatMaterial color={color.hex} roughness={feel.roughness} metalness={feel.metalness} />
            </RoundedBox>
          );
        })}

      {([
        [-frame.innerW / 2 + 0.12, frame.depth / 2 - 0.16],
        [frame.innerW / 2 - 0.12, frame.depth / 2 - 0.16],
        [-frame.innerW / 2 + 0.12, -frame.depth / 2 + 0.16],
        [frame.innerW / 2 - 0.12, -frame.depth / 2 + 0.16],
      ] as [number, number][]).map(([x, z], i) => {
        if (config.legs === "hairpin") {
          return (
            <mesh key={`leg-${i}`} position={[x, frame.legH / 2, z]}>
              <cylinderGeometry args={[0.018, 0.018, frame.legH, 10]} />
              <meshStandardMaterial color={legColor} metalness={0.7} roughness={0.28} />
            </mesh>
          );
        }
        if (config.legs === "gold") {
          return (
            <mesh key={`leg-${i}`} position={[x, frame.legH / 2, z]}>
              <cylinderGeometry args={[0.018, 0.042, frame.legH, 10]} />
              <meshStandardMaterial color={legColor} metalness={0.85} roughness={0.18} />
            </mesh>
          );
        }
        return (
          <mesh key={`leg-${i}`} position={[x, frame.legH / 2, z]}>
            <boxGeometry args={[0.055, frame.legH, 0.055]} />
            <meshStandardMaterial color={legColor} roughness={0.7} metalness={0.05} />
          </mesh>
        );
      })}

      {Array.from({ length: pillowCount }).map((_, i) => {
        const spread = frame.innerW * 0.28;
        const x = (i - (pillowCount - 1) / 2) * spread;
        const patterned = config.pillows === "mix" && i === pillowCount - 1;
        const rot = (i - 1) * 0.18;
        return (
          <RoundedBox
            key={`pillow-${i}`}
            args={[0.28, 0.22, 0.1]}
            radius={0.04}
            smoothness={4}
            position={[x, frame.seatY + frame.seatH / 2 + 0.14, -0.12]}
            rotation={[0.08, rot, 0]}
          >
            <SeatMaterial
              color={patterned ? color.hex : color.accent}
              roughness={patterned ? 0.35 : 0.62}
              metalness={patterned ? 0.08 : 0.02}
            />
          </RoundedBox>
        );
      })}
    </group>
  );
}
