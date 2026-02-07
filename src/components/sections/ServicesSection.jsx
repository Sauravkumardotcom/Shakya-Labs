import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import { services } from '../../data/services';

const ServicesSection = () => {
  return (
    <Section id="services" background="secondary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Services We Offer
        </h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">
          Comprehensive software development services tailored to your business needs
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card key={service.id} hover={true} className="text-center">
            <div className="text-5xl mb-4">{service.icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">
              {service.title}
            </h3>
            <p className="text-shakya-text-secondary">
              {service.description}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default ServicesSection;
