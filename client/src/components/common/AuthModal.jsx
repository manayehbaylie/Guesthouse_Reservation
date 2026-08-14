import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { UserCheck, UserPlus, LogIn, Key, Shield, Building, User as UserIcon, Check } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onUserChanged }) => {
  const [tab, setTab] = useState('quick');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+251 9');
  const [role, setRole] = useState('Guest');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const allUsers = ApiService.getAllUsers();
  const currentUser = ApiService.getCurrentUser();

  const handleQuickSwitch = (user) => {
    ApiService.setCurrentUser(user);
    onUserChanged(user);
    onClose();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await ApiService.loginUser(email);
      onUserChanged(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await ApiService.registerUser({
        name,
        email,
        phone,
        role,
        // guesthouseId will be set when the owner creates their guesthouse
      });
      onUserChanged(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-6">
          <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> Account & Role Portal
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Log in, register, or switch roles to test Guest, Receptionist, Owner, and Admin views.
          </p>

          {/* Nav Tabs */}
          <div className="flex bg-stone-800 p-1 rounded-xl mt-4 text-xs font-semibold">
            <button
              onClick={() => setTab('quick')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tab === 'quick' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              Demo Quick Switch
            </button>
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tab === 'login' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tab === 'register' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 font-medium">
              {error}
            </div>
          )}

          {tab === 'quick' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wider mb-2">
                Available Pre-configured Accounts:
              </p>
              {allUsers.map((u) => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-white ${
                        u.role === 'Admin' ? 'bg-purple-600' :
                        u.role === 'Owner' ? 'bg-amber-700' :
                        u.role === 'Receptionist' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {u.role === 'Admin' ? <Shield className="w-4 h-4" /> :
                         u.role === 'Owner' ? <Building className="w-4 h-4" /> :
                         u.role === 'Receptionist' ? <UserCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          {u.name}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'Owner' ? 'bg-amber-100 text-amber-800' :
                            u.role === 'Receptionist' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500">{u.email}</div>
                      </div>
                    </div>
                    {isActive && <Check className="w-5 h-5 text-amber-700" />}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Girma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. samuel@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Guest">Guest (Book & Pay Online)</option>
                  <option value="Owner">Guesthouse Owner (Property Management)</option>
                  <option value="Receptionist">Receptionist (Front-Desk Staff)</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
