import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Award, Maximize2, X } from 'lucide-react';
import SectionHeader from './SectionHeader';

/**
 * Uniform credential cards (fixed-ratio thumbnails) that open the full certificate in
 * a modal viewer. The native <dialog> handles focus and the Esc key.
 */
const Certifications = ({ certifications }) => {
  const dialogRef = useRef(null);
  const [active, setActive] = useState(null);

  if (!certifications) return null;

  const openViewer = (cert) => {
    setActive(cert);
    dialogRef.current?.showModal();
  };
  const closeViewer = () => dialogRef.current?.close();

  return (
    <section id="certifications" className="mb-section">
      <SectionHeader title="Certifications" subtitle="// VALIDATED_CREDENTIALS" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => (
          <article key={cert.name} className="bg-surface widget-border group flex flex-col overflow-hidden hover:bg-surface-accent transition-colors duration-300">
            {cert.imageUrl && (
              <button
                type="button"
                onClick={() => openViewer(cert)}
                aria-label={`View the ${cert.name} certificate`}
                className="relative block aspect-[4/3] overflow-hidden border-b border-white/5 bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <img
                  src={cert.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top opacity-75 transition duration-500 group-hover:opacity-100 motion-safe:group-hover:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" aria-hidden="true" />
                <span className="absolute top-3 right-3 flex items-center gap-1.5 border border-accent/40 bg-background/80 px-2 py-1 font-mono text-label uppercase tracking-widest text-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" aria-hidden="true">
                  <Maximize2 className="w-3 h-3" /> View
                </span>
              </button>
            )}

            <div className="p-5 sm:p-6 flex flex-1 flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-accent/10 p-2 rounded text-accent group-hover:bg-accent group-hover:text-background transition-colors shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-header text-card-title uppercase tracking-tight group-hover:text-accent transition-colors">
                  {cert.name}
                </h3>
              </div>
              <div className="font-mono text-label text-text-dim uppercase tracking-wider">
                {cert.organization} | {cert.date}
              </div>
              {cert.imageUrl && (
                <button
                  type="button"
                  onClick={() => openViewer(cert)}
                  className="mt-auto pt-5 self-start font-mono text-label uppercase tracking-widest text-accent hover:text-white transition-colors"
                >
                  View_Credential &rarr;
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer(); // click on the backdrop
        }}
        aria-label={active ? `${active.name} certificate` : 'Certificate'}
        className="m-auto w-[min(94vw,960px)] max-h-[92dvh] bg-surface text-text-main p-0 border border-accent/30 shadow-[0_0_60px_rgba(var(--accent-rgb),0.15)] backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        {active && (
          <figure className="flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 sm:px-5 py-3">
              <figcaption className="min-w-0">
                <div className="font-header text-card-title uppercase tracking-tight">{active.name}</div>
                <div className="font-mono text-label text-text-dim uppercase tracking-wider mt-1">
                  {active.organization} | {active.date}
                </div>
              </figcaption>
              <button
                type="button"
                onClick={closeViewer}
                aria-label="Close certificate"
                className="shrink-0 p-1 text-text-dim hover:text-accent transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img
              src={active.imageUrl}
              alt={`${active.name} certificate`}
              className="w-full max-h-[76dvh] object-contain bg-background"
            />
          </figure>
        )}
      </dialog>
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
