import React, { useState } from 'react';
import './Gallery.css';

const Gallery = () => {
  const photoDescriptions = [
    { caption: 'November 29, 2025 - Our First Meet', emoji: '💑' },
    { caption: 'The Tour 2022 - Where It All Began', emoji: '🗺️' },
    { caption: 'Us - Perfect Together', emoji: '✨' },
    { caption: 'Our Beautiful Love Story', emoji: '💕' },
    { caption: 'Happy Moments with You', emoji: '😊' },
    { caption: 'Forever and Always', emoji: '💖' },
  ];

  const [imageLoaded, setImageLoaded] = useState({});

  const handleImageLoad = (index) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <section className="section" id="gallerySection">
      <div className="container">
        <h2 className="section-title">📸 Our Precious Moments Together</h2>
        <div className="gallery-grid">
          {photoDescriptions.map((photo, index) => (
            <div key={index} className="gallery-item">
              {!imageLoaded[index] && (
                <div className="gallery-placeholder">
                  <i className="fas fa-image"></i>
                  <p>
                    {photo.emoji}
                    <br />
                    {photo.caption}
                  </p>
                </div>
              )}
              <img
                src={`/photos/photo${index + 1}.jpg`}
                alt={photo.caption}
                onLoad={() => handleImageLoad(index)}
                style={{ display: imageLoaded[index] ? 'block' : 'none' }}
              />
            </div>
          ))}
        </div>
        <div className="gallery-note">
          <p>
            <strong>💡 How to add your beautiful photos:</strong>
          </p>
          <p>
            1. Create a <code>photos</code> folder in the <code>public</code> directory
          </p>
          <p>
            2. Add your images: <code>photo1.jpg</code>, <code>photo2.jpg</code>,
            <code>photo3.jpg</code>, etc.
          </p>
          <p>3. Simply refresh the page - your photos will appear automatically!</p>
          <p style={{ marginTop: '1.5rem', color: 'var(--primary)', fontWeight: '700' }}>
            Each photo you add will be displayed as a beautiful memory of us together 💕
          </p>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
