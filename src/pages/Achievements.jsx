import React, { useState, useEffect, useRef } from 'react';
import './Achievements.css';
import { achievementsData } from './AchievementsData';

const ImageCarousel = ({ images, isHovered }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isHovered && images && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 1500);
    } else {
      setCurrentIndex(0);
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

/* ───────────────────────────────────────────────
   Special card — the card itself goes position:fixed
   so there is only ONE element tracking the mouse.
   ─────────────────────────────────────────────── */
const SpecialAchievementCard = ({ achievement }) => {
  const [isActive, setIsActive] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [startRect, setStartRect] = useState(null);
  const [expandedPos, setExpandedPos] = useState(null);
  const cardRef = useRef(null);
  const slotRef = useRef(null);
  const collapseTimer = useRef(null);
  const busyRef = useRef(false);
  const mouseInsideRef = useRef(false);

  const triggerCollapse = () => {
    busyRef.current = true;
    setAnimClass('is-collapsing');
    collapseTimer.current = setTimeout(() => {
      setIsActive(false);
      setAnimClass('');
      if (slotRef.current) slotRef.current.style.height = '';
      collapseTimer.current = null;
      busyRef.current = false;
    }, 500);
  };

  const handleEnter = (e) => {
    mouseInsideRef.current = true;
    if (busyRef.current || isActive) return;

    const rect = cardRef.current.getBoundingClientRect();
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    // Responsive expanded dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const expW = vw * (vw <= 768 ? 0.9 : vw <= 992 ? 0.8 : 0.6);
    const expH = vh * (vw <= 768 ? 0.8 : vw <= 992 ? 0.75 : 0.72);

    // Start centered in viewport
    let expLeft = (vw - expW) / 2;
    let expTop  = (vh - expH) / 2;

    // Shift so the cursor sits at least 60px inside every edge
    const pad = 60;
    if (cursorX < expLeft + pad)       expLeft = cursorX - pad;
    if (cursorX > expLeft + expW - pad) expLeft = cursorX - expW + pad;
    if (cursorY < expTop + pad)        expTop  = cursorY - pad;
    if (cursorY > expTop + expH - pad)  expTop  = cursorY - expH + pad;

    // Clamp to viewport
    expLeft = Math.max(10, Math.min(expLeft, vw - expW - 10));
    expTop  = Math.max(10, Math.min(expTop,  vh - expH - 10));

    setStartRect(rect);
    setExpandedPos({ top: expTop, left: expLeft, width: expW, height: expH });
    slotRef.current.style.height = `${rect.height}px`;
    setIsActive(true);
    busyRef.current = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimClass('is-expanded');
        setTimeout(() => {
          busyRef.current = false;
          if (!mouseInsideRef.current) {
            triggerCollapse();
          }
        }, 500);
      });
    });
  };

  const handleLeave = () => {
    mouseInsideRef.current = false;
    if (busyRef.current) return;
    triggerCollapse();
  };

  useEffect(() => {
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  const cardStyle = isActive && startRect ? {
    '--start-top': `${startRect.top}px`,
    '--start-left': `${startRect.left}px`,
    '--start-width': `${startRect.width}px`,
    '--start-height': `${startRect.height}px`,
    ...(expandedPos ? {
      '--exp-top': `${expandedPos.top}px`,
      '--exp-left': `${expandedPos.left}px`,
      '--exp-width': `${expandedPos.width}px`,
      '--exp-height': `${expandedPos.height}px`,
    } : {}),
  } : {};

  return (
    <div className="special-card-slot" ref={slotRef}>
      {/* Backdrop — purely visual, no pointer-events */}
      {isActive && (
        <div className={`expanded-backdrop ${animClass === 'is-expanded' ? 'active' : ''}`} />
      )}

      <div
        ref={cardRef}
        className={`achievement-card special ${isActive ? 'is-active' : ''} ${animClass}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={cardStyle}
      >
        {/* Collapsed title — hidden via CSS when active */}
        <div className="special-card-collapsed">
          <h3 className="achievement-title">{achievement.title}</h3>
          <div className="year-badge-special">{achievement.year}</div>
        </div>

        {/* Expanded content — only mounted when active */}
        {isActive && (
          <div className="expanded-inner">
            <div className="expanded-card-image">
              <ImageCarousel images={achievement.images} isHovered={true} />
            </div>
            <div className="expanded-card-body">
              <div className="expanded-card-header">
                <h2 className="expanded-card-title">{achievement.title}</h2>
                <div className="year-badge-special">{achievement.year}</div>
              </div>
              <p className="expanded-card-desc">{achievement.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RegularAchievementCard = ({ achievement }) => (
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

const Achievements = () => {
  const specialAchievements = achievementsData.slice(-3);
  const regularAchievements = [...achievementsData.slice(0, -3)].reverse();

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1>Our Achievements</h1>
        <p>A legacy of excellence and innovation.</p>
      </div>

      <div className="special-achievements-container">
        {specialAchievements.map((achievement) => (
          <SpecialAchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      <div className="achievements-grid">
        {regularAchievements.map((achievement) => (
          <RegularAchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
