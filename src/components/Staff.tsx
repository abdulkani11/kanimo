import React, { useEffect, useState } from 'react';
import { 
  UserPlus, Trash2, Shield, Key, Mail, CheckCircle2, AlertCircle, Eye, Edit, Plus, X 
} from 'lucide-react';

interface StaffUser {
  email: string;
  role: 'admin' | 'cashier' | 'user';
}

export default function Staff() {
  const [usersList, setUsersList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier' | 'user'>('user');

  // Delete confirmations
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Load all users
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setMessage({ type: 'error', text: 'Please fill out all fields.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Staff user "${email}" registered successfully.` });
        setEmail('');
        setPassword('');
        setRole('user');
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Registration failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Unable to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !role) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(selectedUser.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, password: password || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Staff account "${selectedUser.email}" updated successfully.` });
        setPassword('');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Unable to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Staff account "${userEmail}" deleted successfully.` });
        setConfirmDelete(null);
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete user.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to server.' });
    }
  };

  const openAddModal = () => {
    setEmail('');
    setPassword('');
    setRole('user');
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: StaffUser) => {
    setSelectedUser(user);
    setRole(user.role);
    setPassword('');
    setIsEditModalOpen(true);
  };

  const openReviewModal = (user: StaffUser) => {
    setSelectedUser(user);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {message && (
        <div 
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-semibold animate-fade-in shadow-sm ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-455'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">×</button>
        </div>
      )}

      {/* Users List Table Card (Full Width) */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Active Staff Registry</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Authorized users list</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-850 rounded-xl text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              {usersList.length} Accounts
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Staff
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-750">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-750 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Email Coordinates</th>
                <th className="px-5 py-3 text-center">Privilege Role</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-xs">
              {usersList.map((user) => {
                const isAdminRole = user.role === 'admin';
                const isCashierRole = user.role === 'cashier';

                return (
                  <tr key={user.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {user.email}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${
                        isAdminRole 
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' 
                          : isCashierRole
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isAdminRole ? 'bg-amber-500' : isCashierRole ? 'bg-blue-500' : 'bg-slate-400'
                        }`}></span>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmDelete === user.email ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mr-2 font-mono">Confirm?</span>
                          <button
                            onClick={() => handleDelete(user.email)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openReviewModal(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                            title="Review account credentials & logs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-450 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                            title="Update privilege role / reset password"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setConfirmDelete(user.email)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-all cursor-pointer"
                            title="Delete User staff account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: Register/Insert Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Register New Staff</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Create application credentials</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@noble.com"
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Secure Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Privilege Level</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                  >
                    <option value="user">👤 User / Agent</option>
                    <option value="cashier">💵 Finance Cashier</option>
                    <option value="admin">🔑 System Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Register User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 2: Edit/Update Staff Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Update Staff Account</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Modify credentials & permissions</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Email Address</label>
                <input 
                  type="email" 
                  value={selectedUser.email}
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 pl-4 pr-4 py-2.5 text-xs rounded-xl font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Reset Password (Optional)</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Privilege Level</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                  >
                    <option value="user">👤 User / Agent</option>
                    <option value="cashier">💵 Finance Cashier</option>
                    <option value="admin">🔑 System Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Updates'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 3: Review Staff Details Modal */}
      {isReviewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Review Staff Profile</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Credentials verification</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-750 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-450 uppercase tracking-wider text-[9px] font-mono">User Email</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{selectedUser.email}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-450 uppercase tracking-wider text-[9px] font-mono">Privilege Level</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
                    selectedUser.role === 'admin' 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 text-amber-700 dark:text-amber-400' 
                      : selectedUser.role === 'cashier'
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-250 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-250 text-slate-700 dark:text-slate-350'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-450 uppercase tracking-wider text-[9px] font-mono">Account Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> ACTIVE
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-450 uppercase tracking-wider text-[9px] font-mono">Security Check</span>
                  <span className="font-bold text-slate-500 font-mono">Amadeus Satellite GDS Authorized</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
                * To change permissions or reset password for this user, close this modal and click the "Edit" button in the Actions column.
              </div>

              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-sm mt-4 text-center"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
