import React from 'react';
import Typewriter from 'typewriter-effect';
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
          <Typewriter
            options={{
              delay: 80,
            }}
            onInit={(typewriter) => {
              typewriter
                .typeString('<span class="word">Build</span> ')
                .pauseFor(300)
                .typeString('<span class="dot">.</span> ')
                .pauseFor(300)
                .typeString('<span class="word">Fly</span> ')
                .pauseFor(300)
                .typeString('<span class="dot">.</span> ')
                .pauseFor(300)
                .typeString('<span class="word">Crash</span> ')
                .pauseFor(300)
                .typeString('<span class="dot">.</span> ')
                .pauseFor(500)
                .typeString('<span class="word highlight">Repeat</span>')
                .start();
            }}
          />
        </h1>
      </div>
    </div>
  );
};

export default Home;
