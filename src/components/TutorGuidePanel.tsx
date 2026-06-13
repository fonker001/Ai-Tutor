import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface TutorGuidePanelProps {
  userId: string;
  activeSubject: string;
  learningStyle: string;
  userName: string;
}

export default function TutorGuidePanel({ userId, activeSubject, learningStyle, userName }: TutorGuidePanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: `Hello ${userName}! 👋 I am your **Aegis Academic Guide & Mentor**. \n\nI am configured for your **${learningStyle}** learning style. Feel free to ask me anything about "${activeSubject}"! I can outline analogies, explain formulas, or formulate custom revision drills.` }]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: textToSend }]
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messages: [...messages, userMessage],
          subject: activeSubject,
          learningStyle
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'model',
          parts: [{ text: data.text }]
        }]);
      } else {
        throw new Error(data.error || 'Server error.');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: `I am currently experiencing a localized offline sync. Rest assured, I am keeping track of your coursework! Try re-pinging me when your dashboard connection is fully online.` }]
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        parts: [{ text: `Hello again, ${userName}! Chat cycle reset. What aspect of ${activeSubject} shall we explore together?` }]
      }
    ]);
  };

  const suggestions = [
    `Explain the biggest concepts in ${activeSubject} using a simple food analogy!`,
    `Give me a 3-question rapid exam prep review quiz!`,
    `How can I explain these ideas to a primary school kid?`
  ];

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60 flex flex-col h-[460px] overflow-hidden shadow-sm" id="tutor-chat-panel">
      {/* Header Deck */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 text-white flex items-center justify-between gap-2 shadow-sm border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 animate-pulse text-amber-400" />
          <div>
            <h4 className="font-bold text-xs tracking-wide">Aegis AI Socratic Tutor</h4>
            <p className="text-[10px] text-emerald-100 italic">Connected in {learningStyle} style Mode</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          title="Reset Socratic Conversation"
          type="button"
          className="p-1 rounded-lg hover:bg-white/10 text-white/80 cursor-pointer transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((m, index) => {
          const isModel = m.role === 'model';
          return (
            <div
              key={index}
              className={`flex ${isModel ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isModel
                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 shadow-inner rounded-tl-none'
                    : 'bg-emerald-600 text-white rounded-tr-none'
                }`}
              >
                {/* Clean markdown bold and bullet markers inline */}
                <p className="whitespace-pre-wrap select-text">
                  {m.parts[0].text}
                </p>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2 dark:bg-slate-800 rounded-tl-none">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>Academic guide is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggestion list decks */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Suggested Revise Prompts</span>
          <div className="flex flex-col gap-1">
            {suggestions.map((sg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sg)}
                className="flex items-center justify-between text-left px-2 py-1.5 rounded-lg border border-slate-150 bg-white hover:bg-emerald-50/40 text-[10px] text-slate-600 dark:border-slate-850 dark:bg-slate-900/60 dark:text-slate-300 cursor-pointer transition group"
              >
                <span className="truncate">{sg}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Form input wrapper */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-800/80 flex gap-2"
        id="tutor-chat-form"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder="Ask Aegis Tutor a question..."
          className="flex-1 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="p-2 rounded-xl bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 cursor-pointer transition shadow-sm shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
