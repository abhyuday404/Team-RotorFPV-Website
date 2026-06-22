import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { generateContinuousTrack } from './track/TrackGenerator';
import { YearCircuit } from './track/YearCircuit';
import { FPVCamera } from './camera/FPVCamera';
import { CircuitPostProcessing } from './effects/PostProcessing';
import { useFPVCircuit } from './FPVCircuitProvider';
import { useFlightProgress, FlightController } from './utils/progress';
import { OSDOverlay } from './overlay/OSDOverlay';

const CircuitScene = ({ progress, continuousTrackData, isMobile, flyToNextGate, autoFly, pauseFlight }) => {
  return (
    <>
      <fog attach="fog" args={['#050608', 500, 20000]} />
      <ambientLight intensity={0.15} color="#93C5FD" />
      <directionalLight position={[50, 50, -50]} intensity={0.3} color="#60A5FA" />
      <hemisphereLight skyColor="#0B1220" groundColor="#172033" intensity={0.2} />

      <FlightController />
      {continuousTrackData?.masterSpline && (
        <FPVCamera spline={continuousTrackData.masterSpline} />
      )}
      
      {continuousTrackData?.allIslandsData?.map((island, index) => (
        <group key={island.year}>
          {/* Render the single YearCircuit for this island's achievements and gates */}
          <YearCircuit yearData={island} startPos={island.startPos} index={index} />
        </group>
      ))}

      <CircuitPostProcessing />

      {isMobile && !autoFly && (
        <mesh 
          position={[0, 0, -5]} 
          onClick={() => flyToNextGate(Math.min(progress + 0.05, 1))}
        >
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </>
  );
};

export const FPVExperience = () => {
  const { progress, isMobile, flyToNextGate, pauseFlight, autoFly } = useFlightProgress();
  const { yearCircuits } = useFPVCircuit();

  const continuousTrackData = useMemo(() => {
    if (!yearCircuits || yearCircuits.length === 0) return null;
    return generateContinuousTrack(yearCircuits);
  }, [yearCircuits]);

  return (
    <>
      <Canvas 
        camera={{ position: [0, 0, 0], fov: 60, near: 0.1, far: 25000 }}
        gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        dpr={[1, 2]}
      >
        {continuousTrackData && (
          <CircuitScene 
            progress={progress} 
            continuousTrackData={continuousTrackData}
            isMobile={isMobile}
            flyToNextGate={flyToNextGate}
            pauseFlight={pauseFlight}
            autoFly={autoFly}
          />
        )}
      </Canvas>
      <OSDOverlay progress={progress} allIslandsData={continuousTrackData?.allIslandsData || []} />
      
      {isMobile && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1001 }}>
          <button 
            onClick={() => autoFly ? pauseFlight() : flyToNextGate(Math.min(progress + 0.05, 1))}
            style={{ 
              padding: '10px 20px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              color: 'white', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {autoFly ? 'PAUSE FLIGHT' : 'NEXT WAYPOINT'}
          </button>
        </div>
      )}
    </>
  );
};
