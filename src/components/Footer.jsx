import React from 'react';
import ShakyaLabsLogo from './ShakyaLabsLogo';

const Footer = ({ settings }) => {
  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Products', href: '#products' },
    { name: 'Services', href: '#services' },
    { name: 'Projects', href: '#projects' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { name: 'LinkedIn', href: settings?.socialLinks?.linkedin || '#', icon: '💼' },
    { name: 'GitHub', href: settings?.socialLinks?.github || '#', icon: '💻' },
    { name: 'Twitter', href: settings?.socialLinks?.twitter || '#', icon: '🐦' },
    { name: 'Email', href: `mailto:${settings?.email || 'contact@shakyalabs.com'}`, icon: '📧' }
  ];

  return (
    <footer className="bg-shakya-bg-primary border-t border-shakya-border py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="#" className="inline-flex mb-4" aria-label="Shakya Labs home">
              <ShakyaLabsLogo variant="footer" />
            </a>
            <p className="text-shakya-text-secondary text-sm max-w-md">
              Building scalable software solutions with ancient wisdom and modern engineering. Transforming ideas into impact through innovative technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-shakya-text-secondary hover:text-shakya-cyan transition-colors text-sm flex items-center"
                  >
                    <span className="mr-2">→</span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-shakya-text-secondary hover:text-shakya-cyan transition-colors text-sm flex items-center"
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-shakya-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-shakya-text-secondary text-sm">
              {settings?.copyright || `© ${new Date().getFullYear()} Shakya Labs — Built by Saurav Kumar Shakya`}
            </p>
            <p className="text-shakya-text-secondary text-sm">
              Built with React, Tailwind CSS & ❤️
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
