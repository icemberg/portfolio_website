import PropTypes from 'prop-types';
import SectionHeader from './SectionHeader';

const SkillsMatrix = ({ skills }) => {
  if (!skills) return null;
  return (
    <section id="skills" className="mb-section">
      <SectionHeader title="Skill_Matrix" subtitle="// VECTORS: CORE_COMPETENCIES" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {skills?.map((skillSet) => (
          <div key={skillSet.category} className="bg-surface widget-border p-5 group hover:bg-surface-accent transition-colors">
            <div className="font-mono text-label text-accent/60 mb-1 group-hover:text-accent transition-colors">SYST_ID: {skillSet.category?.substring(0, 3).toUpperCase()}</div>
            <h3 className="font-mono text-label text-white/70 uppercase tracking-widest mb-4 border-b border-white/10 pb-2 group-hover:text-accent transition-colors">
              {skillSet.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillSet.items && skillSet.items.split(',').map((item) => (
                <span key={item.trim()} className="font-mono text-chip text-text-main bg-background border border-white/5 px-2 py-1 group-hover:border-accent/30 transition-colors">
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
