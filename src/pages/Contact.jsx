import React from 'react';
import ShinyText from '../components/ShinyText';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="contact-content fade-in">
        <h2 className="year-title">
          <ShinyText text="Contact Us" speed={3} />
        </h2>
        <p className="contact-subtitle">
          Content coming soon...
        </p>
      </div>
    </div>
  );
};

export default Contact;
