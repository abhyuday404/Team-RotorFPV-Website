import React, { useState, useEffect } from 'react';
import './Achievements.css';
import InfiniteMenu from '../components/InfiniteMenu';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1563804863336-7ce21c238bd7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=800',
];

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

  const menuItems = achievements.map((item, i) => ({
    image: item.images?.[0] || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
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
