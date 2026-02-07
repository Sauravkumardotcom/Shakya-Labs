import React from 'react';

const Footer = () => {
  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Products', href: '#products' },
    { name: 'Services', href: '#services' },
    { name: 'Projects', href: '#projects' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { name: 'LinkedIn', href: '#', icon: '💼' },
    { name: 'GitHub', href: '#', icon: '💻' },
    { name: 'Twitter', href: '#', icon: '🐦' },
    { name: 'Email', href: 'mailto:contact@shakyalabs.com', icon: '📧' }
  ];

  return (
    <footer className="bg-shakya-bg-primary border-t border-shakya-border py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-shakya-cyan to-shakya-blue flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-6 h-6 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4L4 32h32L20 4Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M20 4L12 18h16L20 4Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.8"/>
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg font-heading">Shakya Labs</div>
                <div className="text-shakya-cyan text-xs font-medium">Built with Precision</div>
              </div>
            </div>
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
              © {new Date().getFullYear()} Shakya Labs — Built by Saurav Kumar Shakya
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
