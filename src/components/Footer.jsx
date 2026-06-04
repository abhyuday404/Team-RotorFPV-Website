import React from 'react';
import { Mail } from 'lucide-react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer glass">
      <div className="container footer-container">
        <p className="copyright">&copy; {new Date().getFullYear()} Team RotorFPV</p>
        <div className="social-links">
          <a href="#" aria-label="Instagram">
            <FaInstagram size={20} />
          </a>
          <a href="#" aria-label="LinkedIn">
            <FaLinkedin size={20} />
          </a>
          <a href="#" aria-label="Mail">
            <Mail size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
