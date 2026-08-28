import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Building2, MapPin, CheckCircle2, ChevronLeft, Upload } from 'lucide-react';

export function GuesthouseManage() {
  const { user, switchUser } = useAuth();
  const navigate = useNavigate();
  const { api } = ApiService;

  const [name, setName] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [location, setLocation] = useState('');
  const [subCity, setSubCity] = useState('');
  const [woreda, setWoreda] = useState('');
  const [guesthousePhone, setGuesthousePhone] = useState('');
  const [guesthouseEmail, setGuesthouseEmail] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('Free Wi-Fi, Breakfast Included, Generator Backup');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseDocument, setLicenseDocument] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [existingGuesthouse, setExistingGuesthouse] = useState(null);

  useEffect(() => {
  async function fetchProperty() {
    try {
      const gh = await ApiService.getMyGuesthouse();

      if (gh) {
        setExistingGuesthouse(gh);
        setName(gh.name || '');
        setCity(gh.city || 'Addis Ababa');
        setLocation(gh.location || '');
        setSubCity(gh.subCity || '');
        setWoreda(gh.woreda || '');
        setGuesthousePhone(gh.phone || '');
        setGuesthouseEmail(gh.email || '');
        setNumberOfRooms(gh.numberOfRooms || '');
        setDescription(gh.description || '');
        setLicenseNumber(gh.licenseNumber || '');
        setAmenities(gh.amenities?.join(', ') || '');
      }
    } catch (error) {
      console.error("Failed to load my guesthouse:", error);
    }
  }

  if (user?.role === 'OWNER') {
    fetchProperty();
  }
}, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      const amArray = amenities.split(',').map((s) => s.trim()).filter(Boolean);

      const data = {
        name,
        city,
        address: location,
        subCity,
        woreda,
        phone: guesthousePhone,
        email: guesthouseEmail,
        numberOfRooms,
        description,
        licenseNumber,
        licenseDocument,
        photos,
      };

      if (existingGuesthouse) {
        await ApiService.saveGuesthouseDraft(data);
        setSuccess('Guesthouse draft saved successfully.');
      } else {
        const registered = await ApiService.registerGuesthouse(data);
        setExistingGuesthouse(registered);
        setSuccess('Guesthouse draft saved successfully. Submit it when all verification information is ready.');
        switchUser({ ...user, guesthouseId: registered.id });
      }
    } catch (err) {
      alert(err.message || 'Error saving guesthouse');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    setSuccess(null);

    try {
      const data = {
        name,
        city,
        address: location,
        subCity,
        woreda,
        phone: guesthousePhone,
        email: guesthouseEmail,
        numberOfRooms,
        description,
        licenseNumber,
        licenseDocument,
        photos,
      };

      if (!existingGuesthouse) {
        await ApiService.registerGuesthouse(data);
      }

      const updated = await ApiService.submitGuesthouseForReview(data);
      setExistingGuesthouse(updated);
      setSuccess('Guesthouse submitted for administrator review.');
    } catch (err) {
      alert(err.message || 'Error submitting guesthouse');
    } finally {
      setLoading(false);
    }
  };

  const status = String(existingGuesthouse?.status || 'draft').toLowerCase();

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
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Guesthouse Registration</h1>
          <p className="text-xs text-stone-500">Save a draft, then submit complete information for administrator verification.</p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
          <span className="text-xs font-bold text-stone-600">Status</span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">{status.replace('_', ' ')}</span>
        </div>

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {status === 'rejected' && existingGuesthouse?.rejectionReason && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <strong>Administrator rejection reason:</strong> {existingGuesthouse.rejectionReason}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['name', 'Guesthouse Name', name, setName, 'text'],
              ['location', 'Address', location, setLocation, 'text'],
              ['subCity', 'Sub-city', subCity, setSubCity, 'text'],
              ['woreda', 'Woreda', woreda, setWoreda, 'text'],
              ['guesthousePhone', 'Phone', guesthousePhone, setGuesthousePhone, 'tel'],
              ['guesthouseEmail', 'Email', guesthouseEmail, setGuesthouseEmail, 'email'],
              ['numberOfRooms', 'Number of Rooms', numberOfRooms, setNumberOfRooms, 'number'],
              ['licenseNumber', 'Business/License Number', licenseNumber, setLicenseNumber, 'text'],
            ].map(([, label, value, setter, type]) => (
              <div key={label}>
                <label className="block text-stone-700 uppercase mb-1">{label}</label>
                <input type={type} min={type === 'number' ? 1 : undefined} value={value} onChange={(e) => setter(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-stone-700 uppercase mb-1">City</label>
            <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <label className="block text-stone-700 uppercase mb-1">Description</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <label className="block text-stone-700 uppercase mb-1">License Document</label>
            <label className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-stone-300 cursor-pointer">
              <Upload className="w-4 h-4 text-stone-500" />
              <span>{licenseDocument?.name || existingGuesthouse?.licenseDocument || 'Choose PDF or image'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setLicenseDocument(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-stone-700 uppercase mb-1">Guesthouse Photos</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []))} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300" />
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-stone-100">
            <button type="submit" disabled={loading} className="px-5 py-3 bg-stone-100 text-stone-900 font-black text-xs rounded-xl">Save Draft</button>
            <button type="button" disabled={loading || status === 'pending'} onClick={handleSubmitForReview} className="px-5 py-3 bg-amber-500 text-stone-950 font-black text-xs rounded-xl">
              {status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
