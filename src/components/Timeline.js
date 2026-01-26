import React from 'react';
import './Timeline.css';

const Timeline = () => {
  const timelineEvents = [
    {
      title: '2022 - The Tour',
      description:
        'Where it all began. Two souls meeting on a journey, discovering something magical in that moment. Little did we know...',
      emoji: '🗺️✨',
    },
    {
      title: 'February 2, 2004',
      description:
        'The day the world became a better place - the day you were born, Shivani. 21 beautiful years of being YOU.',
      emoji: '🎂👼',
    },
    {
      title: 'November 29, 2025',
      description:
        'Our first official meeting. The moment I looked into your eyes and realized - this is the person I want to spend forever with. Pure magic! ✨',
      emoji: '💑❤️',
    },
    {
      title: 'Every Day Since Then',
      description:
        'Building beautiful memories, sharing countless laughs, and creating our own love story one moment at a time.',
      emoji: '💕🌹',
    },
    {
      title: 'Forever & Always',
      description:
        'And many more birthdays to come, with you as my greatest treasure, my soulmate, and my reason to smile every single day.',
      emoji: '💫👰🤵',
    },
  ];

  return (
    <section className="section" id="timelineSection">
      <div className="container">
        <h2 className="section-title">📖 Our Love Story</h2>
        <div className="timeline">
          {timelineEvents.map((event, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>{event.title}</h4>
                <p>{event.description}</p>
                <div className="timeline-emoji">{event.emoji}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
