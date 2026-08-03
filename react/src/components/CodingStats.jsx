import React from 'react';
import PropTypes from 'prop-types';

const statCard = (platform, stats) => {
  if (!stats) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-white/10 text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-text-dim mb-2">{platform}</div>
        <div className="text-3xl font-bold text-accent">—</div>
        <div className="text-xs text-text-dim mt-3">Unable to fetch stats</div>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-white/10 text-center transition hover:border-accent/30 hover:shadow-[0_0_30px_rgba(56,189,248,0.12)]">
      <div className="text-sm uppercase tracking-[0.3em] text-text-dim mb-2">{platform}</div>
      <div className="text-4xl font-black text-accent">{stats.solvedCount ?? '—'}</div>
      <a
        href={stats.profileUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-xs uppercase tracking-[0.35em] text-accent/80 hover:text-accent"
      >
        View profile
      </a>
    </div>
  );
};

const CodingStats = ({ codingStats }) => {
  if (!codingStats) return null;

  return (
    <section id="coding-stats" className="mb-16">
      <div className="mb-8">
        <h2 className="font-header text-4xl md:text-5xl uppercase tracking-tighter text-accent">Code_Metrics</h2>
        <p className="font-mono text-xs text-text-dim mt-2 tracking-widest">// DAILY_PROGRESS // AGGREGATED_SOLVED_COUNTS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCard('LeetCode', codingStats.leetcode)}
        {statCard('HackerRank', codingStats.hackerrank)}
        {statCard('GeeksforGeeks', codingStats.gfg)}
      </div>
    </section>
  );
};

CodingStats.propTypes = {
  codingStats: PropTypes.shape({
    leetcode: PropTypes.shape({
      profileUrl: PropTypes.string,
      solvedCount: PropTypes.number,
    }),
    hackerrank: PropTypes.shape({
      profileUrl: PropTypes.string,
      solvedCount: PropTypes.number,
    }),
    gfg: PropTypes.shape({
      profileUrl: PropTypes.string,
      solvedCount: PropTypes.number,
    }),
  }),
};

export default CodingStats;
