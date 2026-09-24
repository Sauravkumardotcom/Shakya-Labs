import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';

const ServicesSection = ({ services = [] }) => {
  const items = services.length ? services : [
    { id: 1, title: 'Custom Web Application Development', description: 'Bespoke web applications engineered from the ground up to fit your unique business requirements and workflows perfectly.', icon: '⚙️' },
    { id: 2, title: 'Backend System Design', description: 'Robust, scalable backend architectures with performant APIs designed for enterprise-grade reliability and growth.', icon: '🔌' },
    { id: 3, title: 'Database Architecture', description: 'Strategic database design and optimization for data integrity, performance, and scalability at any volume.', icon: '💾' },
    { id: 4, title: 'UI/UX Design', description: 'User-centered interface design that balances aesthetics with functionality for exceptional user experiences.', icon: '🎨' },
    { id: 5, title: 'Automation Development', description: 'Custom automation solutions that streamline workflows, reduce manual effort, and increase operational efficiency.', icon: '🤖' },
    { id: 6, title: 'Software Consulting', description: 'Expert guidance on technology decisions, architecture reviews, and modernization strategies for your tech stack.', icon: '💡' }
  ];

  return (
    <Section id="services" background="secondary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Services We Offer</h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">Comprehensive software development services tailored to your business needs</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((service) => (
          <Card key={service.id} hover={true} className="text-center">
            <div className="text-5xl mb-4">{service.icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
            <p className="text-shakya-text-secondary">{service.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default ServicesSection;
