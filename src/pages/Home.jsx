import React, { useRef, useState, useEffect } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import VariableProximity from '../components/VariableProximity';
import './Home.css';

const Home = () => {
  const containerRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState("/TRFPV_Assets/Teamvideo.mp4");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'home'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().backgroundVideoUrl) {
        setVideoSrc(docSnap.data().backgroundVideoUrl);
      } else {
        setVideoSrc("/TRFPV_Assets/Teamvideo.mp4");
      }
    }, (error) => {
      console.error("Error fetching home settings:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="home-container" ref={containerRef}>
      <div className="video-background">
        <video key={videoSrc} autoPlay loop muted playsInline>
          <source src={videoSrc} type="video/mp4" />
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
