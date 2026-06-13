import React from 'react';
import { Award, Zap, BookOpen, Clock, AlertCircle, Smile, Sparkles } from 'lucide-react';
import { UserStats } from '../types';

interface StatsDashboardProps {
  stats: UserStats;
  userName: string;
}

export default function StatsDashboard({ stats, userName }: StatsDashboardProps) {
  // Safe default calculations
  const totalMinutes = Object.values(stats.studyMinutesByDay).reduce((a, b) => a + b, 0);
  const xpBadge = stats.totalXP > 1000 ? 'Graduate Scholar' : stats.totalXP > 500 ? 'Avid Explorer' : 'Aspirant Junior';

  // SVG Line Chart plotting config
  const dailySlugs = Object.keys(stats.studyMinutesByDay).sort().slice(-7); // Last 7 days
  const chartWidth = 500;
  const chartHeight = 150;
  const paddingX = 40;
  const paddingY = 20;

  // Render mock 5-day grid if empty
  const dataPoints = dailySlugs.length > 0 
    ? dailySlugs.map(slug => ({ label: slug.substring(5), val: stats.studyMinutesByDay[slug] }))
    : [
        { label: 'Mon', val: 20 },
        { label: 'Tue', val: 35 },
        { label: 'Wed', val: 15 },
        { label: 'Thu', val: 40 },
        { label: 'Fri', val: 25 }
      ];

  const maxVal = Math.max(...dataPoints.map(d => d.val), 60); // min range ceiling 60 mins

  // Map coordinates dynamically
  const svgPoints = dataPoints.map((d, i) => {
    const x = paddingX + (i / (dataPoints.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.val / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, val: d.val, label: d.label };
  });

  const linePath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = svgPoints.length > 0
    ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - paddingY} L ${svgPoints[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-4" id="stats-dashboard">
      {/* Cards grids */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200 text-orange-600 shrink-0">
            <Zap className="w-5 h-5 fill-orange-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Study Streak</span>
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{stats.learningStreak} Days</span>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600 shrink-0">
            <Award className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">XP Earned {xpBadge && `(${xpBadge.split(' ')[0]})`}</span>
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{stats.totalXP} Pts</span>
          </div>
        </div>

        {/* Quizzes Count */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quizzes Solved</span>
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{stats.totalQuizzesTaken} Exams</span>
          </div>
        </div>

        {/* Study efficiency minutes */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-200 text-emerald-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Session Time</span>
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{totalMinutes} Mins</span>
          </div>
        </div>
      </div>

      {/* SVG Analytics Line Graph */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">Study Session Analytics</h4>
            <p className="text-[10px] text-slate-400">Chronological daily monitoring of learning activity</p>
          </div>
          <div className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-400">
            Average Score: {stats.averageQuizScore}%
          </div>
        </div>

        {/* Live SVG canvas */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[325px] h-auto drop-shadow-sm">
            {/* Draw Horizontal grids */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="0.8" className="dark:stroke-slate-800" />
            <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="0.8" className="dark:stroke-slate-800" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />

            {/* Area Shader */}
            {areaPath && (
              <path d={areaPath} fill="url(#emerald-gradient)" opacity="0.15" />
            )}

            {/* Trend line */}
            <path
              d={linePath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dot beacons */}
            {svgPoints.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="hover:r-6 cursor-pointer transition animate-pulse"
                />
                {/* Floating metric indicator */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="text-[9px] font-extrabold fill-slate-700 dark:fill-slate-300"
                >
                  {p.val}m
                </text>
                {/* X labels */}
                <text
                  x={p.x}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  className="text-[8px] font-semibold fill-slate-400"
                >
                  {p.label}
                </text>
              </g>
            ))}

            {/* Gradients configurations */}
            <defs>
              <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Recommended study insights */}
      <div className="bg-gradient-to-r from-emerald-50/50 to-emerald-100/35 border border-emerald-100 p-4 rounded-xl dark:from-slate-950/40 dark:to-emerald-950/20 dark:border-slate-850 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-spin" />
        <div className="text-xs">
          <h5 className="font-bold text-slate-800 dark:text-slate-200">Aegis AI Study Recommendations</h5>
          <p className="text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
            Congratulations, **{userName}**! You are maintaining a solid study rhythm. 
            Based on your quiz history ({stats.averageQuizScore}% average score) and preferences:
            {stats.averageQuizScore < 80 ? (
              <span> We advise reviewing **Lesson Unit 1** interactive quizzes to boost baseline scoring efficiency above the 82% GCSE target!</span>
            ) : (
              <span> Your scoring meets elite GCSE standards! Practice downloading **Lesson Unit 2** offline so you are fully armed for the exams during commutes.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
