import React from 'react';
import { ApiService } from '../../services/api';
import {
  Building2,
  Search,
  CalendarCheck,
  UserCheck,
  Building,
  Shield,
  Server,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';

export const Header = ({
  currentUser,
  activeView,
  onSelectView,
  onOpenAuthModal,
  onOpenBackendConfig,
}) => {
  const role = currentUser?.role || 'Guest';

  const handleQuickSwitchRole = (targetRole) => {
    const allUsers = ApiService.getAllUsers();
    const userToSet = allUsers.find((u) => u.role === targetRole) || allUsers[0];
    ApiService.setCurrentUser(userToSet);
    
    // Automatically switch view based on role
    if (targetRole === 'Guest') onSelectView('search');
    else if (targetRole === 'Receptionist') onSelectView('receptionist-dashboard');
    else if (targetRole === 'Owner') onSelectView('owner-dashboard');
    else if (targetRole === 'Admin') onSelectView('admin-dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('search')}>
            <div className="p-2 bg-gradient-to-tr from-amber-700 to-amber-500 rounded-xl shadow-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-amber-100 tracking-wide">Ethio Guesthouse</span>
                <span className="hidden sm:inline-block text-[10px] bg-amber-900/60 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-700/50">
                  SRS System
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-none">Reservations, Payments & Governance Platform</p>
            </div>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center gap-1">
            
            {/* Guest Navigation */}
            {role === 'Guest' && (
              <>
                <button
                  onClick={() => onSelectView('search')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'search' || activeView === 'details'
                      ? 'bg-amber-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Search className="w-4 h-4 text-amber-400" /> Browse Guesthouses
                </button>
                <button
                  onClick={() => onSelectView('guest-bookings')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'guest-bookings'
                      ? 'bg-amber-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-amber-400" /> My Bookings
                </button>
              </>
            )}

            {/* Receptionist Navigation */}
            {role === 'Receptionist' && (
              <>
                <button
                  onClick={() => onSelectView('receptionist-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'receptionist-dashboard'
                      ? 'bg-blue-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-400" /> Front Desk Operations
                </button>
                <button
                  onClick={() => onSelectView('search')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'search'
                      ? 'bg-amber-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Search className="w-4 h-4 text-stone-400" /> View Listings
                </button>
              </>
            )}

            {/* Owner Navigation */}
            {role === 'Owner' && (
              <>
                <button
                  onClick={() => onSelectView('owner-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'owner-dashboard'
                      ? 'bg-amber-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Building className="w-4 h-4 text-amber-400" /> Property & Revenue
                </button>
                <button
                  onClick={() => onSelectView('search')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'search'
                      ? 'bg-amber-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Search className="w-4 h-4 text-stone-400" /> Search All
                </button>
              </>
            )}

            {/* Admin Navigation */}
            {role === 'Admin' && (
              <>
                <button
                  onClick={() => onSelectView('admin-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'admin-dashboard'
                      ? 'bg-purple-900/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-400" /> Admin Oversight
                </button>
                <button
                  onClick={() => onSelectView('search')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'search'
                      ? 'bg-amber-800/80 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Search className="w-4 h-4 text-stone-400" /> Browse Guesthouses
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Backend API Config Modal Trigger */}
            <button
              onClick={onOpenBackendConfig}
              className="p-2 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-colors border border-stone-800"
              title="Backend Integration & API settings"
            >
              <Server className="w-4 h-4" />
            </button>

            {/* Account & Role Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2.5 bg-stone-800 hover:bg-stone-700/80 border border-stone-700/80 px-3 py-1.5 rounded-xl transition-all text-left"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                role === 'Admin' ? 'bg-purple-600' :
                role === 'Owner' ? 'bg-amber-700' :
                role === 'Receptionist' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {role.slice(0, 1)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-stone-100 flex items-center gap-1">
                  {currentUser?.name || 'Guest User'}
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </div>
                <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  Role: <span className="uppercase font-bold">{role}</span>
                </div>
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* Role Switcher Quick Bar */}
      <div className="bg-stone-950 border-t border-stone-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              1-Click Persona:
            </span>

            <button
              onClick={() => handleQuickSwitchRole('Guest')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                role === 'Guest'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-800/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UserIcon className="w-3 h-3" />
              <span>Guest</span>
            </button>

            <button
              onClick={() => handleQuickSwitchRole('Receptionist')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                role === 'Receptionist'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-stone-800/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>Receptionist</span>
            </button>

            <button
              onClick={() => handleQuickSwitchRole('Owner')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                role === 'Owner'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-stone-800/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>Owner</span>
            </button>

            <button
              onClick={() => handleQuickSwitchRole('Admin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                role === 'Admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-stone-800/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-amber-300 font-mono bg-amber-950/40 border border-amber-800/30 px-2.5 py-0.5 rounded-full">
            <span>📅 Today: Hamle 30, 2018 E.C. (Aug 06, 2026)</span>
          </div>

        </div>
      </div>

      {/* Mobile view bar */}
      <div className="md:hidden flex bg-stone-950 px-4 py-2 border-t border-stone-800 justify-around text-xs font-medium">
        <button
          onClick={() => onSelectView('search')}
          className={`px-3 py-1 rounded ${activeView === 'search' ? 'bg-amber-800 text-white' : 'text-stone-400'}`}
        >
          Search
        </button>
        {role === 'Guest' && (
          <button
            onClick={() => onSelectView('guest-bookings')}
            className={`px-3 py-1 rounded ${activeView === 'guest-bookings' ? 'bg-amber-800 text-white' : 'text-stone-400'}`}
          >
            My Bookings
          </button>
        )}
        {role === 'Receptionist' && (
          <button
            onClick={() => onSelectView('receptionist-dashboard')}
            className={`px-3 py-1 rounded ${activeView === 'receptionist-dashboard' ? 'bg-blue-800 text-white' : 'text-stone-400'}`}
          >
            Front Desk
          </button>
        )}
        {role === 'Owner' && (
          <button
            onClick={() => onSelectView('owner-dashboard')}
            className={`px-3 py-1 rounded ${activeView === 'owner-dashboard' ? 'bg-amber-800 text-white' : 'text-stone-400'}`}
          >
            Property
          </button>
        )}
        {role === 'Admin' && (
          <button
            onClick={() => onSelectView('admin-dashboard')}
            className={`px-3 py-1 rounded ${activeView === 'admin-dashboard' ? 'bg-purple-900 text-white' : 'text-stone-400'}`}
          >
            Admin Oversight
          </button>
        )}
      </div>
    </header>
  );
};
