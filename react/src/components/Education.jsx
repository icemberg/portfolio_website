import React from 'react';
import PropTypes from 'prop-types';
import { GraduationCap, MapPin, Calendar } from 'lucide-react';

const Education = ({ education }) => {
  if (!education) return null;

  return (
    <section id="education" className="mb-20 md:mb-32">
      <div className="mb-12 border-b border-white/5 pb-4">
        <h2 className="font-header text-4xl md:text-6xl uppercase tracking-tighter text-accent">Academic_Foundation</h2>
        <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">{'// CORE_KNOWLEDGE_SYSTEMS'}</p>
      </div>

      <div className="space-y-8">
        {education.map((edu) => (
          <div key={edu.degree + edu.institution} className="bg-surface widget-border p-8 group relative overflow-hidden transition-all duration-300 hover:bg-surface-accent">
            <div className="scanline"></div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent/10 p-2 rounded text-accent">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-header text-2xl uppercase tracking-tight group-hover:text-accent transition-colors">
                    {edu.degree}
                  </h3>
                </div>
                
                <h4 className="font-technical text-xl text-white/90 mb-4 ml-11">
                  {edu.institution}
                </h4>
                
                <div className="flex flex-wrap gap-4 ml-11 font-mono text-xs text-text-dim uppercase tracking-widest mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-accent/50" />
                    <span>{edu.location || 'Bengaluru, India'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-accent/50" />
                    <span>{edu.duration}</span>
                  </div>
                </div>

                {edu.gpa && (
                  <div className="ml-11 inline-block bg-accent/5 border border-accent/20 px-3 py-1 rounded font-mono text-xs text-accent">
                    RESULT: {edu.gpa}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

Education.propTypes = {
  education: PropTypes.arrayOf(
    PropTypes.shape({
      degree: PropTypes.string.isRequired,
      institution: PropTypes.string.isRequired,
      location: PropTypes.string,
      duration: PropTypes.string.isRequired,
      gpa: PropTypes.string,
    })
  ),
};

export default Education;
