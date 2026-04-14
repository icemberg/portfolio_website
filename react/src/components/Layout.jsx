import React, { useState } from 'react';
import ChatbotWidget from './ChatbotWidget';

const Layout = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-accent flex items-center justify-center font-header text-background text-xl">A</div>
          <div className="font-header tracking-tighter text-lg uppercase">Impact.System</div>
        </div>
        <div className="hidden md:flex space-x-10 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim items-center">
          <a className="hover:text-accent transition-colors" href="/#hero">01. Identity</a>
          <a className="hover:text-accent transition-colors" href="/#skills">02. Skills</a>
          <a className="hover:text-accent transition-colors" href="/#experience">03. Logs</a>
          <a className="hover:text-accent transition-colors text-accent border-b border-accent" href="/#projects">04. Missions</a>
          <button onClick={() => setIsChatOpen(true)} className="hover:text-accent transition-colors uppercase outline-none focus:outline-none">05. AI Chat</button>
        </div>
        <a href="#contact" className="border border-accent text-accent px-4 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-accent hover:text-black transition-all">
          Contact_User
        </a>
      </nav>
      
      <main className="pt-32 px-6 pb-20 max-w-[1600px] mx-auto">
        {children}
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex flex-col space-y-2">
            <div className="font-header text-xl uppercase">Abhiraam S.</div>
            <div className="font-mono text-[10px] text-text-dim uppercase tracking-widest">Architected for modularity & impact</div>
          </div>
          <div className="flex space-x-12">
            <div className="flex flex-col">
              <span className="font-mono text-[8px] text-accent mb-2 uppercase">Systems_Network</span>
              <div className="flex space-x-6 font-technical uppercase font-bold text-xs tracking-tighter">
                <a className="hover:text-accent transition-colors" href="https://github.com/icemberg">GitHub</a>
                <a className="hover:text-accent transition-colors" href="https://linkedin.com/in/abhiraam-s-84388125b" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] text-accent mb-2 uppercase">Time_Stamp</span>
              <span className="font-technical text-xs font-bold">LIVE_STATUS_ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>

      <ChatbotWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </>
  );
};

export default Layout;
