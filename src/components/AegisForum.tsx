import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, PlusCircle, User, Award, Tag, Sparkles, Trash2 } from 'lucide-react';
import { ForumPost, UserProfile } from '../types';

interface AegisForumProps {
  posts: ForumPost[];
  user: UserProfile;
  onCreatePost: (title: string, content: string, tag: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onLikePost: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

export default function AegisForum({ 
  posts, 
  user, 
  onCreatePost, 
  onAddComment, 
  onLikePost,
  onDeletePost,
  onDeleteComment
}: AegisForumProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'prep' | 'collab'>('all');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('Exam Prep & Geography');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const filteredPosts = posts.filter(post => {
    // 1. Tag tab filter
    if (activeTab === 'prep' && !post.subjectTag.toLowerCase().includes('prep')) return false;
    if (activeTab === 'collab' && !post.subjectTag.toLowerCase().includes('collab')) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = post.title.toLowerCase().includes(q);
      const contentMatch = post.content.toLowerCase().includes(q);
      const authorMatch = post.authorName.toLowerCase().includes(q);
      const tagMatch = post.subjectTag.toLowerCase().includes(q);
      const schoolMatch = post.authorSchool ? post.authorSchool.toLowerCase().includes(q) : false;
      return titleMatch || contentMatch || authorMatch || tagMatch || schoolMatch;
    }

    return true;
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    onCreatePost(newPostTitle, newPostContent, newPostTag);
    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPostForm(false);
  };

  const handleCommentSubmit = (postId: string) => {
    if (!commentText.trim()) return;
    onAddComment(postId, commentText);
    setCommentText('');
    setActiveCommentPostId(null);
  };

  const getRoleLabelClass = (role: 'Student' | 'AI Tutor' | 'Facilitator') => {
    switch (role) {
      case 'AI Tutor':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-200/40';
      case 'Facilitator':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/40';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-4" id="community-forum">
      {/* Forum banner controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Collaborative Peer Hub</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Collaborate, discuss exam topics, and revise with peers</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewPostForm(!showNewPostForm)}
          type="button"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* New Thread Form */}
      {showNewPostForm && (
        <form onSubmit={handlePostSubmit} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md space-y-3 animate-fade-in dark:bg-slate-900 dark:border-slate-800">
          <h4 className="font-bold text-slate-850 dark:text-slate-100 text-xs">Create New Thread</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Descriptive Title (e.g. Help understanding ocean buffering math model)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-emerald-500"
            />
            <textarea
              placeholder="Formulate your query or project outline. Encourage study partners to drop an analysis..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-emerald-500"
            />
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Category:</span>
                <select
                  value={newPostTag}
                  onChange={(e) => setNewPostTag(e.target.value)}
                  className="px-2 py-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-lg text-[11px] outline-none"
                >
                  <option value="Exam Prep & Geography">Exam Prep & Geography</option>
                  <option value="Collaborative Project">Collaborative Project</option>
                  <option value="Math Models">Math Models</option>
                  <option value="Inclusive study feedback">Inclusive study feedback</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                >
                  Post Thread
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800 pb-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Discussions
          </button>
          <button
            onClick={() => setActiveTab('prep')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${
              activeTab === 'prep'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Exam Revision
          </button>
          <button
            onClick={() => setActiveTab('collab')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${
              activeTab === 'collab'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Collaborations
          </button>
        </div>

        {/* Forum Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search posts, contents, schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List Threads */}
      <div className="space-y-4">
        {filteredPosts.map(post => {
          const hasLiked = post.likedBy?.includes(user.id);
          const isCommenting = activeCommentPostId === post.id;

          return (
            <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col gap-3">
              {/* Thread Creator */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100/50 text-emerald-600 dark:text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{post.authorName}</span>
                      {post.authorSchool && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          🏫 {post.authorSchool}
                        </span>
                      )}
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${getRoleLabelClass(post.authorRole)}`}>
                        {post.authorRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 dark:bg-slate-950 dark:border-slate-850 flex items-center gap-1 shadow-sm">
                    <Tag className="w-2.5 h-2.5 text-emerald-450" />
                    {post.subjectTag}
                  </span>
                  {user.role === 'Admin' && onDeletePost && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this forum thread permanently?')) {
                          onDeletePost(post.id);
                        }
                      }}
                      type="button"
                      title="Admin Control: Delete Thread"
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 select-text">{post.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-350 pr-4 mt-1 leading-relaxed whitespace-pre-wrap select-text">{post.content}</p>
              </div>

              {/* Likes & Comments tally and actions */}
              <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => onLikePost(post.id)}
                  type="button"
                  className={`flex items-center gap-1.5 font-semibold cursor-pointer py-1 px-2.5 rounded-xl transition ${
                    hasLiked 
                      ? 'bg-rose-50 border border-rose-100 text-rose-600'
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked && 'fill-rose-500'}`} />
                  <span>{post.likes} Likes</span>
                </button>

                <button
                  onClick={() => {
                    setActiveCommentPostId(isCommenting ? null : post.id);
                  }}
                  type="button"
                  className="flex items-center gap-1.5 font-semibold text-slate-500 hover:bg-slate-100 py-1 px-2.5 rounded-xl cursor-pointer transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comments.length} Comments</span>
                </button>
              </div>

              {/* Comments box */}
              {post.comments.length > 0 && (
                <div className="bg-slate-50/50 p-3 rounded-2xl gap-2 flex flex-col border border-slate-105/50 dark:bg-slate-950/20 dark:border-slate-850/50">
                  {post.comments.map(c => (
                    <div key={c.id} className="border-b border-slate-100 dark:border-slate-850 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 animate-fade-in">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200">{c.authorName}</span>
                          {c.authorSchool && (
                            <span className="text-[8px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-350 px-1 py-0.2 rounded flex items-center gap-0.5">
                              🏫 {c.authorSchool}
                            </span>
                          )}
                          <span className={`text-[8px] font-bold uppercase px-1.5 rounded-full ${getRoleLabelClass(c.authorRole)}`}>
                            {c.authorRole}
                          </span>
                          <span className="text-[9px] text-slate-400">{new Date(c.timestamp).toLocaleDateString()}</span>
                        </div>
                        {user.role === 'Admin' && onDeleteComment && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this user comment permanently?')) {
                                onDeleteComment(post.id, c.id);
                              }
                            }}
                            type="button"
                            title="Admin Control: Delete Comment"
                            className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 select-text pl-1 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Click Comment Input Box */}
              {isCommenting && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    placeholder="Contribute your guidance or question here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-250 dark:border-slate-850 rounded-xl text-xs dark:bg-slate-950 outline-none focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommentSubmit(post.id);
                    }}
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
