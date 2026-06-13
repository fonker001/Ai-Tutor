import React from 'react';
import { Check, Lock, BookOpen, Star, Sparkles } from 'lucide-react';
import { PathNode } from '../types';

interface PathVisualizerProps {
  nodes: PathNode[];
  activeNodeId: string;
  onSelectNode: (node: PathNode) => void;
}

export default function PathVisualizer({ nodes, activeNodeId, onSelectNode }: PathVisualizerProps) {
  return (
    <div className="relative py-4 pr-1" id="path-visualizer">
      <div className="flex flex-col gap-6 relative">
        {/* Draw joining lane down the center */}
        <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0" />

        {nodes.map((node, index) => {
          const isSelected = node.id === activeNodeId;
          const isCompleted = node.isCompleted;
          const isUnlocked = node.isUnlocked;

            return (
              <div
                key={node.id}
                className={`flex items-start gap-4 p-4 rounded-2xl transition z-10 select-none ${
                  isSelected
                    ? 'bg-emerald-50 border border-emerald-250 dark:bg-emerald-950/30 dark:border-emerald-900/60'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/35 border border-transparent'
                }`}
              >
                {/* Node Indicator Indicator */}
                <button
                  onClick={() => isUnlocked && onSelectNode(node)}
                  disabled={!isUnlocked}
                  type="button"
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition cursor-pointer ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-100 dark:shadow-none'
                      : isUnlocked
                      ? isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white animate-pulse'
                        : 'bg-white border-slate-205 text-emerald-600 dark:bg-slate-900 dark:border-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-850'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 font-bold" />
                  ) : !isUnlocked ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold text-sm">{index + 1}</span>
                  )}
                </button>
  
                {/* Node Metadata content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {node.section || `Unit ${index + 1}`}
                    </span>
                    {node.quizScore !== undefined && (
                      <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-emerald-500/30 text-emerald-650" />
                        Score: {node.quizScore}%
                      </span>
                    )}
                    {node.assignment.grade && (
                      <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        Grade: {node.assignment.grade.split(' ')[0]}
                      </span>
                    )}
                  </div>
  
                  <h4
                    onClick={() => isUnlocked && onSelectNode(node)}
                    className={`font-semibold cursor-pointer truncate text-sm select-text ${
                      isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-350 hover:text-emerald-650'
                    } ${!isUnlocked && 'opacity-60 cursor-not-allowed'}`}
                  >
                    {node.title}
                  </h4>
  
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 select-text mt-0.5">
                    {node.description}
                  </p>
  
                  {isUnlocked && !isCompleted && (
                    <button
                      onClick={() => onSelectNode(node)}
                      type="button"
                      className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 hover:underline cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study material</span>
                    </button>
                  )}
                </div>
              </div>
          );
        })}
      </div>
    </div>
  );
}
