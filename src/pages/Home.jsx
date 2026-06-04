import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="video-background">
        <video autoPlay loop muted playsInline>
          <source src="/TRFPV Assets/Teamvideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>
      </div>
      
      <div className="hero-content">
        <h1 className="brand-font hero-quote">
          <span className="word">Build</span>
          <span className="dot">.</span>
          <span className="word">Fly</span>
          <span className="dot">.</span>
          <span className="word">Crash</span>
          <span className="dot">.</span>
          <span className="word highlight">Repeat</span>
        </h1>
      </div>
    </div>
  );
};

export default Home;
