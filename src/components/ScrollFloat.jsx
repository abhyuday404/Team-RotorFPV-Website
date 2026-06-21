import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollFloat = ({
  children,
  scrollContainerRef,
  triggerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'top top',
  scrollEnd = '+=200vh',
  stagger = 0.03
}) => {
  const containerRef = useRef(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split('').map((char, index) => (
      <span className="char" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const triggerEl = triggerRef && triggerRef.current ? triggerRef.current : el;

    let ctx = gsap.context(() => {
      const charElements = el.querySelectorAll('.char');
      if (charElements.length === 0) return;

      gsap.fromTo(
        charElements,
        {
          willChange: 'opacity, transform, filter',
          opacity: 1,
          yPercent: 0,
          scale: 1,
          filter: 'blur(0px)'
        },
        {
          duration: animationDuration,
          ease: 'power2.inOut',
          opacity: 0,
          yPercent: -50,
          scale: 1.1,
          filter: 'blur(10px)',
          stagger: stagger,
          scrollTrigger: {
            trigger: triggerEl,
            start: scrollStart,
            end: scrollEnd,
            scrub: true
          }
        }
      );
    }, el);

    return () => ctx.revert();
  }, [scrollContainerRef, triggerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  );
};

export default ScrollFloat;
