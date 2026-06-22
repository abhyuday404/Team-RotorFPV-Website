import React, { useEffect, useState, useRef } from 'react';
import GlassSurface from '../components/GlassSurface';
import ShinyText from '../components/ShinyText';
import TiltedCard from '../components/TiltedCard';
import { FaLinkedin } from 'react-icons/fa';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './Team.css';

const MemberCard = ({ member }) => {
  return (
    <GlassSurface
      className="member-card-glass"
      width="250px"
      height="450px"
      borderRadius={15}
      brightness={40}
      opacity={0.8}
      blur={10}
      backgroundOpacity={0.1}
      useFallback={true}
    >
      <div className="member-card">
        <TiltedCard
          imageSrc={member.image}
          altText={member.name}
          containerHeight="280px"
          containerWidth="220px"
          imageHeight="280px"
          imageWidth="220px"
          rotateAmplitude={12}
          scaleOnHover={1.05}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={true}
          overlayContent={
            <div className="tilted-card-name-overlay">{member.name}</div>
          }
        />
        <div className="member-info-below">
          <h3 className="member-name-text">{member.name}</h3>
          <p className="member-role-text">{member.role}</p>
          <a href={member.linkedin} className="member-linkedin" target="_blank" rel="noreferrer">
            <FaLinkedin size={24} />
          </a>
        </div>
      </div>
    </GlassSurface>
  );
};

const Team = () => {
  const [teamData, setTeamData] = useState({});
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pillRef = useRef(null);
  const isWheelScrollingRef = useRef(false);

  useEffect(() => {
    // We need to fetch team years and members
    const unsubs = [];
    
    // Default structure helper
    const getEmptyYear = () => ({ leaders: [], technical: [], miscellaneous: [] });

    // 1. Fetch years
    const qYears = query(collection(db, 'team_years'), orderBy('year', 'desc'));
    const unsubYears = onSnapshot(qYears, (snapshot) => {
      const fetchedYears = snapshot.docs.map(doc => doc.data().year);
      setYears(fetchedYears);
      if (fetchedYears.length > 0) {
         setActiveYear(prev => prev || fetchedYears[0]);
      }
    }, (err) => {
      console.error('Error fetching team_years:', err);
      setError('Error fetching years: ' + err.message);
      setLoading(false);
    });
    unsubs.push(unsubYears);

    // 2. Fetch active members
    const qMembers = query(collection(db, 'team_members'), orderBy('order', 'asc'));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const newTeamData = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isActive === false) return; // Skip inactive members
        
        const year = data.year;
        if (!newTeamData[year]) {
          newTeamData[year] = getEmptyYear();
        }
        
        const category = data.category || 'leaders';
        // Safety check just in case an unknown category exists
        if (newTeamData[year][category]) {
          newTeamData[year][category].push({ id: doc.id, ...data });
        }
      });
      
      setTeamData(newTeamData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching team_members:', err);
      setError('Error fetching members: ' + err.message);
      setLoading(false);
    });
    unsubs.push(unsubMembers);

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const changeYear = (newYear) => {
    if (newYear === activeYear) return;
    setIsAnimating(true);
    // Slight delay to allow fade out, then change data and fade in
    setTimeout(() => {
      setActiveYear(newYear);
      setIsAnimating(false);
    }, 300); // 300ms transition time
  };

  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const handleWheel = (e) => {
      e.preventDefault();
      
      if (isWheelScrollingRef.current) return;
      
      const currentIndex = years.indexOf(activeYear);
      let nextIndex = currentIndex;
      
      if (e.deltaY > 0 && currentIndex < years.length - 1) {
        nextIndex = currentIndex + 1; // Scroll down goes to next year
      } else if (e.deltaY < 0 && currentIndex > 0) {
        nextIndex = currentIndex - 1; // Scroll up goes to previous year
      }
      
      if (nextIndex !== currentIndex) {
        isWheelScrollingRef.current = true;
        const nextYear = years[nextIndex];
        changeYear(nextYear);
        
        // Unlock wheel scrolling after animation
        setTimeout(() => {
          isWheelScrollingRef.current = false;
        }, 800); 
      }
    };

    pill.addEventListener('wheel', handleWheel, { passive: false });
    return () => pill.removeEventListener('wheel', handleWheel);
  }, [activeYear, years]);


  if (error) {
    return (
      <div className="team-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        <p style={{ color: '#ff6b6b' }}>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="team-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        <p>Loading roster...</p>
      </div>
    );
  }

  if (years.length === 0 || !activeYear) {
    return (
      <div className="team-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        <p>No team data available.</p>
      </div>
    );
  }

  const activeData = teamData[activeYear] || { leaders: [], technical: [], miscellaneous: [] };

  return (
    <div className="team-page">
      <div className="team-content">
        <div className={`team-year-section active-section ${isAnimating ? 'fade-out' : 'fade-in'}`}>
          <h2 className="year-title">
            <ShinyText text={`Meet Our ${activeYear} Board`} speed={3} />
          </h2>
          
          {activeData.leaders.length > 0 && <h3 className="section-heading">Management</h3>}
          <div className="team-leaders">
            {activeData.leaders.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
          
          {activeData.technical.length > 0 && <h3 className="section-heading">Technical</h3>}
          <div className="team-grid">
            {activeData.technical.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>

          {activeData.miscellaneous.length > 0 && <h3 className="section-heading">Miscellaneous</h3>}
          <div className="team-grid">
            {activeData.miscellaneous.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>

      {/* The Pill Timeline */}
      <div className="timeline-pill-container" ref={pillRef}>
        <GlassSurface
          width={50}
          height={130}
          borderRadius={30}
          brightness={40}
          opacity={0.8}
          blur={10}
          backgroundOpacity={0.1}
          className="timeline-pill-glass"
          useFallback={true}
        >
          <div className="cylinder-container">
            {years.map((year, index) => {
              const activeIndex = years.indexOf(activeYear);
              const offset = index - activeIndex;
              const isVisible = Math.abs(offset) <= 2;
              
              return (
                <div
                  key={year}
                  className={`cylinder-item ${offset === 0 ? 'active' : ''}`}
                  style={{
                    transform: `rotateX(${-offset * 40}deg)`,
                    opacity: isVisible ? 1 - Math.abs(offset) * 0.5 : 0,
                    pointerEvents: isVisible ? 'auto' : 'none',
                    scale: offset === 0 ? 1.05 : 0.95
                  }}
                  onClick={() => changeYear(year)}
                >
                  {year}
                </div>
              );
            })}
          </div>
        </GlassSurface>
      </div>
    </div>
  );
};

export default Team;
