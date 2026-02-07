import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import { testimonials } from '../../data/testimonials';

const TestimonialsSection = () => {
  return (
    <Section id="testimonials" background="secondary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Client Testimonials
        </h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">
          What our clients say about working with Shakya Labs
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} hover={true} className="border-l-4 border-shakya-cyan">
            <div className="mb-4">
              <div className="flex text-shakya-cyan mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-shakya-text-secondary italic text-lg leading-relaxed">
                "{testimonial.quote}"
              </p>
            </div>
            <div className="pt-4 border-t border-shakya-border">
              <p className="text-white font-semibold">{testimonial.name}</p>
              <p className="text-shakya-text-secondary text-sm">{testimonial.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default TestimonialsSection;
