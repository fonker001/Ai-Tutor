import React, { useState, useEffect } from 'react';
import { 
  User, 
  Eye, 
  Type, 
  Volume2, 
  VolumeX, 
  Save, 
  Loader2, 
  School, 
  FileText, 
  Mail, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../types';

interface StudentSettingsTabProps {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => Promise<any>;
}

export default function StudentSettingsTab({ user, onUpdateUser }: StudentSettingsTabProps) {
  // TTS States
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [synthAvailable, setSynthAvailable] = useState(false);

  // Student Details Form States
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [school, setSchool] = useState(user.school || 'Aegis Academy');
  const [background, setBackground] = useState(user.background || '');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynthAvailable(true);
    }
  }, []);

  // Update states on user change
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setSchool(user.school || 'Aegis Academy');
    setBackground(user.background || '');
  }, [user]);

  const changeTheme = async (theme: 'slate' | 'cream' | 'contrast') => {
    await onUpdateUser({ preferredTheme: theme });
  };

  const changeFontSize = async (size: 'normal' | 'large' | 'extra-large') => {
    await onUpdateUser({ fontSize: size });
  };

  // TTS Read Aloud implementation
  const handleReadAloudSelection = () => {
    if (!synthAvailable) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const selectionText = window.getSelection()?.toString();
    const textToSpeak = selectionText || "Select any text on this page and slide the speed control to customize your audio reading.";
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.onend = () => setIsPlaying(false);
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await onUpdateUser({
        name,
        email,
        school,
        background
      });
      setSuccessMsg('Profile details successfully synced to Socratic database.');
      // Auto fade out success msg
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync modifications.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="student-settings-view">
      
      {/* Upper Bio card */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 capitalize text-slate-950 font-black text-2xl flex items-center justify-center shadow">
            {name ? name.substring(0, 2) : 'ST'}
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight">{name || 'Student Learner'}</h3>
            <p className="text-emerald-300 text-xs mt-0.5">{school || 'Aegis Academy'}</p>
            <p className="text-[10px] text-emerald-400 mt-1 select-all">{email}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold tracking-wider text-amber-400 bg-white/10 px-3 py-1 rounded-full uppercase">
            Active Student Profile
          </span>
          <p className="text-[10px] text-slate-350 mt-1.5 italic">Joined Aegis Learning Platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <User className="w-4 h-4 text-emerald-505" />
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Personal Information
            </h4>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-bold">
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Student Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <School className="w-3 h-3" />
                <span>School / College Name</span>
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
                placeholder="e.g. Stanford University or Oxford High School"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-medium"
              />
              <span className="text-[9px] text-slate-400 font-normal mt-0.5 block">
                This school tag will identify you on discussion and collaborative threads.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Study Background & Obstacles</span>
              </label>
              <textarea
                rows={3}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Explain what concepts you struggle with (e.g., recursive logic, visual models) so the AI Assistant adapts..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow flex items-center justify-center gap-1.5"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile Modifications...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Profile & Sync Details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Interactive Accessibility Suite (page-ified settings) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Eye className="w-4 h-4 text-emerald-505" />
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Educational Study Settings
            </h4>
          </div>

          <div className="space-y-5 text-xs font-bold">
            {/* Style evaluation section */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-2">
                Contrast Reading Modes
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'slate', name: 'Ambient Charcoal (Default)', fontCol: 'text-slate-900' },
                  { id: 'cream', name: 'Soft Warm Glass', fontCol: 'text-amber-950 bg-amber-50/50' },
                  { id: 'contrast', name: 'High Contrast (Pure Dark)', fontCol: 'text-black border-2 border-black' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id as any)}
                    type="button"
                    className={`p-3 rounded-xl text-left border font-semibold cursor-pointer transition w-full ${
                      user.preferredTheme === t.id
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold'
                        : 'border-slate-150 hover:bg-slate-100 bg-white text-slate-700 dark:bg-slate-800/30 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font scaling controls */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-2">
                Display Font Scaling
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', name: 'Standard (14px)', desc: 'text-sm' },
                  { id: 'large', name: 'Large', desc: 'text-base' },
                  { id: 'extra-large', name: 'Max Vis', desc: 'text-lg' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => changeFontSize(f.id as any)}
                    type="button"
                    className={`flex items-center justify-center gap-1 p-2 rounded-xl border text-center font-semibold cursor-pointer transition ${
                      user.fontSize === f.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-705 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-slate-150 hover:bg-slate-50 bg-white text-slate-700 dark:bg-slate-800/30 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>{f.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Offline Text to Speech Engine */}
            <div className="bg-slate-50 dark:bg-slate-950/35 p-4 rounded-2xl border border-slate-150/80 dark:border-slate-800/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider font-semibold">
                  Text-to-Speech (TTS) Reader
                </span>
                {synthAvailable ? (
                  <span className="text-[9px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded-full">Speech Engine Live</span>
                ) : (
                  <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full">Not Supported</span>
                )}
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed font-normal mb-3">
                Instruct the Socratic assistant to read paragraphs aloud! Select any text block on any tab, then launch the reader.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReadAloudSelection}
                  disabled={!synthAvailable}
                  type="button"
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white font-extrabold cursor-pointer transition w-full ${
                    isPlaying 
                      ? 'bg-rose-500 hover:bg-rose-600 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                  }`}
                >
                  {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isPlaying ? 'Stop Audio Read' : 'Read Highlighted Text'}</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Reader Speed: {speechRate}x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-1/2 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
