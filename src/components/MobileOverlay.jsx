import React from 'react';
import './MobileOverlay.css';

const MobileOverlay = () => {
  return (
    <div className="mobile-overlay-container">
      <div className="mobile-overlay-decoration"></div>
      <div className="mobile-overlay-content">
        <div className="mobile-icon">
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>
        <h2 className="mobile-overlay-title">Desktop Experience Only</h2>
        <p className="mobile-overlay-text">
          We are currently working hard to optimize the mobile view. 
          For now, please visit us on a desktop or laptop device for the best experience.
        </p>
      </div>
    </div>
  );
};

export default MobileOverlay;
