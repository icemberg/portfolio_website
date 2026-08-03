import React from 'react';
import PropTypes from 'prop-types';
import { GitBranch } from 'lucide-react';

const GitHubRepos = ({ repos }) => {
  if (!repos || !repos.length) {
    return (
      <section id="github-repos" className="mb-16">
        <div className="mb-8">
          <h2 className="font-header text-4xl md:text-5xl uppercase tracking-tighter text-accent">GitHub_Repos</h2>
          <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">// LATEST_PORTFOLIO_WORK</p>
        </div>
        <div className="bg-surface p-8 rounded-3xl border border-white/10 text-center text-text-dim">
          No repositories available at the moment.
        </div>
      </section>
    );
  }

  return (
    <section id="github-repos" className="mb-16">
      <div className="mb-8">
        <h2 className="font-header text-4xl md:text-5xl uppercase tracking-tighter text-accent">GitHub_Repos</h2>
        <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">// LATEST_PORTFOLIO_WORK</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {repos.map((repo, index) => (
          <article key={repo.id || index} className="bg-surface p-6 rounded-3xl border border-white/10 hover:border-accent/30 transition-all">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-header text-xl uppercase tracking-tighter mb-2 text-white">{repo.name || repo.fullName || 'Repository'}</h3>
                <p className="text-sm text-text-dim leading-relaxed">{repo.description || 'No description available.'}</p>
              </div>
              <a href={repo.htmlUrl || repo.html_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent/90">
                <GitBranch className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {repo.language && <span className="font-mono text-[10px] uppercase tracking-[0.35em] bg-white/5 border border-white/10 px-2 py-1 rounded-sm">{repo.language}</span>}
              {repo.stars != null && <span className="font-mono text-[10px] uppercase tracking-[0.35em] bg-white/5 border border-white/10 px-2 py-1 rounded-sm">Stars: {repo.stars}</span>}
              {repo.forks != null && <span className="font-mono text-[10px] uppercase tracking-[0.35em] bg-white/5 border border-white/10 px-2 py-1 rounded-sm">Forks: {repo.forks}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

GitHubRepos.propTypes = {
  repos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      fullName: PropTypes.string,
      description: PropTypes.string,
      htmlUrl: PropTypes.string,
      language: PropTypes.string,
      stars: PropTypes.number,
      forks: PropTypes.number,
    })
  ),
};

export default GitHubRepos;
