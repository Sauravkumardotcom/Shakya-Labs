import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  href,
  type = 'button',
  disabled = false,
  className = ''
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variants = {
    primary: 'bg-gradient-to-r from-shakya-cyan to-shakya-blue text-white hover:shadow-cyan-glow focus:ring-shakya-cyan',
    secondary: 'border-2 border-shakya-cyan text-shakya-cyan hover:bg-shakya-cyan hover:text-shakya-bg-primary focus:ring-shakya-cyan',
    outline: 'border-2 border-gray-600 text-white hover:border-shakya-cyan hover:text-shakya-cyan focus:ring-shakya-cyan'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

export default Button;
