import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Masonry from '../components/Masonry';
import './Gallery.css';

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('order', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGalleryItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gallery:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="gallery-page">
      <div className="gallery-container">
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading gallery...</div>
        ) : galleryItems.length > 0 ? (
          <Masonry
            items={galleryItems}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            blurToFocus={true}
            colorShiftOnHover={false}
            onImageClick={(item) => setSelectedImage(item)}
          />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>No gallery images available yet.</div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && createPortal(
        <div className="gallery-lightbox" onClick={() => setSelectedImage(null)}>
          <button className="gallery-lightbox-close" onClick={() => setSelectedImage(null)}>
            &times;
          </button>
          <img 
            src={selectedImage.img} 
            alt="Enlarged gallery view" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Gallery;
