import React, { useRef } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export const AchievementHologram = ({ data }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.2; 
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Html
          transform
          occlude="blending"
          position={[0, 0, 0]}
          distanceFactor={60} 
          zIndexRange={[100, 0]}
          className="achievement-hologram-html"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '80px',
            width: '2400px', 
            fontFamily: "'Inter', sans-serif"
          }}>
            
            {/* LEFT COLUMN: Title */}
            <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end' }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '64px', 
                fontWeight: '800', 
                color: '#ffffff', 
                lineHeight: '1.2', 
                textAlign: 'left', 
                maxWidth: '600px' 
              }}>
                {data.title}
              </h2>
            </div>

            {/* CENTER COLUMN: Visual Focus (Image or Loop) */}
            <div style={{ 
              width: '1000px', 
              height: '600px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {data.images && data.images.length > 0 && data.images[0] ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
                }}>
                  <img 
                    src={data.images[0]} 
                    alt={data.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              ) : (
                <div style={{
                  width: '500px',
                  height: '500px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Subtle inner target indicator */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }} />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Description */}
            <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-start' }}>
              <p style={{ 
                margin: 0, 
                fontSize: '32px', 
                lineHeight: '1.6', 
                color: '#E5E7EB', 
                fontWeight: '400',
                textAlign: 'right', 
                maxWidth: '600px' 
              }}>
                {data.description}
              </p>
            </div>

          </div>
        </Html>
      </Billboard>
    </group>
  );
};

