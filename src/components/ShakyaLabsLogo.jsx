import React from 'react';

const logoSource = '/branding/shakyalabswithprofilelogo.png';
const logoAlt = 'Shakya Labs — Ancient Wisdom × Modern Engineering';

const variantClasses = {
  navbar: 'h-16 w-24 sm:h-20 sm:w-32 md:h-24 md:w-36 lg:w-44',
  mobile: 'h-16 w-24',
  footer: 'h-28 w-44 sm:h-36 sm:w-56',
  admin: 'h-20 w-32 sm:h-24 sm:w-36',
  login: 'h-32 w-48'
};

const ShakyaLabsLogo = ({ variant = 'navbar', className = '' }) => (
  <img
    src={logoSource}
    alt={logoAlt}
    className={`block max-w-full object-contain ${variantClasses[variant] || variantClasses.navbar} ${className}`}
  />
);

export default ShakyaLabsLogo;