import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import SectionHeader from './SectionHeader';

/**
 * Career timeline drawn as a live signal: as the page scrolls, a glowing beam runs
 * down the line (--trace, 0..1) and each role's node lights up when the beam
 * reaches it. The current role carries a pulsing LIVE badge.
 */
const ExperienceTimeline = ({ experiences }) => {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    const update = () => {
      raf = 0;
      const box = track.getBoundingClientRect();
      // the beam's head follows a line 60% down the viewport
      const progress = reduceMotion
        ? 1
        : Math.min(1, Math.max(0, (window.innerHeight * 0.6 - box.top) / box.height));
      track.style.setProperty('--trace', progress.toFixed(4));

      const reach = box.top + progress * box.height;
      track.querySelectorAll('[data-node]').forEach((node) => {
        const nodeBox = node.getBoundingClientRect();
        node.dataset.lit = String(nodeBox.top + nodeBox.height / 2 <= reach + 1);
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [experiences]);

  return (
    <section id="experience" className="mb-section">
      <SectionHeader title="Career_Timeline" subtitle="// LOG_ENTRIES: ENTERPRISE_ENGAGEMENTS" />

      <div ref={trackRef} className="relative ml-2 sm:ml-4 md:ml-8 space-y-10 md:space-y-12 pb-8">
        {/* the line, the beam that fills it, and the beam's glowing head */}
        <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
        <div aria-hidden="true" className="timeline-beam absolute left-0 top-0 bottom-0 w-px" />
        <div aria-hidden="true" className="timeline-head absolute -left-[3px] -mt-[3.5px] w-[7px] h-[7px] rounded-full bg-accent" />

        {experiences?.map((exp, index) => {
          const isCurrent = /present/i.test(exp.duration || '');
          return (
            <div key={index} className="relative pl-6 sm:pl-8 md:pl-12 group">
              {/* Timeline node: lights up when the beam reaches it */}
              <div
                data-node
                className="absolute w-3 h-3 bg-background border-2 border-accent rounded-full -left-[5.5px] top-2 transition-all duration-500 group-hover:bg-accent data-[lit=true]:bg-accent data-[lit=true]:shadow-[0_0_12px_rgba(var(--accent-rgb),0.9)]"
              />

              <div className={`bg-surface p-5 sm:p-6 widget-border relative z-10 transition-transform duration-300 group-hover:-translate-y-1 ${isCurrent ? 'shadow-[0_0_40px_rgba(var(--accent-rgb),0.08)]' : ''}`}>
                <div className="scanline"></div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-5 border-b border-white/5 pb-4">
                  <div className="min-w-0">
                    <h3 className="font-header text-card-title uppercase tracking-tighter mb-1 text-white group-hover:text-accent transition-colors">{exp.title}</h3>
                    <div className="font-mono text-chip text-text-dim flex items-center gap-2">
                      <span className="text-accent">@</span> {exp.company}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start shrink-0">
                    {isCurrent && (
                      <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-widest text-accent">
                        <span className="relative flex h-2 w-2" aria-hidden="true">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
                        </span>
                        Live
                      </span>
                    )}
                    <div className="font-mono text-label border border-white/10 px-3 py-1 text-text-dim bg-background/50">
                      {exp.duration}
                    </div>
                  </div>
                </div>

                <p className="text-body-sm text-text-dim mb-4 font-technical">{exp.description}</p>

                <ul className="space-y-2">
                  {exp.bulletPoints?.map((bp, i) => (
                    <li key={i} className="font-mono text-chip text-text-main/85 flex items-start">
                      <span className="text-accent mr-2 cursor-default" aria-hidden="true">{'>'}</span>
                      <span className="leading-relaxed">{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

ExperienceTimeline.propTypes = {
  experiences: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      company: PropTypes.string,
      duration: PropTypes.string,
      description: PropTypes.string,
      bulletPoints: PropTypes.arrayOf(PropTypes.string),
    })
  ),
};

export default ExperienceTimeline;
