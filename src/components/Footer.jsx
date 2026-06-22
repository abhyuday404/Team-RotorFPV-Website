import React from 'react';
import { Mail } from 'lucide-react';
import { FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer glass">
      <div className="container footer-container">
        <p className="copyright">&copy; {new Date().getFullYear()} Team RotorFPV</p>
        <div className="social-links">
          <a href="https://www.instagram.com/teamrotorfpv?igsh=czc1cXQ1YjczZXZw" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram size={20} />
          </a>
          <a href="https://www.linkedin.com/company/team-rotorfpv/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FaLinkedin size={20} />
          </a>
          <a href="https://www.youtube.com/@rotorfpvvit6869" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <FaYoutube size={20} />
          </a>
          <a href="mailto:teamrotorfpv@vit.ac.in" aria-label="Mail">
            <Mail size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
