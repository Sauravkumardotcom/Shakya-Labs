import React from 'react';
import './Header.css';

const Header = ({ isDarkTheme, toggleTheme }) => {
  return (
    <header>
      <div className="container">
        <div className="header-content">
          <a href="/" className="logo">💕 Shakya Labs</a>
          <div className="header-actions">
            <button
              className="back-btn"
              onClick={() => window.history.back()}
              title="Go back to previous page"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle dark/light theme"
            >
              <i className={`fas fa-${isDarkTheme ? 'sun' : 'moon'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
