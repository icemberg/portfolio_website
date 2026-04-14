import React from 'react';
import PropTypes from 'prop-types';
import { Award } from 'lucide-react';

const Certifications = ({ certifications }) => {
  if (!certifications) return null;

  return (
    <section id="certifications" className="mb-20 md:mb-32">
      <div className="mb-12 border-b border-white/5 pb-4">
        <h2 className="font-header text-4xl md:text-6xl uppercase tracking-tighter text-accent">Certifications</h2>
        <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">{'// VALIDATED_CREDENTIALS'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => (
          <div key={cert.name} className="bg-surface widget-border p-6 group hover:bg-surface-accent transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-accent/10 p-3 rounded-lg group-hover:bg-accent group-hover:text-background transition-colors">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-header text-xl uppercase mb-2 group-hover:text-accent transition-colors">
              {cert.name}
            </h3>
            <div className="font-mono text-[11px] text-text-dim uppercase tracking-wider mb-4">
              {cert.organization} | {cert.date}
            </div>
            {cert.imageUrl && (
              <div className="mt-4 border border-white/10 p-1 bg-background/50 rounded overflow-hidden">
                <img src={cert.imageUrl} alt={`${cert.name} Certificate`} className="w-full h-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

Certifications.propTypes = {
  certifications: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      organization: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    })
  ),
};

export default Certifications;
