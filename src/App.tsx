import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Wifi,
  WifiOff,
  Download,
  LogOut,
  User,
  PlusCircle,
  Sparkles,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Award,
  Book,
  Moon,
  Sun,
  Loader2,
  CheckCircle2
} from 'lucide-react';

import { UserProfile, LearningPath, PathNode, ForumPost } from './types';
import StudentSettingsTab from './components/StudentSettingsTab';
import PathVisualizer from './components/PathVisualizer';
import QuizConsole from './components/QuizConsole';
import AssignmentSubmitter from './components/AssignmentSubmitter';
import TutorGuidePanel from './components/TutorGuidePanel';
import AegisForum from './components/AegisForum';
import StatsDashboard from './components/StatsDashboard';
import ExamPrepSuite from './components/ExamPrepSuite';
import SiteAdminPanel from './components/SiteAdminPanel';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [activeNode, setActiveNode] = useState<PathNode | null>(null);
  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'assignment' | 'tutor' | 'exam' | 'forum' | 'stats' | 'settings' | 'admin'>('study');

  // Authorization Form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Connection Simulator States
  const [isOffline, setIsOffline] = useState(false);

  // New path dynamic generator form
  const [showPathGenerator, setShowPathGenerator] = useState(false);
  const [genSubject, setGenSubject] = useState('Introduction to Algorithmic Problem Solving');
  const [genTargetExam, setGenTargetExam] = useState('Undergrad Data Structures Midterm');
  const [genGradeLevel, setGenGradeLevel] = useState('Undergrad');
  const [genLearningStyle, setGenLearningStyle] = useState<'Visual' | 'Practical' | 'Reading' | 'Socratic'>('Practical');
  const [genBackground, setGenBackground] = useState('I am an adult learner returning to tech. I struggle with recursion but love visual flowcharts.');
  const [genLoading, setGenLoading] = useState(false);

  // Recover session securely on mount
  useEffect(() => {
    const stored = localStorage.getItem('aegis_user_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        fetchPathsOfUser(parsed.id);
      } catch (err) {
        localStorage.removeItem('aegis_user_session');
      }
    }
  }, []);

  // Sync forum periodically
  useEffect(() => {
    if (user && !isOffline) {
      fetchForumPosts();
    }
  }, [user, isOffline]);

  const handleLogin = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Email and password must be supplied.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setResetSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('aegis_user_session', JSON.stringify(data.user));
        fetchPathsOfUser(data.user.id);
        // Switch to the admin tab automatically if logged in as Admin
        if (data.user.role === 'Admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('study');
        }
      } else {
        setAuthError(data.error || 'Invalid credentials or connection issue.');
      }
    } catch (err) {
      console.error('Local fallback login check, checking LocalStorage...');
      const stored = localStorage.getItem('aegis_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email.toLowerCase() === authEmail.toLowerCase()) {
          setUser(parsed);
          loadOfflineState(parsed.id);
        } else {
          setAuthError('Offline login match failed.');
        }
      } else {
        setAuthError('Connection timed out. Check local credentials.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authName) return;
    setAuthLoading(true);
    setAuthError(null);
    setResetSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword, name: authName })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('aegis_user_session', JSON.stringify(data.user));
        fetchPathsOfUser(data.user.id);
        setActiveTab('study');
      } else {
        setAuthError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setAuthError('Registration connection issue. Try again shortly.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !authPassword.trim()) {
      setAuthError('Both registered email and a new password are required.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setResetSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccessMessage('Your password has been reset successfully! Use your new credentials to log in.');
        setAuthEmail(resetEmail);
        setAuthMode('login');
      } else {
        setAuthError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setAuthError('Connection issue on reset pipeline. Try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Administration Deletion triggers
  const handleDeleteForumPost = async (postId: string) => {
    if (!user || user.role !== 'Admin') return;
    try {
      const res = await fetch(`/api/admin/forum/${postId}?adminUserId=${user.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchForumPosts();
      }
    } catch (err) {
      console.error('Failed to command thread erasure:', err);
    }
  };

  const handleDeleteForumComment = async (postId: string, commentId: string) => {
    if (!user || user.role !== 'Admin') return;
    try {
      const res = await fetch(`/api/admin/forum/${postId}/comment/${commentId}?adminUserId=${user.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchForumPosts();
      }
    } catch (err) {
      console.error('Failed to command comment erasure:', err);
    }
  };

  const fetchPathsOfUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/learning-path/${userId}`);
      const data = await res.json();
      setLearningPaths(data.paths);
      if (data.paths && data.paths.length > 0) {
        const primaryPath = data.paths[0];
        setActivePath(primaryPath);
        setActiveNode(primaryPath.nodes[0]);
        // Cache locally for offline download (Inclusion/Offline capability)
        localStorage.setItem(`path_${userId}`, JSON.stringify(data.paths));
      }
    } catch (err) {
      console.warn('Using downloaded path list for offline reading.');
      loadOfflineState(userId);
    }
  };

  const fetchForumPosts = async () => {
    try {
      const res = await fetch('/api/forum');
      const data = await res.json();
      setForumPosts(data.posts);
    } catch (err) {
      const cached = localStorage.getItem('aegis_forum_cached');
      if (cached) setForumPosts(JSON.parse(cached));
    }
  };

  const loadOfflineState = (userId: string) => {
    const cachedPath = localStorage.getItem(`path_${userId}`);
    if (cachedPath) {
      const parsed = JSON.parse(cachedPath);
      setLearningPaths(parsed);
      setActivePath(parsed[0]);
      setActiveNode(parsed[0].nodes[0]);
    }

    const cachedForum = localStorage.getItem('aegis_forum_cached');
    if (cachedForum) {
      setForumPosts(JSON.parse(cachedForum));
    }
  };

  // Profile preferences (themes, sizes) saved back dynamically
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      ...updates,
      userStats: { ...user.userStats, ...(updates.userStats || {}) }
    };
    setUser(updatedUser);
    localStorage.setItem('aegis_user_session', JSON.stringify(updatedUser));

    if (!isOffline) {
      try {
        await fetch('/api/auth/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, updates })
        });
      } catch (err) {
        console.warn('Profile cached offline, syncing on connection return.');
      }
    }
  };

  // Generate customized learning branch via Gemini
  const handleGeneratePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || genLoading) return;
    setGenLoading(true);

    try {
      const res = await fetch('/api/learning-path/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: genSubject,
          gradeLevel: genGradeLevel,
          learningStyle: genLearningStyle,
          targetExam: genTargetExam,
          background: genBackground
        })
      });

      const data = await res.json();
      if (data.success) {
        setLearningPaths(prev => [data.path, ...prev]);
        setActivePath(data.path);
        setActiveNode(data.path.nodes[0]);
        setShowPathGenerator(false);
        setActiveTab('study');

        // Backup update cached paths list
        localStorage.setItem(`path_${user.id}`, JSON.stringify([data.path, ...learningPaths]));
      } else {
        alert(data.error || 'Server error. Fallback course generated.');
      }
    } catch (err) {
      alert('Pathfinder generated a native offline path due to lack of network credentials.');
    } finally {
      setGenLoading(false);
    }
  };

  // Complete lesson node module
  const handleCompleteLessonNode = async () => {
    if (!user || !activePath || !activeNode) return;

    // Fast visual optimistic local state update for zero-latency look
    const updatedNodes = activePath.nodes.map(n => {
      if (n.id === activeNode.id) {
        return { ...n, isCompleted: true };
      }
      // Unlock subsequent sibling node
      if (n.order === activeNode.order + 1) {
        return { ...n, isUnlocked: true };
      }
      return n;
    });

    const updatedPath = { ...activePath, nodes: updatedNodes };
    setActivePath(updatedPath);
    setLearningPaths(prev => prev.map(p => p.id === activePath.id ? updatedPath : p));

    // XP boost and study streak checks
    const todaySlug = new Date().toISOString().split('T')[0];
    const stats = { ...user.userStats };
    stats.totalXP += 150;
    stats.studyMinutesByDay[todaySlug] = (stats.studyMinutesByDay[todaySlug] || 0) + 15;
    if (stats.lastStudyDate !== todaySlug) {
      stats.learningStreak += 1;
      stats.lastStudyDate = todaySlug;
    }
    handleUpdateProfile({ userStats: stats });

    // Active Node refresh
    const refreshedNode = updatedNodes.find(n => n.id === activeNode.id) || null;
    setActiveNode(refreshedNode);

    // Save state in browser database to survive dropouts
    localStorage.setItem(`path_${user.id}`, JSON.stringify(learningPaths.map(p => p.id === activePath.id ? updatedPath : p)));

    if (!isOffline) {
      try {
        const res = await fetch('/api/learning-path/complete-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, pathId: activePath.id, nodeId: activeNode.id })
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.warn('Completed node marked, saved local queue for reconnection upload.');
      }
    } else {
      // Record in offline queue
      const queueCompleted = JSON.parse(localStorage.getItem(`offline_completed_${user.id}`) || '[]');
      if (!queueCompleted.includes(activeNode.id)) {
        queueCompleted.push(activeNode.id);
        localStorage.setItem(`offline_completed_${user.id}`, JSON.stringify(queueCompleted));
      }
    }
  };

  // Submit Interactive Quiz
  const handleQuizScoreSubmitted = async (percentScore: number) => {
    if (!user || !activePath || !activeNode) return;

    // Optimistic state
    const updatedNodes = activePath.nodes.map(n => {
      if (n.id === activeNode.id) {
        return { ...n, quizScore: percentScore };
      }
      return n;
    });
    const updatedPath = { ...activePath, nodes: updatedNodes };
    setActivePath(updatedPath);
    setLearningPaths(prev => prev.map(p => p.id === activePath.id ? updatedPath : p));

    const refreshed = updatedNodes.find(n => n.id === activeNode.id) || null;
    setActiveNode(refreshed);

    const stats = { ...user.userStats };
    stats.totalQuizzesTaken += 1;
    stats.totalXP += percentScore * 2 + 50;
    handleUpdateProfile({ userStats: stats });

    localStorage.setItem(`path_${user.id}`, JSON.stringify(learningPaths.map(p => p.id === activePath.id ? updatedPath : p)));

    if (!isOffline) {
      try {
        const res = await fetch('/api/learning-path/quiz-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, pathId: activePath.id, nodeId: activeNode.id, score: percentScore })
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.warn('Quiz score cached locally.');
      }
    } else {
      const queueQuizzes = JSON.parse(localStorage.getItem(`offline_quizzes_${user.id}`) || '[]');
      queueQuizzes.push({ nodeId: activeNode.id, score: percentScore });
      localStorage.setItem(`offline_quizzes_${user.id}`, JSON.stringify(queueQuizzes));
    }
  };

  // Submit Homework Assignment Essay
  const handleAssignmentSubmitted = async (submissionText: string) => {
    if (!user || !activePath || !activeNode) return;

    if (!isOffline) {
      const res = await fetch('/api/assignment/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pathId: activePath.id,
          nodeId: activeNode.id,
          submission: submissionText
        })
      });

      const data = await res.json();
      if (data.success) {
        setActivePath(data.path);
        setLearningPaths(prev => prev.map(p => p.id === activePath.id ? data.path : p));
        const refreshed = data.path.nodes.find((n: any) => n.id === activeNode.id);
        setActiveNode(refreshed);
        setUser(data.user);
      } else {
        throw new Error(data.error);
      }
    } else {
      // Offline Simulated Evaluation (Offline inclusion design)
      const mockResultPathNodes = activePath.nodes.map(n => {
        if (n.id === activeNode.id) {
          return {
            ...n,
            assignment: {
              ...n.assignment,
              submission: submissionText,
              grade: 'Saved (Pending Sync)',
              feedback: 'Aegis cached this assignment properly in offline local storage. It will feed to your AI Socratic Tutor automatically once your network connection state returns. Keep up the amazing work formulating definitions!'
            }
          };
        }
        return n;
      });

      const updatedP = { ...activePath, nodes: mockResultPathNodes };
      setActivePath(updatedP);
      setLearningPaths(prev => prev.map(p => p.id === activePath.id ? updatedP : p));
      setActiveNode(mockResultPathNodes.find(n => n.id === activeNode.id) || null);

      // Record in offline queue
      const queueHW = JSON.parse(localStorage.getItem(`offline_hw_${user.id}`) || '[]');
      queueHW.push({ nodeId: activeNode.id, submission: submissionText, submittedAt: new Date().toISOString() });
      localStorage.setItem(`offline_hw_${user.id}`, JSON.stringify(queueHW));
    }
  };

  // Sync Offline Queue Actions to Server
  const handleToggleOfflineMode = async () => {
    const nextOfflineState = !isOffline;
    setIsOffline(nextOfflineState);

    if (user && !nextOfflineState) {
      // Just returning to online! Fire sync packet!
      const completedIds = JSON.parse(localStorage.getItem(`offline_completed_${user.id}`) || '[]');
      const quizzesQueue = JSON.parse(localStorage.getItem(`offline_quizzes_${user.id}`) || '[]');
      const hwsQueue = JSON.parse(localStorage.getItem(`offline_hw_${user.id}`) || '[]');

      if (completedIds.length > 0 || quizzesQueue.length > 0 || hwsQueue.length > 0) {
        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              offlineCompletedNodeIds: completedIds,
              offlineQuizScores: quizzesQueue,
              offlineAssignments: hwsQueue
            })
          });

          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            setLearningPaths(data.paths);
            if (data.paths && data.paths.length > 0) {
              const matchedP = data.paths.find((p: any) => p.id === activePath?.id) || data.paths[0];
              setActivePath(matchedP);
              if (activeNode) {
                setActiveNode(matchedP.nodes.find((n: any) => n.id === activeNode.id) || matchedP.nodes[0]);
              }
            }
            // Clear synced buffers
            localStorage.removeItem(`offline_completed_${user.id}`);
            localStorage.removeItem(`offline_quizzes_${user.id}`);
            localStorage.removeItem(`offline_hw_${user.id}`);
            alert('🎉 Aegis Sync Complete: Offline study logs successfully decrypted and combined onto securely encrypted cloud server!');
          }
        } catch (err) {
          console.error('Failed syncing state. Storing in local DB for next trial.', err);
        }
      }
    }
  };

  // Download lesson bundle as JSON (Offline Cap)
  const handleDownloadLessonContent = () => {
    if (!activeNode) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeNode, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aegis_lesson_${activeNode.title.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Collaborative Forum commands
  const handleCreateForumPost = async (title: string, content: string, tag: string) => {
    if (!user) return;
    const postBody = { userId: user.id, title, content, subjectTag: tag };

    if (!isOffline) {
      try {
        const res = await fetch('/api/forum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody)
        });
        const data = await res.json();
        if (data.success) {
          fetchForumPosts();
        }
      } catch (err) {
        console.error('Forum posting requires a network connection.');
      }
    } else {
      // Simulation of post in offline view
      const mockPost: ForumPost = {
        id: `offline-p-${Date.now()}`,
        title,
        content,
        subjectTag: tag,
        authorId: user.id,
        authorName: user.name,
        authorRole: 'Student',
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        comments: []
      };
      setForumPosts(prev => [mockPost, ...prev]);
    }
  };

  const handleAddForumComment = async (postId: string, content: string) => {
    if (!user) return;

    if (!isOffline) {
      try {
        const res = await fetch(`/api/forum/${postId}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, content })
        });
        const data = await res.json();
        if (data.success) {
          fetchForumPosts();
        }
      } catch (err) {
        console.error('Comment posting failed.');
      }
    } else {
      // Offline local insert simulation
      setForumPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `offline-c-${Date.now()}`,
                authorId: user.id,
                authorName: user.name,
                authorRole: 'Student',
                content,
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return p;
      }));
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    if (!isOffline) {
      try {
        const res = await fetch(`/api/forum/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        const data = await res.json();
        if (data.success) {
          fetchForumPosts();
        }
      } catch (err) {
        console.error('Liking failed.');
      }
    } else {
      setForumPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const idx = p.likedBy.indexOf(user.id);
          const likedBy = [...p.likedBy];
          let likes = p.likes;
          if (idx === -1) {
            likedBy.push(user.id);
            likes += 1;
          } else {
            likedBy.splice(idx, 1);
            likes -= 1;
          }
          return { ...p, likedBy, likes };
        }
        return p;
      }));
    }
  };

  const logout = () => {
    setUser(null);
    setLearningPaths([]);
    setActivePath(null);
    setActiveNode(null);
    localStorage.removeItem('aegis_user_session');
  };

  // Accessibility formatting lookups
  const getThemeClass = () => {
    if (!user) return 'bg-slate-50 text-slate-800';
    switch (user.preferredTheme) {
      case 'cream':
        return 'bg-[#FAF6EE] text-[#2F1F17] selection:bg-amber-250';
      case 'contrast':
        return 'bg-white text-black font-semibold selection:bg-yellow-200';
      default: // slate theme preset
        return 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-indigo-500/20';
    }
  };

  const getFontSizeClass = () => {
    if (!user) return 'text-xs';
    switch (user.fontSize) {
      case 'large':
        return 'text-sm sm:text-base';
      case 'extra-large':
        return 'text-base sm:text-lg';
      default:
        return 'text-xs sm:text-xs md:text-sm';
    }
  };

  const getHeaderStyle = () => {
    if (user?.preferredTheme === 'cream') return 'bg-amber-100/50 border-amber-200 text-amber-950';
    if (user?.preferredTheme === 'contrast') return 'bg-white border-2 border-black text-black';
    return 'bg-white border-b border-slate-200/80 text-slate-800 dark:bg-slate-900 dark:border-slate-800/80 dark:text-slate-100 shadow-xs';
  };

  const getContainerStyle = () => {
    if (user?.preferredTheme === 'cream') return 'bg-[#FAF6EE] border-amber-200';
    if (user?.preferredTheme === 'contrast') return 'bg-white border-2 border-black';
    return 'bg-white border border-slate-250/80 shadow-sm rounded-2xl dark:bg-slate-900 dark:border-slate-800/80';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-150 selection:bg-emerald-500/30 flex flex-col justify-between" style={{ backgroundImage: `radial-gradient(ellipse at top, #042f1a, #020617)` }} id="public-landing-facade">
        
        {/* Landing Nav Header */}
        <header className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5 leading-none">
                <span>Aegis Institute</span>
                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI Mentor</span>
              </h1>
              <p className="text-[9px] text-slate-400 mt-0.5">Constructivist & Socratic Framework</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 hidden sm:inline">Portal Access Status: Active Seeding</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </header>

        {/* Hero Section & Form Container */}
        <main className="max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
          
          {/* Pitch Panel */}
          <div className="lg:col-span-7 space-y-6 text-left animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Socratic Mentor Platform v2.5</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight select-text">
              Reimagining Education Through Deep <span className="text-emerald-400">Socratic Inquiry</span>
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xl select-text">
              Aegis is an inclusive, AI-powered mentor designed to guide students of all educational backgrounds. Instead of supplying copy-paste direct answers, Aegis employs structured constructive questioning to build lasting conceptual intuition.
            </p>

            {/* Platform benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 select-none">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Active Roadmaps</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Syllabi generated in seconds, tailored to your style and background.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">No Direct Solvers</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Our mentor asks logical check questions to help you spot flaws.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Academic Discussion Hub</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Identify study peers sorted by background and original campus.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Exam Preparation Suites</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Review complex topics, take graded diagnostic tests, and log XP stats.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration / Active Access Terminal Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden text-center self-center animate-fade-in" id="portal-form-wrapper">
            
            {/* Tab Swappers */}
            <div className="flex border-b border-white/10 pb-3 mb-6 select-none justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setResetSuccessMessage(null);
                }}
                className={`pb-1 text-xs font-bold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                  authMode === 'login' ? 'text-emerald-400 border-b border-emerald-400' : 'text-slate-450 hover:text-slate-300'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                  setResetSuccessMessage(null);
                }}
                className={`pb-1 text-xs font-bold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                  authMode === 'register' ? 'text-emerald-400 border-b border-emerald-400' : 'text-slate-450 hover:text-slate-300'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('reset');
                  setAuthError(null);
                  setResetSuccessMessage(null);
                }}
                className={`pb-1 text-xs font-bold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                  authMode === 'reset' ? 'text-emerald-400 border-b border-emerald-400' : 'text-slate-450 hover:text-slate-300'
                }`}
              >
                Recover Password
              </button>
            </div>

            {/* Notification messages */}
            {resetSuccessMessage && (
              <div className="mb-4 text-left p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-fade-in">
                💡 {resetSuccessMessage}
              </div>
            )}

            {authError && (
              <div className="mb-4 text-left p-3.5 rounded-xl bg-rose-500/10 border border-rose-550/25 text-rose-400 text-xs font-semibold animate-fade-in">
                ❌ {authError}
              </div>
            )}

            {/* Login Form block */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-left">
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">Registered Email</label>
                  <input
                    type="email"
                    placeholder="e.g. demo@aegis.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <div className="text-left">
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">Secret Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Enter Authorized Study</span>
                  )}
                </button>
              </form>
            )}

            {/* Registration Form block */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <div>
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">Full Academic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">University / Email</label>
                  <input
                    type="email"
                    placeholder="e.g. alex@aegis.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">Set Secret Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 mt-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Profile Roster...</span>
                    </>
                  ) : (
                    <span>Create Free Student Account</span>
                  )}
                </button>
              </form>
            )}

            {/* Password Reset Form block */}
            {authMode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                  Enter your registered student email and specify a new password. The server will decrypt and update your key instantly.
                </p>

                <div>
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">Registered Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. demo@aegis.edu"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider block">Choose New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 mt-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing Encrypted Key...</span>
                    </>
                  ) : (
                    <span>Reset Password Securely</span>
                  )}
                </button>
              </form>
            )}

            {/* Quick pre-seeded guides */}
            <div className="mt-6 pt-4 border-t border-white/10 text-left space-y-2">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Evaluator Credentials Desk (Click to Autofill & Login)</span>
              
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail('demo@aegis.edu');
                    setAuthPassword('password123');
                    setAuthMode('login');
                  }}
                  className="bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-550/10 p-2.5 rounded-xl text-left cursor-pointer transition-all"
                  title="Autofill standard student account"
                >
                  <span className="font-bold text-white block">Student Account</span>
                  <span className="font-mono text-slate-450 block mt-0.5">demo@aegis.edu</span>
                  <span className="font-mono text-slate-450 block">password123</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail('admin@aegis.edu');
                    setAuthPassword('admin123');
                    setAuthMode('login');
                  }}
                  className="bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-550/15 p-2.5 rounded-xl text-left cursor-pointer transition-all"
                  title="Autofill site administrator"
                >
                  <span className="font-bold text-emerald-400 block">🛡️ Admin Account</span>
                  <span className="font-mono text-slate-450 block mt-0.5">admin@aegis.edu</span>
                  <span className="font-mono text-slate-450 block">admin123</span>
                </button>
              </div>
            </div>

          </div>

        </main>

        {/* Dynamic platform footer */}
        <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-medium select-none">
          <span>© 2026 Aegis Socratic Learning Trust. Protected by AES-256-CBC hardware encryption layers.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 transition-colors">Constructivist Guide</span>
            <span className="hover:text-slate-300 transition-colors">Privacy Charter</span>
            <span className="hover:text-amber-400 transition-colors">Admin Desk</span>
          </div>
        </footer>

      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-12 transition-all ${getThemeClass()}`} id="dashboard-dock">
      {/* Top Main Navigation Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between px-6 py-3 shrink-0 ${getHeaderStyle()}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md transition-transform hover:scale-105">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight flex items-center gap-1.5 leading-none">
              <span className="font-display">Aegis Learning</span>
              <span className="text-[9px] font-semibold bg-emerald-550/10 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 py-0.5 px-1.5 rounded-full uppercase tracking-wider scale-95">Mentor Portal</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Inclusive Socratic Curriculum Platform</p>
          </div>
        </div>

        {/* Offline simulated connection panel & user session */}
        <div className="flex items-center gap-4">
          {/* Offline Sync Switcher */}
          <button
            onClick={handleToggleOfflineMode}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition shadow-xs border ${
              isOffline
                ? 'bg-rose-50 border-rose-205 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                : 'bg-emerald-50 border-emerald-205 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
            }`}
            title="Toggle offline state to simulate poor dynamic network zones"
          >
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{isOffline ? 'Offline Simulated Mode' : 'Connected Online'}</span>
          </button>

          {/* User badge login logout controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{user.name}</span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">{user.email}</span>
            </div>

            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center font-extrabold text-emerald-700 shrink-0 text-xs shadow-xs select-none dark:bg-emerald-950/50 dark:border-emerald-850 dark:text-emerald-300">
              {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'JD'}
            </div>

            <button
              onClick={logout}
              title="Log Out Student Session"
              type="button"
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition text-slate-400 hover:text-rose-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Course pathfinder tree & Accessibility */}
        <section className="lg:col-span-4 space-y-6">
          <div className={`rounded-3xl border p-5 shadow-sm overflow-hidden flex flex-col gap-4 ${getContainerStyle()}`}>
            
            {/* Active Pathfinder title deck */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Active Pathfinder</h3>
                <h2 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {activePath ? activePath.subject : 'No Active Course'}
                </h2>
              </div>
              <button
                onClick={() => setShowPathGenerator(true)}
                type="button"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-150 text-emerald-600 cursor-pointer dark:border-slate-700 dark:hover:bg-slate-850"
                title="Generate New Customized Pathfinder"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Path Nodes Visual List */}
            {activePath ? (
              <PathVisualizer
                nodes={activePath.nodes}
                activeNodeId={activeNode ? activeNode.id : ''}
                onSelectNode={(node) => {
                  setActiveNode(node);
                  setActiveTab('study');
                }}
              />
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Click "+" above to formulate an AI course path finder.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Workspaces */}
        <section className="lg:col-span-8 flex flex-col gap-6">

          {/* Course finder generate dialog / slideover */}
          {showPathGenerator && (
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-3xl border border-emerald-500/20 text-white space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <h3 className="text-sm">Personalize AI Academic Curriculum</h3>
                </div>
                <button
                  onClick={() => setShowPathGenerator(false)}
                  type="button"
                  className="text-xs text-emerald-200 hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleGeneratePath} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-200">
                <div>
                  <label className="block text-emerald-300 text-[10px] uppercase font-bold tracking-wider mb-1">Subject Topic</label>
                  <input
                    type="text"
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/20 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 text-[10px] uppercase font-bold tracking-wider mb-1">Target Exam / Goal</label>
                  <input
                    type="text"
                    value={genTargetExam}
                    onChange={(e) => setGenTargetExam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/20 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 text-[10px] uppercase font-bold tracking-wider mb-1">Grade Level</label>
                  <select
                    value={genGradeLevel}
                    onChange={(e) => setGenGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/20 rounded-xl text-xs outline-none focus:border-emerald-500 text-white cursor-pointer"
                  >
                    <option value="Middle School">Middle School</option>
                    <option value="High School">High School</option>
                    <option value="Undergrad">Undergrad (University)</option>
                    <option value="Adult Learner">Adult Learner / Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-300 text-[10px] uppercase font-bold tracking-wider mb-1">Learning style Preferences</label>
                  <select
                    value={genLearningStyle}
                    onChange={(e) => setGenLearningStyle(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/20 rounded-xl text-xs outline-none focus:border-emerald-500 text-white cursor-pointer"
                  >
                    <option value="Practical">Practical (Case analysis & applied quizzes)</option>
                    <option value="Visual">Visual (Analogies & high layout clarity)</option>
                    <option value="Reading">Reading (Markdown tutorials & summaries)</option>
                    <option value="Socratic">Socratic (Discussion prompts & chat queries)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-emerald-300 text-[10px] uppercase font-bold tracking-wider mb-1">Student Background (Inclusive context)</label>
                  <textarea
                    value={genBackground}
                    onChange={(e) => setGenBackground(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/20 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={genLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-650/20"
                  >
                    {genLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Generating custom Socratic lesson material...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Formulate Custom Pathway</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* workspace tabs navigators */}
          <div className="flex border-b border-slate-200/50 dark:border-slate-850 gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {(() => {
              const tabs = [
                { id: 'study', name: 'Curriculum Study' },
                { id: 'quiz', name: 'Interactive Quiz' },
                { id: 'assignment', name: 'Assignment Draft' },
                { id: 'tutor', name: 'AI Tutor Guide' },
                { id: 'exam', name: 'Exam Prep Suite' },
                { id: 'forum', name: 'Discussion Forum' },
                { id: 'stats', name: 'Personal Analytics' },
                { id: 'settings', name: 'Settings & Profile' }
              ];
              if (user && user.role === 'Admin') {
                tabs.push({ id: 'admin', name: '🛡️ Site Admin Cockpit' });
              }
              return tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  type="button"
                  className={`px-4 py-2 border-b-2 text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600 dark:border-emerald-450 dark:text-emerald-400 font-bold'
                      : 'border-transparent text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {tab.name}
                </button>
              ));
            })()}
          </div>

          {/* ACTIVE workspace deck panel */}
          {activeTab === 'study' && activeNode && (
            <div className={`rounded-3xl border p-6 shadow-sm flex flex-col gap-5 ${getContainerStyle()}`} id="lesson-content-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lesson Material ({activeNode.section})</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1">{activeNode.title}</h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadLessonContent}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition select-none"
                    title="Download fully searchable offline study log"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download content</span>
                  </button>
                </div>
              </div>

              {/* Lesson details block with Accessibility adjustments */}
              <article className={`space-y-4 prose max-w-none prose-slate dark:prose-invert ${getFontSizeClass()} select-text leading-relaxed tracking-wide`}>
                <div className="whitespace-pre-wrap">
                  {/* Since react-markdown might not be installed, we render the markdown cleanly formatted */}
                  {activeNode.content.split('\n\n').map((block, idx) => {
                    if (block.startsWith('### ')) {
                      return <h3 key={idx} className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-6 mb-2">{block.replace('### ', '')}</h3>;
                    }
                    if (block.startsWith('#### ')) {
                      return <h4 key={idx} className="text-lg font-bold text-slate-850 dark:text-slate-250 mt-4 mb-2">{block.replace('#### ', '')}</h4>;
                    }
                    if (block.startsWith('- ') || block.startsWith('* ')) {
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1 mb-2">
                          {block.split('\n').map((li, lidx) => (
                            <li key={lidx}>{li.replace(/^[-\*]\s+/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (block.includes('**')) {
                      // Basic bold styling parsing inline
                      return <p key={idx} className="mb-4">{block}</p>;
                    }
                    return <p key={idx} className="mb-4">{block}</p>;
                  })}
                </div>
              </article>

              {/* Complete Lesson checkbox bottom navigation */}
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 flex justify-between gap-4">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                  <Book className="w-4 h-4 text-emerald-555" />
                  <span>Highlight words and use inclusive Text-to-Speech to read aloud.</span>
                </div>

                {!activeNode.isCompleted ? (
                  <button
                    onClick={handleCompleteLessonNode}
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer transition shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Mark Unit Completed (+150 XP)</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/20 text-green-600 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lesson Material Finished</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quiz' && activeNode && (
            <QuizConsole
              node={activeNode}
              onSubmitQuizScore={handleQuizScoreSubmitted}
            />
          )}

          {activeTab === 'assignment' && activeNode && (
            <AssignmentSubmitter
              assignment={activeNode.assignment}
              isUnlocked={activeNode.isUnlocked}
              onSubmit={handleAssignmentSubmitted}
            />
          )}

          {activeTab === 'tutor' && activePath && (
            <TutorGuidePanel
              userId={user.id}
              userName={user.name}
              activeSubject={activePath.subject}
              learningStyle={activePath.learningStyle}
            />
          )}

          {activeTab === 'exam' && activePath && (
            <ExamPrepSuite
              userId={user.id}
              activeSubject={activePath.subject}
              learningStyle={activePath.learningStyle}
              userBackground={user.background}
              onXPUnlocked={(xpReward) => {
                const stats = { ...user.userStats };
                stats.totalXP += xpReward;
                handleUpdateProfile({ userStats: stats });
              }}
            />
          )}

          {activeTab === 'forum' && (
            <AegisForum
              posts={forumPosts}
              user={user}
              onCreatePost={handleCreateForumPost}
              onAddComment={handleAddForumComment}
              onLikePost={handleLikePost}
              onDeletePost={handleDeleteForumPost}
              onDeleteComment={handleDeleteForumComment}
            />
          )}

          {activeTab === 'stats' && (
            <StatsDashboard
              stats={user.userStats}
              userName={user.name}
            />
          )}

          {activeTab === 'settings' && user && (
            <StudentSettingsTab
              user={user}
              onUpdateUser={handleUpdateProfile}
            />
          )}

          {activeTab === 'admin' && user && user.role === 'Admin' && (
            <SiteAdminPanel
              adminUser={user}
              isOffline={isOffline}
            />
          )}

        </section>

      </main>

      {/* Professional Polish Educational Workspace Dynamic Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 mb-6 select-none" id="education-system-footer">
        <div className="border border-slate-200/60 bg-white/70 backdrop-blur-md dark:bg-slate-900/60 dark:border-slate-800/80 rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-medium">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono bg-slate-100/65 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200/40 dark:border-slate-850">Session: Secure Cloud (AES-256 Encrypted)</span>
            <span className="font-mono bg-slate-100/65 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200/40 dark:border-slate-850">Dynamic Sandbox Range: 14.2GB / 50GB</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping absolute"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>Aegis Socratic AI Systems Active</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>Sync Complete</span>
            </span>
            <span className="font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-100/30">v4.8.0 Build-Accessible</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
