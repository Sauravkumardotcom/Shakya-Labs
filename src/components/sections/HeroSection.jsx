import React from 'react';
import Button from '../ui/Button';

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-shakya-bg-primary overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-shakya-cyan/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-shakya-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle, #00d9ff 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 rounded-full bg-shakya-bg-card border border-shakya-cyan/30 text-shakya-cyan font-medium text-sm">
              Ancient Wisdom × Modern Engineering
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
              Engineering Digital Systems with{' '}
              <span className="bg-gradient-to-r from-shakya-cyan to-shakya-blue bg-clip-text text-transparent">
                Clarity and Purpose
              </span>
            </h1>
            
            <p className="text-xl text-shakya-text-secondary max-w-2xl">
              Shakya Labs builds products, platforms, and scalable software solutions that transform complex business challenges into elegant systems.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="primary" size="lg" href="#products">
                Explore Products
              </Button>
              <Button variant="secondary" size="lg" href="#contact">
                Work With Us
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-shakya-cyan to-shakya-blue bg-clip-text text-transparent">
                  50+
                </div>
                <div className="text-sm text-shakya-text-secondary font-medium mt-1">Projects Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-shakya-cyan to-shakya-blue bg-clip-text text-transparent">
                  100%
                </div>
                <div className="text-sm text-shakya-text-secondary font-medium mt-1">Client Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-shakya-cyan to-shakya-blue bg-clip-text text-transparent">
                  8+
                </div>
                <div className="text-sm text-shakya-text-secondary font-medium mt-1">Years Experience</div>
              </div>
            </div>
          </div>
          
          {/* Right Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full h-96 flex items-center justify-center">
              {/* Geometric SVG Visualization */}
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="200" cy="200" r="150" stroke="url(#gradient1)" strokeWidth="1" opacity="0.3"/>
                <circle cx="200" cy="200" r="120" stroke="url(#gradient1)" strokeWidth="1.5" opacity="0.5"/>
                <circle cx="200" cy="200" r="90" stroke="url(#gradient1)" strokeWidth="2" opacity="0.7"/>
                <path d="M200 50L320 150L320 250L200 350L80 250L80 150Z" stroke="url(#gradient1)" strokeWidth="2" fill="url(#gradient1)" opacity="0.1"/>
                <circle cx="200" cy="200" r="5" fill="url(#gradient1)"/>
                <circle cx="200" cy="50" r="4" fill="#00d9ff" opacity="0.6"/>
                <circle cx="320" cy="150" r="4" fill="#00d9ff" opacity="0.6"/>
                <circle cx="320" cy="250" r="4" fill="#0080ff" opacity="0.6"/>
                <circle cx="200" cy="350" r="4" fill="#0080ff" opacity="0.6"/>
                <circle cx="80" cy="250" r="4" fill="#0080ff" opacity="0.6"/>
                <circle cx="80" cy="150" r="4" fill="#00d9ff" opacity="0.6"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d9ff"/>
                    <stop offset="100%" stopColor="#0080ff"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
