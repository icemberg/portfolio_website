import React, { useEffect, useState } from 'react';
import client from '../api/client.js';
import Hero from '../components/Hero';
import SkillsMatrix from '../components/SkillsMatrix';
import ExperienceTimeline from '../components/ExperienceTimeline';
import ProjectGrid from '../components/ProjectGrid';
import Education from '../components/Education';
import Certifications from '../components/Certifications';
import ContactSection from '../components/ContactSection';

// public/intro/boot-requests.js starts these requests at second 0 (before React loads);
// reuse its shared promises instead of fetching again.
const boot = window.__portfolioBoot;
const load = (key, path) => (boot ? boot.requests[key] : client.get(path).then((r) => r.data));

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [codingStats, setCodingStats] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The hero only needs the profile; coding stats and repos fill in independently.
    load('profile', '/profile')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
    load('stats', '/coding-stats').then(setCodingStats).catch(console.error);
    load('github', '/github/repos').then(setGithubRepos).catch(console.error);
  }, []);

  // Tell the intro the hero is rendered so the particles land on the real heading.
  useEffect(() => {
    if (profile) requestAnimationFrame(() => window.__intro?.setReady());
  }, [profile]);

  if (loading) {
    return <div className="text-accent font-mono animate-pulse uppercase">Booting sequence...</div>;
  }

  if (!profile) {
    return <div className="text-red-500 font-mono">Error: Could not retrieve system profile.</div>;
  }

  return (
    <div className="flex flex-col">
      <Hero profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-32">
        <div className="lg:col-span-8">
          <Education education={profile.educations} />
        </div>
        <div className="lg:col-span-4">
          <div className="bg-surface p-8 widget-border flex flex-col justify-center items-center text-center group cursor-default h-full relative overflow-hidden">
            <div className="scanline group-hover:opacity-50"></div>
            <div className="material-symbols-outlined text-accent text-6xl mb-6 group-hover:scale-110 transition-transform">terminal</div>
            <a
              href={profile.leetcode}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent transition-colors"
            >
              <div className="font-header text-6xl mb-2">
                {(() => {
                  const totalSolved = [
                    codingStats?.leetcode?.solvedCount,
                    codingStats?.hackerrank?.solvedCount,
                    codingStats?.gfg?.solvedCount,
                  ].reduce((sum, count) => sum + (count ?? 0), 0);
                  return totalSolved || '250+';
                })()}
              </div>
            </a>
            <div className="font-mono text-xs text-text-dim uppercase tracking-widest px-4">DSA_VECTORS_SOLVED</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 text-[9px] uppercase tracking-[0.35em] text-text-dim">
              <a href={profile.leetcode} target="_blank" rel="noreferrer" className="block border border-white/10 px-2 py-2 rounded-xl hover:border-accent hover:text-accent transition-all text-center">
                LEETCODE
                <div className="text-[10px] mt-1 text-accent">{codingStats?.leetcode?.solvedCount ?? '--'}</div>
              </a>
              <a href={profile.hackerrank} target="_blank" rel="noreferrer" className="block border border-white/10 px-2 py-2 rounded-xl hover:border-accent hover:text-accent transition-all text-center">
                HACKERRANK
                <div className="text-[10px] mt-1 text-accent">{codingStats?.hackerrank?.solvedCount ?? '--'}</div>
              </a>
              <a href={profile.gfg} target="_blank" rel="noreferrer" className="block border border-white/10 px-2 py-2 rounded-xl hover:border-accent hover:text-accent transition-all text-center">
                GFG
                <div className="text-[10px] mt-1 text-accent">{codingStats?.gfg?.solvedCount ?? '--'}</div>
              </a>
            </div>

            <div className="flex gap-4 mt-6">
              {profile.gfg && (
                <a href={profile.gfg} target="_blank" rel="noreferrer" className="font-mono text-[9px] text-accent border border-accent/20 px-2 py-1 hover:bg-accent/10 transition-all uppercase">
                  GFG_PROFILE
                </a>
              )}
              {profile.hackerrank && (
                <a href={profile.hackerrank} target="_blank" rel="noreferrer" className="font-mono text-[9px] text-accent border border-accent/20 px-2 py-1 hover:bg-accent/10 transition-all uppercase">
                  HACKERRANK
                </a>
              )}
              {profile.leetcode && (
                <a href={profile.leetcode} target="_blank" rel="noreferrer"
                  className='font-mono text-[9px] text-accent border border-accent/20 px-2 py-1 hover:bg-accent/10 transition-all uppercase'>
                  LEETCODE
                </a>
              )}
            </div>

            <div className="mt-8 border-t border-white/10 pt-4 w-full">
              <div className="font-mono text-[10px] text-accent/70 uppercase">STAR_PERFORMER_AWARD</div>
              <div className="font-mono text-[9px] text-text-dim mt-1 uppercase tracking-tighter">HulkHire_Tech // DELIVERY_EXCELLENCE</div>
            </div>
          </div>
        </div>
      </div>

      <SkillsMatrix skills={profile.skills} />
      <ExperienceTimeline experiences={profile.experiences} />
      <ProjectGrid projects={(() => {
        const all = [...(profile.projects || []), ...(githubRepos || [])];
        const seen = new Map();
        all.forEach(p => {
          const key = (p.githubUrl || p.title || '').toLowerCase().trim();
          if (!seen.has(key)) seen.set(key, p);
        });
        return [...seen.values()];
      })()} />
      <Certifications certifications={profile.certifications} />
      <ContactSection email={profile.email} location={profile.location} />
    </div>
  );
};

export default Dashboard;
