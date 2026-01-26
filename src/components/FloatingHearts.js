import React, { useEffect, useState } from 'react';
import './FloatingHearts.css';

const FloatingHearts = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const generateHeart = () => {
      const id = Math.random();
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const heartEmojis = ['❤️', '💕', '💖', '💗', '💝'];
      const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

      setHearts((prev) => [...prev, { id, left, delay, emoji }]);

      setTimeout(() => {
        setHearts((prev) => prev.filter((heart) => heart.id !== id));
      }, 5000);
    };

    const interval = setInterval(generateHeart, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="floating-hearts">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
          }}
        >
          {heart.emoji}
        </div>
      ))}
    </div>
  );
};

export default FloatingHearts;
