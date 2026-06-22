import React from 'react';
import { AchievementHologram } from '../holograms/AchievementHologram';

export const AchievementPillar = ({ data }) => {
  return (
    <group position={data.worldPosition}>
      {/* Subtle spotlight illuminating the achievement */}
      <pointLight position={[0, 0, 10]} intensity={1.5} color="#93C5FD" distance={50} decay={2} />
      <pointLight position={[0, 0, -10]} intensity={1.5} color="#93C5FD" distance={50} decay={2} />

      {/* The Massive Hologram Display acts as the gate itself */}
      <group position={[0, 0, 0]}>
        <AchievementHologram data={data} />
      </group>
    </group>
  );
};
