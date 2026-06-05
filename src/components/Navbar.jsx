import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const leftLinks = [
    { name: 'Gallery', path: '/gallery' },
    { name: 'Sponsors', path: '/sponsors' },
    { name: 'Drones', path: '/drones' },
  ];

  const rightLinks = [
    { name: 'Achievements', path: '/achievements' },
    { name: 'Team', path: '/team' },
    { name: 'About Us', path: '/about' },
  ];

  const renderLinks = (links) => (
    links.map((link) => (
      <li key={link.path}>
        <Link
          to={link.path}
          className={location.pathname === link.path ? 'active' : ''}
        >
          {link.name}
        </Link>
      </li>
    ))
  );

  return (
    <nav className="navbar glass">
      <div className="container nav-container">
        <ul className="nav-links left-links">
          {renderLinks(leftLinks)}
        </ul>

        <Link to="/" className="nav-logo">
          <img src="/TRFPV Assets/JUSTLOGO.png" alt="RotorFPV Logo" className="logo-img" />
        </Link>

        <ul className="nav-links right-links">
          {renderLinks(rightLinks)}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
