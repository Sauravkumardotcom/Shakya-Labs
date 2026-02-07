import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { projects } from '../../data/projects';

const ProjectsSection = () => {
  return (
    <Section id="projects" background="primary">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Project Portfolio
        </h2>
        <p className="text-xl text-shakya-text-secondary max-w-3xl mx-auto">
          A showcase of diverse projects demonstrating our technical expertise and problem-solving capabilities
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <Card key={project.id} hover={true} className="flex flex-col h-full">
            <div className="mb-3">
              <Badge variant="primary">{project.category}</Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {project.title}
            </h3>
            <p className="text-shakya-text-secondary mb-4 flex-grow">
              {project.description}
            </p>
            
            <div className="mt-auto pt-4 border-t border-shakya-border">
              <h4 className="text-xs font-semibold text-shakya-cyan mb-2 uppercase tracking-wide">Tech Stack</h4>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, idx) => (
                  <Badge key={idx} variant="tech">{tech}</Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default ProjectsSection;
