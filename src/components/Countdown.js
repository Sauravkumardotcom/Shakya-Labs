import React, { useState, useEffect } from 'react';
import './Countdown.css';

const Countdown = () => {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const targetDate = new Date('2025-02-02').getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsBirthday(true);
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTime({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="countdown-section">
      <p className="countdown-label">⏰ Countdown to February 2nd ⏰</p>
      
      {!isBirthday ? (
        <div className="countdown-display">
          <div className="countdown-unit">
            <span className="value">{String(time.days).padStart(2, '0')}</span>
            <span className="label">Days</span>
          </div>
          <span className="separator">:</span>
          <div className="countdown-unit">
            <span className="value">{String(time.hours).padStart(2, '0')}</span>
            <span className="label">Hours</span>
          </div>
          <span className="separator">:</span>
          <div className="countdown-unit">
            <span className="value">{String(time.minutes).padStart(2, '0')}</span>
            <span className="label">Minutes</span>
          </div>
          <span className="separator">:</span>
          <div className="countdown-unit">
            <span className="value">{String(time.seconds).padStart(2, '0')}</span>
            <span className="label">Seconds</span>
          </div>
        </div>
      ) : (
        <div className="birthday-message-container">
          <p className="birthday-message">🎉 TODAY IS YOUR DAY! 🎉</p>
          <p className="birthday-subtext">Happy 21st Birthday to the most amazing person in my life!</p>
        </div>
      )}
    </section>
  );
};

export default Countdown;
