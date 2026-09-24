import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';

const defaultValues = [
  { title: 'Digital Platforms', description: 'Building scalable web platforms that serve thousands of users with reliability and performance.', icon: '🌐' },
  { title: 'Software Products', description: 'Creating innovative software products that solve real-world problems with elegant solutions.', icon: '💻' },
  { title: 'Automation Systems', description: 'Developing intelligent automation systems that streamline workflows and increase efficiency.', icon: '⚡' },
  { title: 'Scalable Applications', description: 'Engineering applications built to grow with your business, from MVP to enterprise scale.', icon: '📈' }
];

const AboutSection = ({ data }) => {
  const about = data || {
    title: 'About Shakya Labs',
    description: 'Founded by Saurav Kumar Shakya, Shakya Labs is a technology innovation lab dedicated to building exceptional software systems that drive business success.',
    supportingText: 'We build digital platforms, software products, automation systems, and scalable experiences for modern businesses.'
  };

  return (
    <Section id="about" background="secondary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {about.title}
        </h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">
          {about.description}
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <img
          src="/branding/nobgprofile.png"
          alt="Shakya Labs founder and brand artwork"
          className="h-56 w-56 md:h-72 md:w-72 object-contain"
          loading="lazy"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {defaultValues.map((value, index) => (
          <Card key={index} hover={true}>
            <div className="flex items-start space-x-4">
              <div className="text-4xl flex-shrink-0">{value.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-shakya-text-secondary">{value.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {about.supportingText && (
        <div className="max-w-3xl mx-auto text-center mt-8 text-shakya-text-secondary">
          {about.supportingText}
        </div>
      )}
    </Section>
  );
};

export default AboutSection;
