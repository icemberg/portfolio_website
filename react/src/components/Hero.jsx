import React from 'react';
import PropTypes from 'prop-types';

const Github = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Hero = ({ profile }) => {
  return (
    <section id="hero" className="min-h-[90vh] flex flex-col justify-center border-l-4 border-accent pl-6 mb-20 md:mb-32 relative">
      <div className="absolute -left-[5px] top-0 w-2 h-20 bg-gradient-to-b from-accent to-transparent"></div>
      
      <div className="font-mono text-accent text-sm md:text-base mb-6 tracking-widest uppercase flex items-center gap-4">
        <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
        [ SYSTEM_BOOT_COMPLETE. USER_IDENTIFIED: {profile?.name?.replaceAll(/\s+/g, '_').toUpperCase()} ]
      </div>
      
      <h1 className="font-header text-6xl md:text-[10rem] leading-[0.8] uppercase mb-6 tracking-tighter transition-all hover:tracking-normal duration-700 cursor-default">
        {profile?.name}
      </h1>
      
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-10">
        <h2 className="font-header text-2xl md:text-5xl text-text-dim uppercase tracking-tight">
          {profile?.title}
        </h2>
        <span className="hidden md:inline h-px w-24 bg-white/20"></span>
        <div className="flex flex-col">
          <span className="font-mono text-accent/80 text-[10px] uppercase tracking-widest">SYS_LOC</span>
          <span className="font-mono text-white text-xs uppercase tracking-widest">
            {profile?.location}
          </span>
        </div>
      </div>
      
      <div className="max-w-4xl relative">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-white/10 to-transparent"></div>
        <p className="font-mono text-sm md:text-lg text-text-main leading-relaxed mb-12 pl-8 py-2 max-w-2xl">
          {profile?.summary}
        </p>

        <div className="flex flex-wrap gap-6 pl-8">
          <a href="#projects" className="bg-accent text-background px-8 py-4 font-header text-xl uppercase hover:bg-white hover:text-accent transition-all duration-500 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]">
            Execute_Missions
          </a>
          <div className="flex gap-4">
            <a href={profile?.github} target="_blank" rel="noreferrer" className="flex items-center justify-center w-14 h-14 border border-white/20 hover:border-accent hover:text-accent transition-all duration-300">
              <Github className="w-6 h-6" />
            </a>
            <a href={profile?.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center w-14 h-14 border border-white/20 hover:border-accent hover:text-accent transition-all duration-300">
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
Hero.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    title: PropTypes.string,
    location: PropTypes.string,
    summary: PropTypes.string,
    github: PropTypes.string,
    linkedin: PropTypes.string,
  }),
};

export default Hero;
