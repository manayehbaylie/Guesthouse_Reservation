import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Building2, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react';

export function GuesthouseManage() {
  const { user, switchUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('Free Wi-Fi, Breakfast Included, Generator Backup');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function fetchProperty() {
      if (user?.guesthouseId) {
        const gh = await ApiService.getGuesthouseById(user.guesthouseId);
        if (gh) {
          setName(gh.name);
          setCity(gh.city);
          setLocation(gh.location);
          setDescription(gh.description);
          setAmenities(gh.amenities?.join(', ') || '');
        }
      }
    }
    fetchProperty();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      const amArray = amenities.split(',').map((s) => s.trim()).filter(Boolean);
      const registered = await ApiService.registerGuesthouse({
        name,
        city,
        location,
        description,
        amenities: amArray,
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
        ownerId: user.id,
      });

      setSuccess('Guesthouse submitted successfully! Pending Admin verification.');
      const updated = { ...user, guesthouseId: registered.id };
      switchUser(updated);
    } catch (err) {
      alert(err.message || 'Error saving guesthouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/owner')}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Owner Dashboard</span>
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Register / Edit Guesthouse</h1>
          <p className="text-xs text-stone-500">Provide property details for Admin approval and public guest discovery</p>
        </div>

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-stone-700 uppercase mb-1">Property Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bole Heights Villa Guesthouse"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 uppercase mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Bishoftu">Bishoftu</option>
                <option value="Bahir Dar">Bahir Dar</option>
                <option value="Lalibela">Lalibela</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 uppercase mb-1">Specific Location / Subcity</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bole Atlas, Near Edna Mall"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 uppercase mb-1">Property Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your guesthouse rooms, atmosphere, security, distance to airport..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-stone-700 uppercase mb-1">Amenities (Comma separated)</label>
            <input
              type="text"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="Free Wi-Fi, Breakfast Included, Generator Backup, Parking"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            {loading ? 'Submitting Property...' : 'Save & Submit Property for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}
