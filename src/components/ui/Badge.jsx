import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const baseStyles = 'inline-block px-3 py-1 rounded-full text-sm font-medium';
  
  const variants = {
    default: 'bg-shakya-bg-secondary text-shakya-cyan border border-shakya-cyan/30',
    primary: 'bg-gradient-to-r from-shakya-cyan/20 to-shakya-blue/20 text-shakya-cyan border border-shakya-cyan/50',
    tech: 'bg-gray-800 text-gray-300 border border-gray-700'
  };
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
