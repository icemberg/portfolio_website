import React from 'react';

const ExperienceTimeline = ({ experiences }) => {
  return (
    <section id="experience" className="mb-32">
      <div className="mb-12 border-b border-white/5 pb-4">
        <h2 className="font-header text-4xl md:text-6xl uppercase tracking-tighter text-accent">Career_Timeline</h2>
        <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">// LOG_ENTRIES: ENTERPRISE_ENGAGEMENTS</p>
      </div>
      
      <div className="relative border-l border-white/10 ml-4 md:ml-8 space-y-12 pb-8">
        {experiences?.map((exp, index) => (
          <div key={index} className="relative pl-8 md:pl-12 group transition-all duration-300">
            {/* Timeline Dot */}
            <div className="absolute w-3 h-3 bg-background border-2 border-accent rounded-full -left-[6.5px] top-2 group-hover:bg-accent group-hover:shadow-[0_0_10px_#FF00FF] transition-all"></div>
            
            {/* Content Widget */}
            <div className="bg-surface p-6 widget-border relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="scanline"></div>
              
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-header text-2xl uppercase tracking-tighter mb-1 text-white group-hover:text-accent transition-colors">{exp.title}</h3>
                  <div className="font-mono text-sm text-text-dim flex items-center gap-2">
                    <span className="text-accent">@</span> {exp.company}
                  </div>
                </div>
                <div className="mt-2 md:mt-0 font-mono text-xs border border-white/10 px-3 py-1 text-text-dim self-start bg-background/50">
                  {exp.duration}
                </div>
              </div>
              
              <p className="text-sm text-text-dim mb-4 leading-relaxed font-technical">{exp.description}</p>
              
              <ul className="space-y-2">
                {exp.bulletPoints?.map((bp, i) => (
                  <li key={i} className="font-mono text-xs text-text-main/80 flex items-start">
                    <span className="text-accent mr-2 leading-none cursor-default">{'>'}</span>
                    <span className="leading-relaxed">{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExperienceTimeline;
