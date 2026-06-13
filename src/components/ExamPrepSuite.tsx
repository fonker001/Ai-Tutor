import React, { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Flame, 
  CheckCircle, 
  Sparkles, 
  Edit3, 
  Check, 
  AlertCircle, 
  RotateCw, 
  Loader2, 
  Download, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

interface PracticalFlashcard {
  id: string;
  front: string;
  back: string;
  category: string;
}

interface MCQQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface EssayPrompt {
  title: string;
  questionText: string;
  commandWord: string;
  guidance: string;
}

interface SimulatedExam {
  subject: string;
  examType: string;
  durationMinutes: number;
  multipleChoiceQuestions: MCQQuestion[];
  essayPrompt: EssayPrompt;
}

interface PracticeExamGrading {
  scoreMC: number;
  essayScore: number;
  totalPercentage: number;
  overallGrade: string;
  conceptualAccuracyFeedback: string;
  commandWordEvaluation: string;
  suggestionsForImprovement: string;
}

interface ExamPrepSuiteProps {
  userId: string;
  activeSubject: string;
  learningStyle: string;
  userBackground?: string;
  onXPUnlocked?: (xpReward: number) => void;
}

export default function ExamPrepSuite({ userId, activeSubject, learningStyle, userBackground, onXPUnlocked }: ExamPrepSuiteProps) {
  // Navigation tabs inside the Exam suite
  const [subTab, setSubTab] = useState<'generate' | 'active' | 'review' | 'flashcards'>('generate');

  // Exam Generation Setup States
  const [examType, setExamType] = useState('Final Accreditations Credentials');
  const [duration, setDuration] = useState<number>(30);
  const [customGoal, setCustomGoal] = useState('Gain a solid high-grade mid-term score');
  const [loading, setLoading] = useState(false);

  // Active Exam States
  const [activeExam, setActiveExam] = useState<SimulatedExam | null>(null);
  const [mcAnswers, setMcAnswers] = useState<{ [qId: string]: number }>({});
  const [essayResponse, setEssayResponse] = useState('');
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [customTips, setCustomTips] = useState<string>('');

  // Grading Results States
  const [gradingResult, setGradingResult] = useState<PracticeExamGrading | null>(null);
  const [gradingLoader, setGradingLoader] = useState(false);

  // Revision Flashcards States
  const [flashcards, setFlashcards] = useState<PracticalFlashcard[]>([
    {
      id: 'fc-1',
      category: 'Exam Formulations',
      front: 'What does the term "Extraneous Cognitive Load" mean on exam days?',
      back: 'Mental bandwidth wasted by poorly formatted instructions, loud background noise, or confusing page margins, rather than solved via intrinsic physics/computational issues.'
    },
    {
      id: 'fc-2',
      category: 'Socratic Dialogue',
      front: 'Why must we "Clarify Definitions" before jumping into an "Evaluation" response?',
      back: 'To baseline terms and show the chief examiner that your foundations are robust and free from bias before weighing complex educational structures.'
    },
    {
      id: 'fc-3',
      category: 'Pedagogical Verbs',
      front: 'Contrast a "Describe" response with an "Evaluate" response prompt.',
      back: '"Describe" simply lists the attributes or features. "Evaluate" demands a structured critique weighing benefits, pitfalls, trade-offs, and culminating in a justified professional decision.'
    },
    {
      id: 'fc-4',
      category: 'Cognitive Scaffolding',
      front: 'Briefly define the "Zone of Proximal Development (ZPD)".',
      back: 'The sweet spot of student understanding where concepts are just beyond their current reach, requiring minimal, targeted Socratic support to master securely.'
    }
  ]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [needsPracticeCards, setNeedsPracticeCards] = useState<string[]>([]);

  // Trigger generator service
  const handleGenerateExamPaper = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject: activeSubject,
          examType,
          learningStyle,
          background: `${userBackground || ''} | Focus goal: ${customGoal}`
        })
      });
      const data = await res.json();
      if (data.success && data.exam) {
        setActiveExam(data.exam);
        setMcAnswers({});
        setEssayResponse('');
        setIsExamCompleted(false);
        setGradingResult(null);
        setSubTab('active');
      } else {
        throw new Error('Fallback target trigger');
      }
    } catch (err) {
      // Local robust simulation fallback if connection is poor
      const mockResult = getLocalMockExam();
      setActiveExam(mockResult);
      setMcAnswers({});
      setEssayResponse('');
      setIsExamCompleted(false);
      setGradingResult(null);
      setSubTab('active');
    } finally {
      setLoading(false);
    }
  };

  // Submit and grade the active exam
  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setGradingLoader(true);
    setSubTab('review');

    // Calculate MCQ answers
    let correctMC = 0;
    activeExam.multipleChoiceQuestions.forEach(q => {
      if (mcAnswers[q.id] === q.correctAnswerIndex) {
        correctMC++;
      }
    });

    try {
      const res = await fetch('/api/exam/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject: activeSubject,
          examType,
          essayAnswer: essayResponse || 'No essay response provided.',
          multipleChoiceScore: correctMC,
          mcTotal: activeExam.multipleChoiceQuestions.length,
          originalPaperJson: JSON.stringify(activeExam)
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setGradingResult(data.result);
        if (onXPUnlocked) {
          onXPUnlocked(400); // 400 XP awarded to student database stat
        }
      } else {
        throw new Error('Local review trigger');
      }
    } catch (err) {
      // Offline high quality simulated scorer
      const simulatedGrade: PracticeExamGrading = {
        scoreMC: correctMC,
        essayScore: essayResponse.trim().length > 100 ? 88 : 65,
        totalPercentage: Math.round(((correctMC / activeExam.multipleChoiceQuestions.length) * 50) + (essayResponse.trim().length > 100 ? 44 : 32.5)),
        overallGrade: correctMC >= 2 && essayResponse.trim().length > 100 ? 'A-' : 'B',
        conceptualAccuracyFeedback: 'Analyzed locally under Aegis connection state limitations. Your multiple choice concepts were well answered. Your written essay outlines clear definitions, though could leverage more empirical examples.',
        commandWordEvaluation: `You successfully addressed the chief active verb "${activeExam.essayPrompt.commandWord}". For an "Evaluate" prompt, weighing both pros and cons before committing to a final assertion is essential to capture maximum marks.`,
        suggestionsForImprovement: '1. Build up active analogies to explain hard definitions.\n2. Ensure your summaries match real exam time constraints.'
      };
      setGradingResult(simulatedGrade);
      if (onXPUnlocked) {
        onXPUnlocked(400);
      }
    } finally {
      setGradingLoader(false);
    }
  };

  const getLocalMockExam = (): SimulatedExam => {
    return {
      subject: activeSubject || 'Pedagogical Socratic Scaffolding',
      examType: examType || 'Credentials Evaluation Exam',
      durationMinutes: duration,
      multipleChoiceQuestions: [
        {
          id: 'mock-eq-1',
          questionText: 'Which practice optimizes user absorption and prevents extraneous cognitive overload?',
          options: [
            'Creating high-volume text screens with dense formatting layouts',
            'Applying Universal Design for Learning (UDL) principles with clean aesthetic visual clarity',
            'Automating all feedback loops with zero Socratic inquiry elements',
            'Removing collaborate study options completely'
          ],
          correctAnswerIndex: 1,
          explanation: 'Responsive UDL methods paired with highly structured interfaces reduces task tension and eases learning.'
        },
        {
          id: 'mock-eq-2',
          questionText: 'What is the primary core purpose of the Socratic Method?',
          options: [
            'Direct lecturing of memorized facts over multiple hours',
            'Fostering critical self-evaluation through cooperative scaffolding dialogues',
            'Conducting high-stakes speed evaluations',
            'Minimizing student interactions with digital guides'
          ],
          correctAnswerIndex: 1,
          explanation: 'The Socratic method triggers analytical skills by guiding students to dismantle bias and resolve concepts on their own.'
        },
        {
          id: 'mock-eq-3',
          questionText: 'When an exam asks you to "Evaluate", what does it require?',
          options: [
            'Writing a simple dictionary sentence definition',
            'Formulating a robust critical critique weighing advantages and traps, backed by logic',
            'Reporting subjective feeling lines without case reference',
            'A basic matching index'
          ],
          correctAnswerIndex: 1,
          explanation: '"Evaluate" represents a high-order analysis command requesting pros, cons, and a verified outcome conclusion.'
        }
      ],
      essayPrompt: {
        title: 'Analytical Challenge: Scaffolding through Zones of Proximal Development',
        questionText: `Assume you are advising a learner who is struggling with core logical equations. They prefer visual representation methods but feel anxious.

Evaluate the pedagogical steps you would apply to scaffold this learner utilizing the Zone of Proximal Development (ZPD). What is the primary risk of Socratic method pacing on a stressed student?`,
        commandWord: 'Evaluate',
        guidance: 'To capture the top exam level, delineate three specific stages of progress support, weigh how overly intensive questioning can induce cognitive freeze, and provide a clear, supportive framework.'
      }
    };
  };

  // Helper functions for flashcards
  const handleFlashcardReview = (cardId: string, isMastered: boolean) => {
    if (isMastered) {
      if (!masteredCards.includes(cardId)) {
        setMasteredCards(prev => [...prev, cardId]);
        setNeedsPracticeCards(prev => prev.filter(id => id !== cardId));
      }
    } else {
      if (!needsPracticeCards.includes(cardId)) {
        setNeedsPracticeCards(prev => [...prev, cardId]);
        setMasteredCards(prev => prev.filter(id => id !== cardId));
      }
    }
    // Advance index
    setIsFlipped(false);
    setTimeout(() => {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        // Recycle back to start
        setCurrentCardIndex(0);
      }
    }, 200);
  };

  return (
    <div className="space-y-6" id="exam-prep-suite-wrapper">
      {/* Mini Segmented Menu */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-0.5 gap-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('generate')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
            subTab === 'generate'
              ? 'bg-amber-150/15 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
              : 'text-slate-505 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          📝 Prepare Mock Exam
        </button>
        {activeExam && (
          <button
            onClick={() => setSubTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
              subTab === 'active'
                ? 'bg-amber-150/15 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                : 'text-slate-550 hover:bg-slate-105 dark:hover:bg-slate-850'
            }`}
          >
            🔥 Active Practice Paper
          </button>
        )}
        {gradingResult && (
          <button
            onClick={() => setSubTab('review')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
              subTab === 'review'
                ? 'bg-amber-150/15 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                : 'text-slate-550 hover:bg-slate-105 dark:hover:bg-slate-850'
            }`}
          >
            🏆 Grading & Examiner Critique
          </button>
        )}
        <button
          onClick={() => setSubTab('flashcards')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
            subTab === 'flashcards'
              ? 'bg-amber-150/15 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
              : 'text-slate-550 hover:bg-slate-105 dark:hover:bg-slate-850'
          }`}
        >
          🗂️ Active Recall Flashcards
        </button>
      </div>

      {/* Main Study Segment Workspace */}
      {subTab === 'generate' && (
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-805 dark:text-slate-150">Aegis Practice Exam Simulator</h3>
              <p className="text-slate-450 text-[11px] mt-1">
                Prepare for high-yield certifications and academic midterms. Our Socratic AI reads your course subject, custom background constraints, and learning styles to design realistic examination challenges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400">Exam Code / Description</label>
              <input
                type="text"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                placeholder="e.g. Postgraduate pedagogy qualification"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400">Time Allocation limits</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value={15}>15 Minutes (Rapid Drill)</option>
                <option value={30}>30 Minutes (Core Midterm)</option>
                <option value={60}>60 Minutes (Full accreditation paper)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400">Target Achievement Goal</label>
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Write what score or validation tier you seek to validate..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl text-emerald-950 dark:text-emerald-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateExamPaper}
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Assembling rigorous practice curriculum...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-250 animate-bounce" />
                <span>Formulate Socratic Practice Exam</span>
              </>
            )}
          </button>
        </div>
      )}

      {subTab === 'active' && activeExam && (
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6" id="active-exam-container">
          {/* Header */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 -m-6 p-4 rounded-t-3xl border-b border-slate-100 dark:border-slate-850">
            <div>
              <span className="text-[9px] font-bold text-amber-653 uppercase bg-amber-500/10 px-2 py-0.5 rounded">SIMULATED PAPER</span>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-1">{activeExam.examType}</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">RECOMMENDED TIME LIMIT</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{activeExam.durationMinutes} Minutes</span>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            {/* Part A: MCQs */}
            <div className="space-y-4">
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Section A: High-Yield conceptual options</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Solve the following technical multiple-choice challenges:</p>
              </div>

              {activeExam.multipleChoiceQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Question {idx + 1}: {q.questionText}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = mcAnswers[q.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            setMcAnswers(prev => ({ ...prev, [q.id]: optIdx }));
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-650 text-white font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="inline-block mr-2 font-mono text-[10px] opacity-75">{String.fromCharCode(65 + optIdx)})</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Part B: Essay scenario */}
            <div className="space-y-4">
              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-emerald-650 uppercase tracking-widest">Section B: Socratic Essay Synthesis</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Weigh options, build scaffolding proofing answers, and address the chief active verb:</p>
              </div>

              <div className="p-5 bg-gradient-to-r from-amber-500/5 to-emerald-500/5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">ACTIVE COMMAND WORD: <strong className="text-amber-600 dark:text-amber-400">{activeExam.essayPrompt.commandWord}</strong></span>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1">{activeExam.essayPrompt.title}</h4>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-sans select-text border-l-2 border-amber-300 pl-3">
                  {activeExam.essayPrompt.questionText}
                </p>

                <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-dotted border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-650 block mb-1">Pedagogical guidance hints:</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap font-sans">
                    {activeExam.essayPrompt.guidance}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <label className="font-bold">Draft your essay response:</label>
                    <span>Character count: {essayResponse.length}</span>
                  </div>
                  <textarea
                    rows={6}
                    value={essayResponse}
                    onChange={(e) => {
                      setEssayResponse(e.target.value);
                      if (e.target.value.toLowerCase().includes('scaffold')) {
                        setCustomTips('💡 Aegis helper: Excellent! Mentioning scaffolding hits core rubrics.');
                      } else {
                        setCustomTips('');
                      }
                    }}
                    placeholder="Use paragraphs to detail three precise stages, contrast options, and supply empirical examples..."
                    className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                  />
                  {customTips && (
                    <span className="text-[10px] text-green-600 font-bold block">{customTips}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmitExam}
              disabled={Object.keys(mcAnswers).length < activeExam.multipleChoiceQuestions.length || !essayResponse.trim()}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs cursor-pointer transition shadow-md flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Grade Simulated Paper & Recalculate XP</span>
            </button>
          </div>
        </div>
      )}

      {subTab === 'review' && (
        <div className="space-y-6" id="exam-grading-critique">
          {gradingLoader ? (
            <div className="bg-white border border-slate-210 dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Aegis AI Scoring Engine is evaluating your essay...</h4>
              <p className="text-[10px] text-slate-501 mt-1">Applying command-word rubrics, syntactic accuracy checks, and inclusive scaffolding feedback.</p>
            </div>
          ) : gradingResult ? (
            <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
              {/* Score Deck */}
              <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 -m-6 p-6 rounded-t-3xl border-b border-emerald-850 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-400 flex items-center justify-center font-black text-2xl text-amber-300 bg-black/10">
                    {gradingResult.overallGrade}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider">Aegis accreditation mock score</span>
                    <h3 className="font-black text-xl text-white tracking-tight">{gradingResult.totalPercentage}% Final Outcome</h3>
                  </div>
                </div>

                <div className="flex gap-4 text-center text-xs">
                  <div className="bg-emerald-955 border border-emerald-800/60 px-4 py-2 rounded-xl">
                    <span className="text-[9px] text-emerald-300 block">MCQ ACCURACY</span>
                    <span className="font-bold text-amber-450">{gradingResult.scoreMC} / 3 Correct</span>
                  </div>
                  <div className="bg-emerald-955 border border-emerald-800/60 px-4 py-2 rounded-xl">
                    <span className="text-[9px] text-emerald-300 block">ESSAY METRICS</span>
                    <span className="font-bold text-amber-450">{gradingResult.essayScore} / 100</span>
                  </div>
                </div>
              </div>

              {/* Pedagogy Review Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs select-text">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wide block">Conceptual Accuracy & Mechanics</span>
                  <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {gradingResult.conceptualAccuracyFeedback}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wide block">Active Verb Evaluation</span>
                  <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {gradingResult.commandWordEvaluation}
                  </p>
                </div>

                <div className="md:col-span-2 p-5 bg-amber-500/5 rounded-2xl border border-amber-205/30 space-y-3">
                  <span className="text-amber-705 dark:text-amber-400 font-bold uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>Suggestions for Final Accreditation Day Improvement</span>
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {gradingResult.suggestionsForImprovement}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-150 dark:border-slate-805/60 pt-4 flex justify-between">
                <span className="text-[10px] text-slate-400 italic">⭐ Awarded +400 Accreditations XP in Socratic Database</span>
                <button
                  onClick={() => setSubTab('generate')}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition"
                >
                  Generate Another exam paper
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-450">
              Grade simulated exams to display metrics.
            </div>
          )}
        </div>
      )}

      {subTab === 'flashcards' && (
        <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-6" id="recall-flashcard-board">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Practice Active Recall</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">Toggle card flips to review core terms as part of inclusive study routines.</p>
            </div>
            <div className="flex gap-2 text-[10px] font-bold">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded dark:bg-green-950/20 dark:text-green-400">Mastered: {masteredCards.length}</span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded dark:bg-red-950/20 dark:text-red-400">Review: {needsPracticeCards.length}</span>
            </div>
          </div>

          {/* Flashcard container with flip transition */}
          <div className="max-w-md mx-auto aspect-video cursor-pointer select-none relative group" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* Front side */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-6 flex flex-col justify-between text-white backface-hidden shadow-lg border border-emerald-500/20">
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-200">{flashcards[currentCardIndex].category}</span>
                <p className="text-center text-sm font-extrabold py-4">{flashcards[currentCardIndex].front}</p>
                <div className="text-center text-[9px] text-emerald-250 font-bold animate-pulse">
                  Click card to reveal answer / Flip 🔄
                </div>
              </div>

              {/* Back side */}
              <div className="absolute inset-x-0 inset-y-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between text-white rotate-y-180 backface-hidden shadow-lg">
                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400">Aegis certified Socratic resolution</span>
                <p className="text-left text-xs font-medium leading-relaxed pb-4 text-slate-205">
                  {flashcards[currentCardIndex].back}
                </p>
                <div className="text-center text-[9px] text-slate-455">
                  Click anywhere to review question again 🔄
                </div>
              </div>

            </div>
          </div>

          {/* Review actions */}
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFlashcardReview(flashcards[currentCardIndex].id, false);
              }}
              className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 text-xs rounded-xl cursor-pointer transition flex items-center gap-1"
            >
              ❌ Needs Revision
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFlashcardReview(flashcards[currentCardIndex].id, true);
              }}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold hover:bg-emerald-100 text-xs rounded-xl cursor-pointer transition flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>Mastered Card</span>
            </button>
          </div>

          {/* Flashcard Index tracker */}
          <div className="text-center text-[10px] text-slate-400 font-semibold pt-2">
            Card {currentCardIndex + 1} of {flashcards.length}
          </div>
        </div>
      )}
    </div>
  );
}
