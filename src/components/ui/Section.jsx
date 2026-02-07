import React from 'react';

const Section = ({ 
  children, 
  id,
  className = '',
  background = 'primary' 
}) => {
  const backgrounds = {
    primary: 'bg-shakya-bg-primary',
    secondary: 'bg-shakya-bg-secondary',
    gradient: 'bg-gradient-to-b from-shakya-bg-primary to-shakya-bg-secondary'
  };
  
  return (
    <section 
      id={id}
      className={`py-20 px-4 sm:px-6 lg:px-8 ${backgrounds[background]} ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
};

export default Section;
