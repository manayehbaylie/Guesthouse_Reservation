import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, UserPlus, Shield, ChevronLeft, Trash2 } from 'lucide-react';

export function StaffManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guesthouseId, setGuesthouseId] = useState(null);

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+251 9');

  const loadStaff = async () => {
    setLoading(true);
    try {
      // First get the owner's guesthouse
      const gh = await ApiService.getMyGuesthouse();
      if (gh) {
        setGuesthouseId(gh.id);
        // Use the owner-specific endpoint to get assigned receptionists
        const staff = await ApiService.getOwnerReceptionists(gh.id);
        setStaffList(staff);
      } else {
        setGuesthouseId(null);
        setStaffList([]);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      setGuesthouseId(null);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await ApiService.registerReceptionist({
        name,
        email,
        phone,
        guesthouseId,
      });
      setName('');
      setEmail('');
      setPhone('+251 9');
      loadStaff();
    } catch (err) {
      alert(err.message || 'Error registering receptionist staff');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to remove this receptionist from your guesthouse? This action cannot be undone.')) {
      return;
    }
    try {
      await ApiService.removeReceptionistFromGuesthouse(staffId);
      loadStaff();
    } catch (err) {
      alert(err.message || 'Error removing receptionist');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/owner')}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Owner Dashboard</span>
      </button>

      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Front-Desk Staff Management</h1>
          <p className="text-xs text-stone-500">Register and assign Receptionists to operate front-desk check-in consoles</p>
        </div>

        {/* Register Staff Form */}
        <form onSubmit={handleCreateStaff} className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Register New Receptionist</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tigist Alemu"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-stone-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="receptionist@example.com"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-stone-600 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow-xs"
          >
            Create Staff Account
          </button>
        </form>

        {/* Staff Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Current Assigned Receptionists</h3>
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white text-xs">
            {staffList.map((st) => (
              <div key={st.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">{st.fullName || st.name}</div>
                  <div className="text-stone-500">{st.email} • {st.phone}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    Receptionist
                  </span>
                  <button
                    onClick={() => handleDeleteStaff(Number(st.id))}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
