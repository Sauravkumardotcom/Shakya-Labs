import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ProductsSection = ({ products = [] }) => {
  const items = products.length ? products : [
    { id: 1, title: 'College Management System', description: 'A multi-dashboard platform for Students, Faculty, Admin, and Parents', features: ['Attendance tracking and management', 'Examination and grading system', 'Internal messaging platform'], techStack: ['Java', 'MySQL', 'Spring Boot', 'React'], icon: '🎓' },
    { id: 2, title: 'Movie Space Platform', description: 'A movie discovery platform with modern UI and robust backend', features: ['Comprehensive backend API', 'User authentication and authorization', 'Modern, responsive UI design'], techStack: ['React', 'Node.js', 'MongoDB', 'Express'], icon: '🎬' },
    { id: 3, title: 'AI Chatbot System', description: 'Intelligent chatbot platform with automation workflows', features: ['Secure login authentication', 'MySQL database integration', 'Automated response workflows'], techStack: ['Python', 'MySQL', 'NLP', 'Flask'], icon: '🤖' }
  ];

  return (
    <Section id="products" background="primary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Products</h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">Real-world software solutions built to solve complex problems and deliver measurable value</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((product) => (
          <Card key={product.id} hover={true} className="flex flex-col h-full">
            <div className="text-5xl mb-4">{product.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-3">{product.title}</h3>
            <p className="text-shakya-text-secondary mb-4 flex-grow">{product.description}</p>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-shakya-cyan mb-2">Key Features:</h4>
              <ul className="space-y-1">
                {(product.features || []).slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="text-sm text-shakya-text-secondary flex items-start">
                    <span className="text-shakya-cyan mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-shakya-border">
              {(product.techStack || []).map((tech, idx) => (
                <Badge key={idx} variant="tech">{tech}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default ProductsSection;
