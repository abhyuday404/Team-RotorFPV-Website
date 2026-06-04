import React from 'react';
import './ComingSoon.css';

const ComingSoon = ({ title }) => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content glass">
        <h1 className="brand-font">{title}</h1>
        <p>Coming Soon</p>
        <div className="loader"></div>
      </div>
    </div>
  );
};

export default ComingSoon;
