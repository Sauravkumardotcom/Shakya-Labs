import React from 'react';
import Button from '../ui/Button';

const HeroSection = ({ data, stats = [] }) => {
  const hero = data || {
    badge: 'Ancient Wisdom × Modern Engineering',
    heading: 'Engineering Digital Systems with Clarity and Purpose',
    description: 'Shakya Labs builds products, platforms, and scalable software solutions that transform complex business challenges into elegant systems.',
    primaryButtonText: 'Explore Products',
    primaryButtonUrl: '#products',
    secondaryButtonText: 'Work With Us',
    secondaryButtonUrl: '#contact'
  };

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-shakya-bg-primary overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-shakya-cyan/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-shakya-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle, #00d9ff 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 rounded-full bg-shakya-bg-card border border-shakya-cyan/30 text-shakya-cyan font-medium text-sm">
              {hero.badge}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
              {hero.heading}
            </h1>

            <p className="text-xl text-shakya-text-secondary max-w-2xl">
              {hero.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="primary" size="lg" href={hero.primaryButtonUrl || '#products'}>
                {hero.primaryButtonText || 'Explore Products'}
              </Button>
              <Button variant="secondary" size="lg" href={hero.secondaryButtonUrl || '#contact'}>
                {hero.secondaryButtonText || 'Work With Us'}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              {stats.map((stat) => (
                <div className="text-center" key={stat.id || stat.label}>
                  <div className="text-3xl font-bold bg-gradient-to-r from-shakya-cyan to-shakya-blue bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-shakya-text-secondary font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center pt-4 md:pt-0">
            <img
              src="/branding/shakyalabswithprofilelogo.png"
              alt="Shakya Labs founder and brand profile"
              className="block h-auto w-full max-w-[32rem] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
