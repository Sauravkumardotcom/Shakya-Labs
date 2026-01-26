import React, { useEffect } from 'react';
import './Stars.css';

const Stars = () => {
  useEffect(() => {
    const container = document.getElementById('starsContainer');
    if (!container) return;

    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.width = Math.random() * 3 + 1 + 'px';
      star.style.height = star.style.width;
      container.appendChild(star);
    }
  }, []);

  return <div className="stars" id="starsContainer"></div>;
};

export default Stars;
