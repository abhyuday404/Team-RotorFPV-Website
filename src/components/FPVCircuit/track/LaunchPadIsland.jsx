import React from 'react';
import { Box, Text } from '@react-three/drei';

export const LaunchPadIsland = ({ position, length }) => {
  // Center the runway based on length. The startPos is the Monument (Z=0 relative to island).
  // The runway needs to stretch from slightly before the Monument to slightly after the last achievement.
  const zOffset = length / 2 - 40; 

  return (
    <group position={[position.x, position.y - 1, position.z + zOffset]}>
      {/* Elongated Runway Platform */}
      {/* 120m wide, `length` long, 2m thick */}
      <Box args={[140, 2, length]}>
        <meshStandardMaterial 
          color="#1F2937" 
          roughness={0.8} 
          metalness={0.4} 
        />
      </Box>
      
      {/* Carbon fiber style inner strip (Exhibition carpet equivalent) */}
      <Box args={[60, 2.1, length - 10]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#0B1220" 
          roughness={0.6} 
          metalness={0.6} 
        />
      </Box>

      {/* Subtle edge light strips along the runway */}
      <Box args={[140.2, 0.2, length + 0.2]} position={[0, 0.5, 0]}>
        <meshBasicMaterial 
          color="#2B3445" 
          transparent 
          opacity={0.3} 
        />
      </Box>
    </group>
  );
};

export const YearMonument = ({ year, position }) => {
  const chars = year.toString().split('');
  
  return (
    <group position={[position.x - 15, position.y, position.z]}>
      {chars.map((char, index) => {
        const height = 4;
        const yPos = (chars.length - 1 - index) * height + (height / 2);
        
        return (
          <group key={index} position={[0, yPos, 0]}>
            <Box args={[6, height - 0.2, 6]}>
              <meshStandardMaterial 
                color="#111827" 
                roughness={0.4} 
                metalness={0.6} 
              />
            </Box>
            
            <Text
              position={[0, 0, 3.01]}
              fontSize={height - 1}
              color="#EAEAEA"
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
              {char}
            </Text>
          </group>
        );
      })}
      
      <pointLight position={[0, 10, 10]} intensity={0.4} color="#EAEAEA" distance={40} decay={2} />
    </group>
  );
};
