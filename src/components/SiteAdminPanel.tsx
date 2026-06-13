import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Trash2, Award, BookOpen, Clock, Mail, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface SiteAdminPanelProps {
  adminUser: UserProfile;
  isOffline: boolean;
}

export default function SiteAdminPanel({ adminUser, isOffline }: SiteAdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password reset modal/inline states
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    if (isOffline) {
      setError('Cannot load live user directory while offline.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?adminUserId=${adminUser.id}`);
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch registered user base.');
      }
    } catch (err) {
      setError('Network connection failure querying users roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [adminUser.id, isOffline]);

  const handleDeleteUser = async (userIdToDelete: string, userName: string) => {
    if (userIdToDelete === adminUser.id) {
      alert('Security policy violation: Cannot delete your own active administrative session.');
      return;
    }
    setSuccessMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/user/${userIdToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Account for ${userName} has been successfully purged.`);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to remove requested profile.');
      }
    } catch (err) {
      setError('Connection failure on administrative command pipeline.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUserId || !newPassword.trim()) return;
    setSuccessMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/user/${resettingUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminUser.id, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        const targetStudent = users.find(u => u.id === resettingUserId);
        setSuccessMessage(`Password successfully rewritten for ${targetStudent?.name || 'student'}.`);
        setResettingUserId(null);
        setNewPassword('');
      } else {
        setError(data.error || 'Failed to apply new credentials.');
      }
    } catch (err) {
      setError('Connection issue applying password override.');
    }
  };

  // Aggregated analytical summaries
  const studentUsers = users.filter(u => u.role !== 'Admin');
  const totalXP = studentUsers.reduce((sum, u) => sum + (u.userStats?.totalXP || 0), 0);
  const avgXP = studentUsers.length > 0 ? Math.round(totalXP / studentUsers.length) : 0;
  const topStudent = studentUsers.sort((a, b) => (b.userStats?.totalXP || 0) - (a.userStats?.totalXP || 0))[0];

  return (
    <div className="space-y-6" id="site-administrative-dashboard">
      
      {/* Admin header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>Site Administrative Cockpit</span>
              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/35 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin Level</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Direct oversight of content, profiles, and database persistence keys.</p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          type="button"
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition select-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading && 'animate-spin'}`} />
          <span>Reload Database Roster</span>
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-555/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-555" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-555/25 text-rose-605 dark:text-rose-400 text-xs font-semibold animate-fade-in flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-450">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Student Profiles</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{studentUsers.length} Users</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Average Student XP</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{avgXP} XP</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-955 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Classroom Leader</span>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-40 block">
              {topStudent ? `${topStudent.name} (${topStudent.userStats.totalXP} XP)` : 'No students registered'}
            </span>
          </div>
        </div>

      </div>

      {/* Roster database table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="p-5 border-b border-slate-250 dark:border-slate-800/80 flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-widest">Aegis Member Credentials Registry</h4>
          <span className="text-[10px] font-mono text-slate-400">Total Records: {users.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-bold text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Profile Name</th>
                <th className="py-3 px-4">Registered Email</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Progress XP</th>
                <th className="py-3 px-4 text-center">Security Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {users.map(u => {
                const isAdmin = u.role === 'Admin';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-555 font-bold uppercase text-[10px]">
                        {u.name ? u.name.substring(0, 2) : 'S'}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 tracking-tight">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-350">{u.school || 'Unspecified'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isAdmin 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {u.role || 'Student'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{u.userStats?.totalXP || 0} XP</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        
                        <button
                          onClick={() => setResettingUserId(u.id)}
                          type="button"
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                          title="Override user password directly"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`CRITICAL CONFIRMATION REQUIRED: Direct removal of student ${u.name}.\nThis wipes comments, thread posts, folders, and logins.\nAre you absolutely sure you want to write this deletion?`)) {
                              handleDeleteUser(u.id, u.name);
                            }
                          }}
                          type="button"
                          disabled={isAdmin}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer text-[10px] font-bold transition-all ${
                            isAdmin 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-40 cursor-not-allowed' 
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white'
                          }`}
                          title={isAdmin ? 'Protected system logins cannot be deleted' : 'Remove profile and user traces permanently'}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password override modal dialogue */}
      {resettingUserId && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleResetPasswordSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-sm space-y-4 shadow-xl">
            <h4 className="font-bold text-slate-850 dark:text-slate-100 text-xs tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-555" />
              <span>Administrative Password Override</span>
            </h4>
            
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Target Profile ID: <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded font-mono font-bold text-emerald-600">{resettingUserId}</code>
            </p>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">New Secret Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters recommended"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setResettingUserId(null);
                  setNewPassword('');
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Apply Overwrite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security alert box */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-[11px] flex gap-2.5 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Integrity Compliance Warning</span>
          All credentials, hash algorithms pbkdf2Sync (sha512 with 1000 iterations), and local file volumes (`data/encrypted_db.bin`) comply with Aegis academic storage definitions. Modifications made using this cockpit persist immediately. Do not abuse administrative controls.
        </div>
      </div>

    </div>
  );
}
