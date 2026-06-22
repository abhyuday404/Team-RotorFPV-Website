import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ShinyText from '../components/ShinyText';
import './Sponsors.css';

const springValues = { damping: 30, stiffness: 100, mass: 2 };

const TiltWrapper = ({ children, rotateAmplitude = 14, scaleOnHover = 1.05 }) => {
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  function handleMouse(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;
    rotateX.set(rotationX);
    rotateY.set(rotationY);
  }

  function handleMouseEnter() { scale.set(scaleOnHover); }
  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div style={{ perspective: 1200 }} className="sponsor-tilt-container">
      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
        className="sponsor-tilt-inner"
      >
        {children}
      </motion.div>
    </div>
  );
};

const SponsorCard = ({ sponsor }) => {
  return (
    <TiltWrapper rotateAmplitude={12} scaleOnHover={1.05}>
      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="sponsor-link">
        <div className="sponsor-card">
          <div className="sponsor-logo-container">
            <img src={sponsor.logo} alt={sponsor.name} className="sponsor-logo" />
          </div>
          <div className="sponsor-info-below">
            <h3 className="sponsor-name-text">{sponsor.name}</h3>
            <p className="sponsor-click-text">Visit Website</p>
          </div>
        </div>
      </a>
    </TiltWrapper>
  );
};

const Sponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "sponsors"),
      orderBy("order", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSponsors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter active sponsors in memory to avoid requiring a Firestore composite index
      // If isActive is undefined (old records), we treat it as active.
      setSponsors(allSponsors.filter(s => s.isActive !== false));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sponsors:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="sponsors-page">
        <div className="sponsors-content flex-center">
          <div className="loading-spinner">Loading sponsors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sponsors-page">
      <div className="sponsors-content fade-in">
        <h2 className="year-title">
          <ShinyText text="Our Sponsors" speed={3} />
        </h2>
        
        {sponsors.length > 0 ? (
          <div className="sponsors-grid">
            {sponsors.map((sponsor) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        ) : (
          <div className="no-sponsors">
            <p>Sponsors will be added here soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sponsors;
