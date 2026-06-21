import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Masonry from '../components/Masonry';
import ScrollFloat from '../components/ScrollFloat';
import './Gallery.css';

gsap.registerPlugin(ScrollTrigger);

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [heroImgUrl, setHeroImgUrl] = useState(null);
  const [loadingHero, setLoadingHero] = useState(true);

  const wrapperRef = useRef(null);
  const heroImgRef = useRef(null);
  const heroScrollRef = useRef(null);
  const galleryContentRef = useRef(null);

  useLayoutEffect(() => {
    if (loadingHero) return;
    if (!wrapperRef.current || !heroImgRef.current || !heroScrollRef.current || !galleryContentRef.current) return;

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          end: '+=100vh',
          scrub: true,
        }
      });

      tl.to(heroImgRef.current, {
        scale: 1.1,
        opacity: 0,
        filter: 'blur(10px)',
        ease: 'none',
        duration: 1
      }, 0)
      .to(heroScrollRef.current, {
        opacity: 0,
        ease: 'power1.in',
        duration: 0.2
      }, 0)
      .fromTo(galleryContentRef.current, {
        opacity: 0,
        scale: 0.95,
      }, {
        opacity: 1,
        scale: 1,
        ease: 'power1.out',
        duration: 1
      }, 0);

    }, wrapperRef.current);

    return () => ctx.revert();
  }, [loadingHero]);

  const handleMasonryLayoutComplete = React.useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

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

    const heroUnsubscribe = onSnapshot(doc(db, 'settings', 'gallery'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().heroImageUrl) {
        setHeroImgUrl(docSnap.data().heroImageUrl);
      } else {
        setHeroImgUrl("/TRFPV_Assets/team_rotor_fpv_group_photo.png");
      }
      setLoadingHero(false);
    }, (error) => {
      setHeroImgUrl("/TRFPV_Assets/team_rotor_fpv_group_photo.png");
      setLoadingHero(false);
    });

    return () => {
      unsubscribe();
      heroUnsubscribe();
    };
  }, []);

  if (loadingHero) {
    return <div className="gallery-page" style={{ height: '100vh' }}></div>;
  }

  return (
    <div className="gallery-page">
      <div className="gallery-transition-wrapper" ref={wrapperRef}>
        
        {/* Hero Section */}
        <div className="gallery-hero">
          <img 
            ref={heroImgRef}
            src={heroImgUrl} 
            alt="Team Rotor FPV" 
            className="gallery-hero-img"
          />
          <div className="gallery-hero-text">
            <ScrollFloat triggerRef={wrapperRef} scrollStart="top top" scrollEnd="+=100vh">
              Gallery
            </ScrollFloat>
            <div ref={heroScrollRef} className="gallery-hero-scroll">
              <span className="arrow">↓</span> Scroll to Explore
            </div>
          </div>
        </div>

        {/* Gallery Content */}
        <div className="gallery-container" ref={galleryContentRef}>
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
              onImageClick={setSelectedImage}
              onLayoutComplete={handleMasonryLayoutComplete}
            />
          ) : (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>No gallery images available yet.</div>
          )}
        </div>
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
