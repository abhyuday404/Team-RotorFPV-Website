import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useRef } from 'react';

export const CameraEffects = ({ progress }) => {
  const previousProgress = useRef(progress);
  
  useFrame((state, delta) => {
    // Calculate speed based on progress change
    const speed = Math.abs(progress - previousProgress.current) / delta;
    previousProgress.current = progress;
    
    // Base FOV is 75, max FOV when fast is 90
    const targetFov = 75 + Math.min(speed * 1000, 15);
    
    easing.damp(state.camera, 'fov', targetFov, 0.2, delta);
    state.camera.updateProjectionMatrix();
  });
  
  return null;
};
