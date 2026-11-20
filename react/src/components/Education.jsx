import React from 'react';
import PropTypes from 'prop-types';
import { GraduationCap, MapPin, Calendar } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Education = ({ education }) => {
  if (!education) return null;

  return (
    <section id="education">
      <SectionHeader title="Academic_Foundation" subtitle="// CORE_KNOWLEDGE_SYSTEMS" />

      <div className="space-y-8">
        {education.map((edu) => (
          <div key={edu.degree + edu.institution} className="bg-surface widget-border p-5 sm:p-8 group relative overflow-hidden transition-all duration-300 hover:bg-surface-accent">
            <div className="scanline"></div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent/10 p-2 rounded text-accent">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-header text-card-title uppercase tracking-tight group-hover:text-accent transition-colors">
                    {edu.degree}
                  </h3>
                </div>
                
                <h4 className="font-technical text-body-lg text-white/90 mb-4 sm:ml-11">
                  {edu.institution}
                </h4>

                <div className="flex flex-wrap gap-4 sm:ml-11 font-mono text-label text-text-dim uppercase tracking-widest mb-6">
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
                  <div className="sm:ml-11 inline-block bg-accent/5 border border-accent/20 px-3 py-1 rounded font-mono text-label text-accent">
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
