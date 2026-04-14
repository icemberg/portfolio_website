import React, { useState } from 'react';
import PropTypes from 'prop-types';
import client from '../api/client';

const ContactSection = ({ email, location }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, SUCCESS, ERROR
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('SENDING');
    try {
      await client.post('/contact', formData);
      setStatus('SUCCESS');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('IDLE'), 5000);
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setErrorMessage(err.response?.data || 'Failed to establish relay connection.');
    }
  };

  return (
    <section id="contact" className="mb-32 relative">
      <div className="mb-12 border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="font-header text-4xl md:text-6xl uppercase tracking-tighter text-accent">Contact_User</h2>
          <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">{'// UPLINK_ESTABLISHMENT_PROTOCOL'}</p>
        </div>
        <div className="hidden md:block font-mono text-[10px] text-text-dim uppercase tracking-tighter">
          SECURE_LINE_ENCRYPTED: {new Date().getFullYear()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Contact Info */}
        <div className="space-y-12">
          <div className="relative pl-8 py-4 border-l border-accent/30">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/10"></div>
             <p className="font-mono text-text-main text-lg mb-8 leading-relaxed italic">
               "Ready to architect scalable solutions or discuss high-impact collaborations? Initiate the uplink relay or find me on system networks."
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="flex flex-col">
                 <span className="font-mono text-accent text-[10px] uppercase tracking-widest mb-1">EMAIL_ACCESS</span>
                 <span className="font-header text-xl uppercase tracking-tight">{email}</span>
               </div>
               <div className="flex flex-col">
                 <span className="font-mono text-accent text-[10px] uppercase tracking-widest mb-1">GEOGRAPHICAL_NODE</span>
                 <span className="font-header text-xl uppercase tracking-tight">{location}</span>
               </div>
             </div>
          </div>

          <div className="bg-surface widget-border p-6 relative overflow-hidden group">
            <div className="scanline group-hover:opacity-100"></div>
            <div className="flex items-center gap-4 text-accent mb-4">
              <span className="material-symbols-outlined">shield</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">Privacy_Statement</span>
            </div>
            <p className="font-mono text-[11px] text-text-dim leading-relaxed uppercase tracking-tighter">
              Your message will be relayed through an encrypted gateway directly to the system administrator. 
              Zero persistent data storage protocol enforced. Only temporary memory buffer used for relay.
            </p>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="bg-surface widget-border p-8 relative overflow-hidden shadow-[0_0_50px_rgba(var(--accent-rgb),0.05)] focus-within:shadow-[0_0_50px_rgba(var(--accent-rgb),0.1)] transition-shadow">
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="font-mono text-[10px] text-accent uppercase tracking-widest">Node_Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="EX: SYSTEM_ADMIN"
                  className="bg-background/50 border border-white/10 px-4 py-3 font-mono text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:bg-accent/5 transition-all uppercase"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="font-mono text-[10px] text-accent uppercase tracking-widest">Return_Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="USER@NETWORK.COM"
                  className="bg-background/50 border border-white/10 px-4 py-3 font-mono text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:bg-accent/5 transition-all uppercase"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="font-mono text-[10px] text-accent uppercase tracking-widest">Subject_Header</label>
              <input 
                type="text" 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="MISSION_BRIEFING"
                className="bg-background/50 border border-white/10 px-4 py-3 font-mono text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:bg-accent/5 transition-all uppercase"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="font-mono text-[10px] text-accent uppercase tracking-widest">Message_Payload</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="ENTER_PAYLOAD_DATA..."
                className="bg-background/50 border border-white/10 px-4 py-3 font-mono text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:bg-accent/5 transition-all uppercase resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={status === 'SENDING'}
              className={`w-full py-4 font-header text-xl uppercase transition-all duration-500 overflow-hidden relative group ${
                status === 'SENDING' ? 'bg-white/10 text-white/50 cursor-wait' : 'bg-accent text-background hover:bg-white hover:text-accent'
              }`}
            >
              {status === 'SENDING' ? (
                <span className="flex items-center justify-center gap-4">
                   <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                   UPLINK_IN_PROGRESS...
                </span>
              ) : status === 'SUCCESS' ? (
                'RELAY_ESTABLISHED_SUCCESS'
              ) : status === 'ERROR' ? (
                'RELAY_FAILED_RETRY'
              ) : (
                'INITIATE_RELAY'
              )}
            </button>

            {status === 'SUCCESS' && (
              <div className="font-mono text-[10px] text-emerald-400 text-center animate-pulse uppercase tracking-widest">
                Message successfully transmitted to system administrator.
              </div>
            )}
            {status === 'ERROR' && (
              <div className="font-mono text-[10px] text-red-400 text-center animate-pulse uppercase tracking-widest">
                Critical error: {errorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

ContactSection.propTypes = {
  email: PropTypes.string,
  location: PropTypes.string
};

export default ContactSection;
