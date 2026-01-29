import React, { useState } from 'react';
import './Header.css';

const Header = ({ isDarkTheme, toggleTheme, languageMode, onLanguageChange, onHomeClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={`modern-navbar ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <div className="logo-icon">💕</div>
          <div className="logo-text">
            <span className="logo-brand">Shakya Labs</span>
            <span className="logo-subtitle">Built with Love</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="navbar-menu">
          <button
            onClick={onLanguageChange}
            className="nav-btn language-btn"
            title="Toggle language"
          >
            {languageMode === 'english' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
          <button
            onClick={toggleTheme}
            className="nav-btn theme-btn"
            title="Toggle theme"
            aria-label="Toggle dark/light theme"
          >
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
          <button
            onClick={onHomeClick}
            className="nav-btn home-btn"
          >
            Home
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="mobile-menu active">
          <button
            onClick={() => {
              onLanguageChange();
              setMobileMenuOpen(false);
            }}
            className="mobile-menu-item"
          >
            {languageMode === 'english' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
          <button
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
            className="mobile-menu-item"
          >
            {isDarkTheme ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button
            onClick={() => {
              onHomeClick();
              setMobileMenuOpen(false);
            }}
            className="mobile-menu-item home-item"
          >
            Home
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;
