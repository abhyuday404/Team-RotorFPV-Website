import React, { useState, useEffect } from 'react';
import './Achievements.css';
import InfiniteMenu from '../components/InfiniteMenu';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('order', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAchievements(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching achievements: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="achievements-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', minHeight: '100vh' }}>
        <h2>Loading achievements...</h2>
      </div>
    );
  }

  const menuItems = achievements.map((item) => ({
    image: item.images?.[0] || '/TRFPV_Assets/JUSTLOGO.png',
    title: item.title,
    description: item.description,
    link: ''
  }));

  return (
    <div className="achievements-page">
      <InfiniteMenu items={menuItems} />
    </div>
  );
};

export default Achievements;
