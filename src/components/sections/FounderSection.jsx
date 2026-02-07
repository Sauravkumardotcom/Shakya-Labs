import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const FounderSection = () => {
  const skills = [
    "Java",
    "Web Development",
    "Google Apps Script",
    "System Design",
    "Backend Development",
    "UI/UX Thinking"
  ];

  const certifications = [
    "Java Certification (NSDC)",
    "Communication & Customer Relationship Certification (Teleperformance)"
  ];

  return (
    <Section id="founder" background="primary">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meet the Founder
          </h2>
          <p className="text-xl text-shakya-text-secondary">
            The vision and expertise behind Shakya Labs
          </p>
        </div>
        
        <Card hover={false} glow={true} className="grid md:grid-cols-3 gap-8">
          {/* Profile Image */}
          <div className="flex justify-center items-start">
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-shakya-cyan/20 to-shakya-blue/20 flex items-center justify-center border-2 border-shakya-cyan/50">
              <div className="text-6xl">👨‍💻</div>
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Saurav Kumar Shakya
              </h3>
              <p className="text-shakya-cyan text-lg font-medium mb-4">
                Founder & Software Developer
              </p>
              <p className="text-shakya-text-secondary leading-relaxed">
                Saurav focuses on building scalable systems, product platforms, and real-world applications that solve meaningful problems. With a passion for clean architecture and user-centric design, he leads Shakya Labs with a vision to create software that makes a lasting impact.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-shakya-cyan mb-3 uppercase tracking-wide">
                Core Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <Badge key={idx} variant="primary">{skill}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-shakya-cyan mb-3 uppercase tracking-wide">
                Certifications
              </h4>
              <ul className="space-y-2">
                {certifications.map((cert, idx) => (
                  <li key={idx} className="text-shakya-text-secondary flex items-start">
                    <span className="text-shakya-cyan mr-2">✓</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
};

export default FounderSection;
