import React from 'react';
import { Box, Cylinder, Line } from '@react-three/drei';

export const PCBIsland = ({ position, isActive }) => {
  // A subtle floating platform resembling a PCB/ESC
  
  return (
    <group position={position}>
      {/* Base PCB Plate */}
      <Box args={[16, 0.5, 16]}>
        <meshStandardMaterial color="#01050a" roughness={0.8} metalness={0.2} />
      </Box>
      
      {/* Copper Pads / Chips */}
      <Box args={[3, 0.6, 3]} position={[-4, 0, -4]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </Box>
      <Box args={[2, 0.6, 4]} position={[5, 0, 2]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </Box>
      <Cylinder args={[1.5, 1.5, 0.7, 16]} position={[-3, 0, 5]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </Cylinder>

      {/* Glowing Traces connecting them */}
      <Line
        points={[[-4, 0.3, -4], [0, 0.3, -4], [2, 0.3, -2], [5, 0.3, 2]]}
        color={isActive ? "#FFD700" : "#00E5FF"}
        lineWidth={2}
        transparent
        opacity={isActive ? 0.8 : 0.2}
      />
      <Line
        points={[[-3, 0.3, 5], [-3, 0.3, 0], [-1, 0.3, -2], [2, 0.3, -2]]}
        color={isActive ? "#FFD700" : "#00E5FF"}
        lineWidth={2}
        transparent
        opacity={isActive ? 0.8 : 0.2}
      />
    </group>
  );
};
