import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Countdown from './components/Countdown';
import LoveLetter from './components/LoveLetter';
import Timeline from './components/Timeline';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import FloatingHearts from './components/FloatingHearts';
import Stars from './components/Stars';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    if (!isDarkTheme) {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="app">
      <Stars />
      <FloatingHearts />
      <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <Hero />
      <Countdown />
      <LoveLetter />
      <Timeline />
      <Gallery />
      <Footer />
    </div>
  );
}

export default App;
