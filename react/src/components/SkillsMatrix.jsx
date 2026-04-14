import React from 'react';
import PropTypes from 'prop-types';

const SkillsMatrix = ({ skills }) => {
  if (!skills) return null;
  return (
    <section id="skills" className="mb-32">
      <div className="mb-12 border-b border-white/5 pb-4">
        <h2 className="font-header text-4xl md:text-6xl uppercase tracking-tighter text-accent">Skill_Matrix</h2>
        <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">// VECTORS: CORE_COMPETENCIES</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {skills?.map((skillSet) => (
          <div key={skillSet.category} className="bg-surface widget-border p-5 group hover:bg-surface-accent transition-colors">
            <div className="font-mono text-[9px] text-accent/50 mb-1 group-hover:text-accent transition-colors">SYST_ID: {skillSet.category?.substring(0, 3).toUpperCase()}</div>
            <h3 className="font-mono text-[10px] text-white/50 uppercase tracking-widest mb-4 border-b border-white/10 pb-2 group-hover:text-accent transition-colors">
              {skillSet.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillSet.items && skillSet.items.split(',').map((item) => (
                <span key={item.trim()} className="font-mono text-[11px] text-text-main bg-background border border-white/5 px-2 py-1 group-hover:border-accent/30 transition-colors">
                  {item.trim()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

SkillsMatrix.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      items: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default SkillsMatrix;
