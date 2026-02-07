import React from 'react';

const Card = ({ 
  children, 
  className = '',
  hover = true,
  glow = false 
}) => {
  const baseStyles = 'bg-shakya-bg-card rounded-xl border border-shakya-border p-6 transition-all';
  const hoverStyles = hover ? 'hover:scale-105 hover:shadow-card hover:border-shakya-cyan/50' : '';
  const glowStyles = glow ? 'shadow-cyan-glow' : '';
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${glowStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
