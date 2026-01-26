import React from 'react';
import './Hero.css';

const Hero = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <div className="container">
        <div className="special-content">
          <div className="heart-animation">
            <i className="fas fa-heart"></i>
          </div>

          <h1>Happy Birthday</h1>
          <p className="subtitle">BUBU 💕</p>
          <p className="name-display">Shivani - My Love, My Life, My Forever</p>
          <div className="pet-names">
            <span>BUBU</span> • <span>Shivi</span> • <span>Kaminu</span> • <span>My Love</span>
          </div>

          <div className="button-group">
            <button
              className="btn"
              onClick={() => scrollToSection('letterSection')}
            >
              <i className="fas fa-envelope-heart"></i> Read My Letter
            </button>
            <button
              className="btn"
              onClick={() => scrollToSection('timelineSection')}
            >
              <i className="fas fa-heart"></i> Our Story
            </button>
            <button
              className="btn"
              onClick={() => scrollToSection('gallerySection')}
            >
              <i className="fas fa-images"></i> Our Photos
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Hero;
