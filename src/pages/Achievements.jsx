import React, { useState, useEffect } from 'react';
import './Achievements.css';
import { achievementsData } from './AchievementsData';

const ImageCarousel = ({ images, isHovered }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 1500); // Change image every 1.5 seconds
    } else {
      setCurrentIndex(0); // Reset to first image when not hovering
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  return (
    <div className="carousel-container">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`Achievement slide ${index}`}
          className={`carousel-image ${index === currentIndex ? 'active' : ''} ${isHovered ? 'zoomed' : ''}`}
        />
      ))}
      <div className="carousel-indicators">
        {images.length > 1 && images.map((_, index) => (
          <div key={index} className={`indicator ${index === currentIndex ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

const AchievementCard = ({ achievement }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="achievement-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-image-section">
        <ImageCarousel images={achievement.images} isHovered={isHovered} />
        <div className="year-badge">{achievement.year}</div>
      </div>
      <div className="card-content-section">
        <h3 className="achievement-title">{achievement.title}</h3>
        <p className="achievement-desc">{achievement.description}</p>
      </div>
    </div>
  );
};

const Achievements = () => {
  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1>Our Achievements</h1>
        <p>A legacy of excellence and innovation.</p>
      </div>
      
      <div className="achievements-grid">
        {achievementsData.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
