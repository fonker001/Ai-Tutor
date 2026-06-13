import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Assignment } from '../types';

interface AssignmentSubmitterProps {
  assignment: Assignment;
  isUnlocked: boolean;
  onSubmit: (text: string) => Promise<void>;
}

export default function AssignmentSubmitter({ assignment, isUnlocked, onSubmit }: AssignmentSubmitterProps) {
  const [submissionText, setSubmissionText] = useState(assignment.submission || '');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Aegis supports txt and md essay files for offline parity. Please paste other formats manually.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setSubmissionText(text);
      }
    };
    reader.onerror = () => {
      setError('Could not parse text file content.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(submissionText);
    } catch (err: any) {
      setError(err?.message || 'Failed connecting to AI Tutor grading stream.');
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="bg-slate-50/50 p-6 rounded-2xl text-center border border-dashed border-slate-205 dark:bg-slate-900/20 dark:border-slate-800 text-slate-400 text-xs">
        🔐 Complete preceding lessons and quizzes of this study path to unlock this assignment and chat grades.
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60 shadow-sm" id="assignment-console">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <FileText className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-850 dark:text-slate-150 text-sm">Adaptive Written Assignment</h3>
      </div>

      <div className="bg-emerald-50/40 p-4 rounded-xl mb-4 text-xs text-slate-700 dark:bg-slate-950/40 dark:text-slate-350 border border-emerald-100/50 leading-relaxed">
        <span className="font-bold block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Homework Prompt</span>
        {assignment.prompt}
      </div>

      {assignment.grade ? (
        <div className="space-y-4 animate-fade-in" id="graded-assignment-view">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Evaluation Score</span>
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-50">{assignment.grade}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Assessed by Aegis Mentor system</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-300 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Mentoral Support Breakdown:</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed select-text">
              {assignment.feedback}
            </p>
          </div>

          <div className="border border-slate-200/50 dark:border-slate-800 p-3 rounded-xl">
            <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Your Submission</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-3 select-text bg-white/40 dark:bg-slate-900/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              {assignment.submission}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Essay text writing box */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Write or Paste essay response (Min 20 characters)</label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              disabled={loading}
              rows={5}
              placeholder="Structure your answer here. State key variables and provide structured proof..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-500 transition shadow-inner leading-relaxed"
            />
          </div>

          {/* Integrated Drag & Drop Upload Zone (Usability Guideline) */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileBrowser}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-950/20'
                : 'border-slate-200 hover:border-emerald-300 bg-slate-50/50 dark:border-slate-800 dark:hover:border-slate-705 dark:bg-slate-950/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".txt,.md"
              className="hidden"
            />
            <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <div className="text-xs text-slate-600 dark:text-slate-450">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Upload essay file</span> or drop here
            </div>
            <p className="text-[10px] text-slate-400">Supports (.txt, .md) text materials</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-xs dark:bg-rose-950/20 dark:border-rose-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || submissionText.trim().length < 20}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Mentor reviewing submission...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Submit Homework to AI Student Tutor</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
