import React, { useState } from 'react';
import './LoveLetter.css';

const LoveLetter = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="section" id="letterSection">
      <div className="container">
        <h2 className="section-title">💌 A Letter from My Heart</h2>
        <div
          className={`letter-envelope ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="letter-icon">
            <i className="fas fa-envelope-open-heart"></i>
          </div>
          <p className="letter-text">Click to open my letter 💕</p>
          <div className="letter-content">
            <h3>My Dearest BUBU,</h3>

            <p>
              As I sit down to write this, my heart is overflowing with so much love and gratitude
              for having you in my life. Today marks not just another birthday, but a celebration
              of YOU - the most beautiful, kind, and amazing person I know.
            </p>

            <p>
              Do you remember that tour in 2022? When we first saw each other, I felt something
              different. I didn't know it at that moment, but you were about to become my forever.
              And then, on November 29th, 2025, when we met face to face for the first time - that
              was when I truly understood what destiny meant.
            </p>

            <p>
              <strong>You are my Shivani</strong>, my BUBU, my Shivi, my Kaminu - every name carries
              a piece of my heart. You are the one who makes me believe in love, in fate, in
              forever.
            </p>

            <p>On this special day, I want you to know:</p>
            <ul>
              <li>You are the smile that lights up my darkest days</li>
              <li>You are the heartbeat that synchronizes perfectly with mine</li>
              <li>You are the dream I never knew I needed until you became my reality</li>
              <li>You are the love that grows deeper with every sunrise</li>
              <li>You are my reason to believe in forever</li>
              <li>You are my greatest blessing</li>
            </ul>

            <p>
              From 2004 to today - 21 years of you being the most incredible person, and now I get
              to spend my life celebrating every single day of your existence. Thank you for being
              born, thank you for existing, thank you for choosing me.
            </p>

            <p className="closing">
              Happy 21st Birthday, my love. Here's to 21 more years of making memories, falling
              deeper in love, and building our forever together.
              <br />
              <br />
              Forever yours with all my heart,
              <br />
              Your Loving Partner 💕
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoveLetter;
