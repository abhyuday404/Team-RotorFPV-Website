import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFPVCircuit } from '../FPVCircuitProvider';

export const Particles = () => {
  const { qualitySettings } = useFPVCircuit();
  const count = qualitySettings.particleCount;
  const mesh = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    // Animate particles slowly
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Update dummy position relative to camera to give feeling of flying through
      const camPos = state.camera.position;
      
      // Wrap particles around camera
      const px = (xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10);
      const py = (yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10);
      const pz = (zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10);

      // Simple wrapping logic (box around camera)
      const boxSize = 200;
      const halfBox = boxSize / 2;
      
      let finalX = px;
      let finalY = py;
      let finalZ = pz;
      
      // We don't necessarily want to wrap strictly to camera or they will pop. 
      // Just let them float in world space. But to make it infinite, we can wrap.
      // A simpler approach is just rendering a huge volume of static instanced particles that we fly through.
      
      dummy.position.set(px, py, pz);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
    </instancedMesh>
  );
};
