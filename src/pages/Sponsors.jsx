import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import ShinyText from '../components/ShinyText';
import { Cpu, Code, Factory } from 'lucide-react';
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
    <div style={{ perspective: 1200 }} className="partner-tilt-container">
      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
        className="partner-tilt-inner"
      >
        {children}
      </motion.div>
    </div>
  );
};

const SponsorCard = ({ sponsor }) => {
  return (
    <TiltWrapper rotateAmplitude={12} scaleOnHover={1.05}>
      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="partner-link">
        <div className="partner-card">
          <div className="partner-logo-container">
            <img src={sponsor.logo} alt={sponsor.name} className="partner-logo" />
          </div>
          <div className="partner-info-below">
            <h3 className="partner-name-text">{sponsor.name}</h3>
            <p className="partner-click-text">Visit Website</p>
          </div>
        </div>
      </a>
    </TiltWrapper>
  );
};

const Sponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'sponsors'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setSettings({
          title: 'Sponsor Us',
          description: '',
          teamImage: { url: '' },
          brochure: { url: '' },
          whySponsorUs: ''
        });
      }
    });

    // Fetch sponsors
    const q = query(
      collection(db, "sponsors"),
      orderBy("order", "asc")
    );

    const unsubSponsors = onSnapshot(q, (snapshot) => {
      const allSponsors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSponsors(allSponsors.filter(s => s.isActive !== false));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sponsors:", error);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubSponsors();
    };
  }, []);

  if (loading) {
    return (
      <div className="partners-page">
        <div className="partners-content flex-center">
          <div className="loading-spinner">Loading sponsors...</div>
        </div>
      </div>
    );
  }

  const helpOptions = [
    {
      title: "Technical Collaboration",
      icon: Cpu,
      description: "Component donations, dev boards, electronics and hardware."
    },
    {
      title: "Software & Licenses",
      icon: Code,
      description: "Software licenses, compute credits, SDKs."
    },
    {
      title: "Manufacturing",
      icon: Factory,
      description: "Machining, 3D printing, carbon fiber cutting, and custom parts fabrication."
    }
  ];

  return (
    <div className="partners-page">
      <div className="partners-content fade-in">

        {/* Sponsor Us Hero */}
        <section className="sponsor-hero">
          <h2 className="year-title">
            <ShinyText text={settings?.title || "Sponsor Us"} speed={3} />
          </h2>

          <div className="sponsor-hero-grid">
            <div className="sponsor-hero-text">
              <p>{settings?.description || "Partnering with Team Rotor FPV provides a unique platform to engage with a highly passionate community of engineers, innovators, and drone enthusiasts. Your support fuels our journey in pushing the boundaries of FPV technology, competing at international stages, and fostering technical education."}</p>
              
              <div className="hero-actions">
                <a 
                  href={settings?.brochure?.url || "#"} 
                  target={settings?.brochure?.url ? "_blank" : "_self"} 
                  rel="noreferrer" 
                  className="brochure-btn"
                  onClick={(e) => {
                    if (!settings?.brochure?.url) {
                      e.preventDefault();
                      alert("Brochure has not been uploaded yet. Please upload it from the Admin Panel.");
                    }
                  }}
                >
                  View Brochure
                </a>
                <button onClick={() => navigate('/contact')} className="contact-btn">
                  Contact Us
                </button>
              </div>
            </div>

            <div className="sponsor-hero-image">
              {settings?.teamImage?.url ? (
                <img src={settings.teamImage.url} alt="Team Rotor FPV" />
              ) : (
                <div className="image-placeholder">Team Image Area</div>
              )}
            </div>
          </div>
        </section>

        {/* How Can You Help */}
        <section className="how-to-help-section">
          <h2 className="section-title">
            <ShinyText text="How Can You Help" speed={3} />
          </h2>
          <div className="help-cards-grid">
            {helpOptions.map((option, idx) => (
              <div key={idx} className="help-card">
                <div className="help-card-icon">
                  <option.icon size={32} />
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Sponsor Us */}
        <section className="why-sponsor-section">
          <h2 className="section-title">
            <ShinyText text="Why Sponsor Us" speed={3} />
          </h2>
          <div className="why-sponsor-text">
            <p>
              {settings?.whySponsorUs || "By sponsoring us, you gain valuable brand visibility among future tech leaders and contribute to the growth of cutting-edge aerospace initiatives."}
            </p>
          </div>
        </section>

        {/* Our Sponsors Grid */}
        <h2 className="year-title" style={{ marginTop: '60px' }}>
          <ShinyText text="Our Sponsors" speed={3} />
        </h2>
        
        {sponsors.length > 0 ? (
          <div className="partners-grid">
            {sponsors.map((sponsor) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        ) : (
          <div className="no-partners">
            <p>Sponsors will be added here soon.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Sponsors;
