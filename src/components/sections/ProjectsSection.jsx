import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ProjectsSection = ({ projects = [] }) => {
  const items = projects.length ? projects : [
    { id: 1, title: 'College Management System', description: 'Comprehensive platform managing students, faculty, courses, and administration with real-time analytics.', techStack: ['Java', 'Spring Boot', 'MySQL', 'React', 'REST API'], category: 'Enterprise Software' },
    { id: 2, title: 'Event Management System', description: 'End-to-end event planning and management platform with attendee tracking and automated communications.', techStack: ['Node.js', 'Express', 'MongoDB', 'Vue.js'], category: 'Web Application' },
    { id: 3, title: 'Pilgrim Tour Website', description: 'Modern tourism website with booking system, itinerary management, and payment integration.', techStack: ['React', 'Tailwind CSS', 'Node.js', 'Stripe'], category: 'E-Commerce' },
    { id: 4, title: 'Movie Space Application', description: 'Movie discovery platform with advanced search, recommendations, and user reviews powered by external APIs.', techStack: ['React', 'Redux', 'TMDb API', 'Firebase'], category: 'Media Platform' }
  ];

  return (
    <Section id="projects" background="primary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Project Portfolio</h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">A showcase of diverse projects demonstrating our technical expertise and problem-solving capabilities</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((project) => (
          <Card key={project.id} hover={true} className="flex flex-col h-full">
            <div className="mb-3"><Badge variant="primary">{project.category}</Badge></div>
            <h3 className="text-xl font-bold text-white mb-3">{project.title}</h3>
            <p className="text-shakya-text-secondary mb-4 flex-grow">{project.description}</p>

            <div className="mt-auto pt-4 border-t border-shakya-border">
              <h4 className="text-xs font-semibold text-shakya-cyan mb-2 uppercase tracking-wide">Tech Stack</h4>
              <div className="flex flex-wrap gap-2">
                {(project.techStack || []).map((tech, idx) => (
                  <Badge key={idx} variant="tech">{tech}</Badge>
                ))}
              </div>

              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center mt-4 text-sm font-semibold text-shakya-cyan hover:text-white transition-colors">
                  Visit website ↗
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default ProjectsSection;
