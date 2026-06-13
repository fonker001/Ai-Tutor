import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronRight, HelpCircle, Award, Sparkles, RefreshCw } from 'lucide-react';
import { QuizQuestion, PathNode } from '../types';

interface QuizConsoleProps {
  node: PathNode;
  onSubmitQuizScore: (score: number) => void;
}

export default function QuizConsole({ node, onSubmitQuizScore }: QuizConsoleProps) {
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [selectedOptIndex, setSelectedOptIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [numberCorrect, setNumberCorrect] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const questions = node.quiz || [];
  const currentQuestion: QuizQuestion | undefined = questions[currentQuestIndex];

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;
    setSelectedOptIndex(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOptIndex === null || hasAnswered || !currentQuestion) return;
    setHasAnswered(true);

    if (selectedOptIndex === currentQuestion.correctAnswerIndex) {
      setNumberCorrect(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestIndex + 1 < questions.length) {
      setCurrentQuestIndex(prev => prev + 1);
      setSelectedOptIndex(null);
      setHasAnswered(false);
    } else {
      const finalScore = Math.round((numberCorrect / questions.length) * 100);
      setQuizFinished(true);
      onSubmitQuizScore(finalScore);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestIndex(0);
    setSelectedOptIndex(null);
    setHasAnswered(false);
    setNumberCorrect(0);
    setQuizFinished(false);
  };

  if (node.quizScore !== undefined && !quizFinished) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-250 rounded-2xl p-6 text-center dark:bg-emerald-950/20 dark:border-emerald-900/40">
        <Award className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base mb-1">Lesson Quiz Completed!</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          You previously completed this quiz with a secure perfect score of <span className="font-semibold text-lg">{node.quizScore}%</span>.
        </p>
        <button
          onClick={restartQuiz}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retake Quiz Practice</span>
        </button>
      </div>
    );
  }

  if (quizFinished) {
    const calculatedPercentage = Math.round((numberCorrect / questions.length) * 100);
    return (
      <div className="bg-slate-50/70 border border-slate-250 dark:bg-slate-900/60 dark:border-slate-800 rounded-2xl p-6 text-center shadow-inner" id="quiz-finished-layout">
        <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-spin text-center" />
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Practice Quiz Solved!</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          You scored <span className="font-extrabold text-emerald-650 dark:text-emerald-400 text-lg">{numberCorrect}/{questions.length}</span> correct answers ({calculatedPercentage}%).
        </p>
        <div className="bg-white/60 dark:bg-slate-950/45 p-3 rounded-xl max-w-sm mx-auto mb-4 border border-slate-150/50 text-xs text-slate-500 dark:text-slate-400">
          🔑 Completing lessons and quizzes builds your **Personalized analytics scorecard** live in your Aegis Mentor Dashboard.
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={restartQuiz}
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-250 hover:bg-slate-150 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-medium cursor-pointer transition"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No quiz questions loaded for this node. Use the Custom Pathfinder to request quizzes.
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 dark:bg-slate-900/70 dark:border-slate-800 shadow-sm" id="quiz-console animate-fade">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs py-1 px-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
          <HelpCircle className="w-4 h-4 text-emerald-500" />
          <span>Interactive Assessment</span>
        </div>
        <span className="text-slate-400 text-xs font-medium">Question {currentQuestIndex + 1} of {questions.length}</span>
      </div>

      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 leading-relaxed tracking-tight">
        {currentQuestion.questionText}
      </p>

      {/* Answer options */}
      <div className="space-y-2 mb-4">
        {currentQuestion.options.map((opt, i) => {
          const isSelected = selectedOptIndex === i;
          let optionClass = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900';
          
          if (hasAnswered) {
            if (i === currentQuestion.correctAnswerIndex) {
              optionClass = 'border-green-300 bg-green-500/10 text-green-700 dark:border-green-900/60 dark:text-green-400';
            } else if (isSelected) {
              optionClass = 'border-rose-300 bg-rose-500/10 text-rose-700 dark:border-rose-900/60 dark:text-rose-450';
            } else {
              optionClass = 'opacity-60 border-slate-100 bg-slate-50 dark:bg-slate-950 dark:border-slate-850';
            }
          } else if (isSelected) {
            optionClass = 'border-emerald-550 bg-emerald-500/5 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelectOption(i)}
              disabled={hasAnswered}
              type="button"
              className={`w-full text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center justify-between gap-2 ${optionClass}`}
            >
              <span>{opt}</span>
              {hasAnswered && i === currentQuestion.correctAnswerIndex && (
                <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0" />
              )}
              {hasAnswered && isSelected && i !== currentQuestion.correctAnswerIndex && (
                <XCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {hasAnswered ? (
        <div className="space-y-4 animate-fade-in">
          {/* AI Advisor Response panel */}
          <div className="bg-emerald-70 px-4 py-3 rounded-xl border border-emerald-100/60 text-xs leading-relaxed dark:bg-slate-950/70 dark:border-slate-850 text-slate-650 dark:text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI Tutor Explanation:</span>
            </div>
            {currentQuestion.explanation}
          </div>

          <button
            onClick={handleNext}
            type="button"
            className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shadow-sm"
          >
            <span>{currentQuestIndex + 1 === questions.length ? 'Finish Assessment' : 'Proceed Next Question'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleCheckAnswer}
          disabled={selectedOptIndex === null}
          type="button"
          className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white"
        >
          Check Answer
        </button>
      )}
    </div>
  );
}
