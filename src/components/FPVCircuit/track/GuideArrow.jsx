import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cone } from '@react-three/drei';

export const GuideArrow = ({ data }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle bobbing up and down
      groupRef.current.position.y = data.position.y + Math.sin(state.clock.elapsedTime * 3 + data.position.z) * 2;
    }
  });

  return (
    <group ref={groupRef} position={data.position}>
      <group onUpdate={(self) => self.lookAt(data.lookAtPos)}>
        {/* The arrow itself - a long glowing cone */}
        <Cone args={[1.5, 8, 4]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
        </Cone>
        
        {/* A secondary trailing cone for the 'chevron' effect */}
        <Cone args={[1.8, 4, 4]} position={[0, 0, -4]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#3B82F6" opacity={0.4} transparent />
        </Cone>
      </group>
    </group>
  );
};
