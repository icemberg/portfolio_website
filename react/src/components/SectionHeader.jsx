import PropTypes from 'prop-types';
import DecodeText from './DecodeText';

/** Section title (decrypts on reveal) + terminal-style subtitle, with an optional right-hand slot. */
const SectionHeader = ({ title, subtitle, children }) => (
  <div className="mb-10 md:mb-12 border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
    <div className="min-w-0">
      <DecodeText
        as="h2"
        text={title}
        className="font-header text-section uppercase tracking-tighter text-accent [overflow-wrap:anywhere]"
      />
      <p className="font-mono text-label text-text-dim mt-3 tracking-widest">{subtitle}</p>
    </div>
    {children}
  </div>
);

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default SectionHeader;
