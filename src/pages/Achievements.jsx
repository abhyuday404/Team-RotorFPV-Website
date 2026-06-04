import React, { useState, useEffect } from 'react';
import './Achievements.css';
import { achievementsData } from './AchievementsData';

const ImageCarousel = ({ images, isHovered }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isHovered && images && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 1500); // Change image every 1.5 seconds
    } else {
      setCurrentIndex(0); // Reset to first image when not hovering
    }
    return () => clearInterval(interval);
  }, [isHovered, images]);

  if (!images || images.length === 0) return null;

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

const AchievementCard = ({ achievement, isSpecial }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isSpecial) {
    return (
      <div 
        className={`achievement-card special ${isHovered ? 'expanded' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isHovered ? (
          <div className="special-card-collapsed">
            <h3 className="achievement-title">{achievement.title}</h3>
            <div className="year-badge-special">{achievement.year}</div>
          </div>
        ) : (
          <div className="special-card-expanded">
            <div className="card-image-section">
              <ImageCarousel images={achievement.images} isHovered={isHovered} />
              <div className="year-badge">{achievement.year}</div>
            </div>
            <div className="card-content-section">
              <h3 className="achievement-title">{achievement.title}</h3>
              <p className="achievement-desc">{achievement.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular card
  return (
    <div className="achievement-card regular">
      <div className="card-content-section">
        <div className="title-year-row">
          <h3 className="achievement-title">{achievement.title}</h3>
          <div className="year-badge-regular">{achievement.year}</div>
        </div>
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
        {achievementsData.map((achievement, index) => {
          const isSpecial = index >= achievementsData.length - 3;
          return <AchievementCard key={achievement.id} achievement={achievement} isSpecial={isSpecial} />
        })}
      </div>
    </div>
  );
};

export default Achievements;
