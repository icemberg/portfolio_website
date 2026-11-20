import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, X } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';

const NAV_LINKS = [
  { id: 'hero', label: '01. Identity' },
  { id: 'skills', label: '02. Skills' },
  { id: 'experience', label: '03. Logs' },
  { id: 'projects', label: '04. Missions' },
];
// sections that light up a nav item, in page order
const TRACKED_SECTIONS = [...NAV_LINKS.map((link) => link.id), 'contact'];

/** The id of the last section whose top has scrolled past the middle of the viewport. */
function useActiveSection(ids) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.5;
      let current = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // the last section may be too short to reach the line: at the bottom, it wins
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const last = ids[ids.length - 1];
      if (atBottom && document.getElementById(last)) current = last;
      setActive(current);
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
  }, [ids]);

  return active;
}

const Layout = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(TRACKED_SECTIONS);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const openChat = () => {
    setMenuOpen(false);
    setIsChatOpen(true);
  };

  const linkClass = (id) =>
    `hover:text-accent transition-colors ${active === id ? 'text-accent border-b border-accent' : 'border-b border-transparent'}`;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md" aria-label="Primary">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
          <a href="/#hero" className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="w-8 h-8 bg-accent flex items-center justify-center font-header text-background text-xl shrink-0">A</div>
            <div className="font-header tracking-tighter text-lg uppercase truncate">Impact.System</div>
          </a>

          <div className="hidden md:flex space-x-8 lg:space-x-10 font-mono text-label uppercase tracking-[0.2em] text-text-dim items-center">
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={`/#${link.id}`} className={linkClass(link.id)} aria-current={active === link.id ? 'location' : undefined}>
                {link.label}
              </a>
            ))}
            <button onClick={openChat} className="hover:text-accent transition-colors uppercase outline-none focus-visible:text-accent">05. AI Chat</button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              aria-current={active === 'contact' ? 'location' : undefined}
              className={`hidden sm:inline-block border border-accent px-4 py-1 font-mono text-label uppercase tracking-widest transition-all hover:bg-accent hover:text-black ${active === 'contact' ? 'bg-accent text-black' : 'text-accent'}`}
            >
              Contact_User
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden p-2 -mr-2 text-text-main hover:text-accent transition-colors"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-nav" className="md:hidden border-t border-white/5 px-4 pb-4 font-mono text-label uppercase tracking-[0.2em] text-text-dim">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`/#${link.id}`}
                onClick={() => setMenuOpen(false)}
                aria-current={active === link.id ? 'location' : undefined}
                className={`block py-3 border-b border-white/5 hover:text-accent transition-colors ${active === link.id ? 'text-accent' : ''}`}
              >
                {link.label}
              </a>
            ))}
            <button onClick={openChat} className="block w-full text-left py-3 border-b border-white/5 uppercase tracking-[0.2em] hover:text-accent transition-colors">
              05. AI Chat
            </button>
            <a
              href="/#contact"
              onClick={() => setMenuOpen(false)}
              aria-current={active === 'contact' ? 'location' : undefined}
              className={`block py-3 hover:text-accent transition-colors ${active === 'contact' ? 'text-accent' : 'text-accent/80'}`}
            >
              06. Contact_User
            </a>
          </div>
        )}
      </nav>

      <main className="pt-28 md:pt-32 px-4 sm:px-6 pb-20 max-w-[1600px] mx-auto">
        {children}
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col space-y-2 text-center md:text-left">
            <div className="font-header text-xl uppercase">Abhiraam S.</div>
            <div className="font-mono text-label text-text-dim uppercase tracking-widest">Architected for modularity & impact</div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            <div className="flex flex-col">
              <span className="font-mono text-label text-accent mb-2 uppercase">Systems_Network</span>
              <div className="flex space-x-6 font-technical uppercase font-bold text-xs tracking-tighter">
                <a className="hover:text-accent transition-colors" href="https://github.com/icemberg">GitHub</a>
                <a className="hover:text-accent transition-colors" href="https://linkedin.com/in/abhiraam-s-84388125b" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-label text-accent mb-2 uppercase">Time_Stamp</span>
              <span className="font-technical text-xs font-bold">LIVE_STATUS_ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>

      <ChatbotWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node,
};

export default Layout;
