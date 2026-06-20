import React, { useRef } from 'react';
import VariableProximity from '../components/VariableProximity';
import './Home.css';

const Home = () => {
  const containerRef = useRef(null);

  return (
    <div className="home-container" ref={containerRef}>
      <div className="video-background">
        <video autoPlay loop muted playsInline>
          <source src="/TRFPV Assets/Teamvideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>
      </div>
      
      <div className="hero-content">
        <h1 className="brand-font hero-quote">
          <VariableProximity
            label='"Build . Fly . Crash . Repeat"'
            className="variable-proximity-demo"
            fromFontVariationSettings="'wght' 200, 'opsz' 9"
            toFontVariationSettings="'wght' 500, 'opsz' 40"
            containerRef={containerRef}
            radius={120}
            falloff="exponential"
          />
        </h1>
      </div>
    </div>
  );
};

export default Home;
