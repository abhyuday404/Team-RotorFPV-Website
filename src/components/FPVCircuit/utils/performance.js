export const detectQuality = async () => {
  return new Promise((resolve) => {
    let frames = 0;
    let startTime = performance.now();

    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - startTime >= 1000) {
        const fps = frames;
        let quality = 'high';
        if (fps < 30) quality = 'low';
        else if (fps < 50) quality = 'medium';
        
        // Mobile override check
        if (window.innerWidth <= 768) {
          quality = quality === 'high' ? 'medium' : quality; // Cap mobile at medium
        }

        resolve({ fps, quality });
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
};

export const getQualitySettings = (quality) => {
  switch (quality) {
    case 'low':
      return {
        bloom: false,
        volumetricFog: false,
        chromaticAberration: false,
        particleCount: 100,
        enableShadows: false,
      };
    case 'medium':
      return {
        bloom: true,
        volumetricFog: false,
        chromaticAberration: false,
        particleCount: 500,
        enableShadows: false,
      };
    case 'high':
    default:
      return {
        bloom: true,
        volumetricFog: true,
        chromaticAberration: true,
        particleCount: 2000,
        enableShadows: true,
      };
  }
};
