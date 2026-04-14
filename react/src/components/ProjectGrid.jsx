import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, Code, Brain } from 'lucide-react';

const Github = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const ProjectGrid = ({ projects }) => {
  const [filter, setFilter] = useState('ALL');

  if (!projects) return null;

  const categories = ['ALL', ...new Set(projects.map(p => p.category))];
  const filteredProjects = filter === 'ALL' ? projects : projects.filter(p => p.category === filter);

  return (
    <section id="projects" className="mb-32">
      <div className="mb-12 border-b border-white/5 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="font-header text-4xl md:text-6xl uppercase tracking-tighter text-accent">Technical_Missions</h2>
            <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">// MODULES: RESEARCH_AND_DEVELOPMENT</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 border transition-all ${
                  filter === cat 
                    ? 'bg-accent text-background border-accent' 
                    : 'bg-transparent text-text-dim border-white/10 hover:border-accent hover:text-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj, index) => (
          <div key={index} className="bg-surface widget-border flex flex-col h-full group relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.1)]">
            <div className="scanline group-hover:opacity-50"></div>
            
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="font-mono text-[9px] text-accent border border-accent/20 px-2 py-1 bg-accent/5 uppercase tracking-widest">
                  {proj.category}
                </div>
                {proj.category === 'AI_ML' || proj.category === 'RESEARCH' ? <Brain className="w-4 h-4 text-accent/50" /> : <Code className="w-4 h-4 text-accent/50" />}
              </div>
              
              <h3 className="font-header text-xl uppercase tracking-tighter mb-3 leading-tight group-hover:text-accent transition-colors">
                {proj.title}
              </h3>
              
              <p className="text-xs text-text-dim leading-relaxed flex-grow mb-6 font-technical">
                {proj.description}
              </p>
              
              <div className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-1">
                  {proj.technologies && proj.technologies.split(',').map((tech, i) => (
                    <span key={i} className="font-mono text-[9px] text-white/70 bg-white/5 border border-white/10 px-2 py-[2px] rounded-sm group-hover:border-accent/30 group-hover:text-white transition-colors">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {proj.githubUrl && (
                      <a 
                        href={proj.githubUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-white/10 font-mono text-[10px] uppercase hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group/btn"
                      >
                        <Github className="w-3 h-3" />
                        <span>SOURCE_CODE</span>
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a 
                        href={proj.demoUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-accent bg-accent/5 text-accent font-mono text-[10px] uppercase hover:bg-accent hover:text-background transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>EXECUTE</span>
                      </a>
                    )}
                  </div>
                  {(proj.frontendUrl || proj.backendUrl) && (
                    <div className="flex gap-2">
                      {proj.frontendUrl && (
                        <a 
                          href={proj.frontendUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 flex items-center justify-center gap-2 py-2 border border-white/10 font-mono text-[10px] uppercase hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group/btn"
                        >
                          <Github className="w-3 h-3" />
                          <span>FRONTEND</span>
                        </a>
                      )}
                      {proj.backendUrl && (
                        <a 
                          href={proj.backendUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 flex items-center justify-center gap-2 py-2 border border-white/10 font-mono text-[10px] uppercase hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group/btn"
                        >
                          <Github className="w-3 h-3" />
                          <span>BACKEND</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

ProjectGrid.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      category: PropTypes.string,
      description: PropTypes.string.isRequired,
      technologies: PropTypes.string,
      githubUrl: PropTypes.string,
      frontendUrl: PropTypes.string,
      backendUrl: PropTypes.string,
      demoUrl: PropTypes.string,
    })
  ),
};

export default ProjectGrid;
