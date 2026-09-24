import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';

const TestimonialsSection = ({ testimonials = [] }) => {
  const items = testimonials.length ? testimonials : [
    { id: 1, quote: 'Working with Shakya Labs transformed our operations...', name: 'Dr. Rajesh Kumar', role: 'Academic Director', rating: 5 },
    { id: 2, quote: 'The technical expertise and clear communication...', name: 'Priya Sharma', role: 'Product Manager', rating: 5 },
    { id: 3, quote: 'Shakya Labs understood our vision...', name: 'Amit Verma', role: 'Startup Founder', rating: 5 },
    { id: 4, quote: 'Reliable, skilled, and detail-oriented...', name: 'Sarah Johnson', role: 'Operations Lead', rating: 5 }
  ];

  return (
    <Section id="testimonials" background="secondary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Client Testimonials</h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">What our clients say about working with Shakya Labs</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {items.map((testimonial) => (
          <Card key={testimonial.id} hover={true} className="border-l-4 border-shakya-cyan">
            <div className="mb-4">
              <div className="flex text-shakya-cyan mb-2">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-shakya-text-secondary italic text-lg leading-relaxed">"{testimonial.quote}"</p>
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
