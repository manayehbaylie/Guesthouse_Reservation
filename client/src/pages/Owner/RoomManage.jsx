import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BedDouble, Plus, Trash2, CheckCircle2, ChevronLeft, ToggleLeft, ToggleRight, X, Edit } from 'lucide-react';

export function RoomManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guesthouseId, setGuesthouseId] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // New room modal / form state
  const [showForm, setShowForm] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [type, setType] = useState('SUITE');
  const [capacity, setCapacity] = useState(2);
  const [pricePerNight, setPricePerNight] = useState(2500);

  // Update room modal / form state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatingRoomId, setUpdatingRoomId] = useState(null);
  const [updateRoomNumber, setUpdateRoomNumber] = useState('');
  const [updateType, setUpdateType] = useState('SUITE');
  const [updateCapacity, setUpdateCapacity] = useState(2);
  const [updatePricePerNight, setUpdatePricePerNight] = useState(2500);
  const [updateAvailability, setUpdateAvailability] = useState(true);

  const loadGuesthouseAndRooms = async () => {
    setLoading(true);
    try {
      // First get the owner's guesthouse
      const gh = await ApiService.getMyGuesthouse();
      if (gh) {
        setGuesthouseId(gh.id);
        const list = await ApiService.getRoomsForGuesthouse(gh.id);
        setRooms(list);
      } else {
        setGuesthouseId(null);
        setRooms([]);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setGuesthouseId(null);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuesthouseAndRooms();
  }, []);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
     await ApiService.addRoom({
  guesthouseId,
  roomNumber,
  roomType: type,
  capacity: Number(capacity),
  price: Number(pricePerNight),
  available: true,
});
      setShowForm(false);
      setRoomNumber('');
      setType('SUITE');
      setCapacity(2);
      setPricePerNight(2500);
      loadGuesthouseAndRooms();
    } catch (err) {
      alert(err.message || 'Failed to add room');
    }
  };

 const handleToggleStatus = async (roomId, currentAvailable) => {
  const nextAvailable = !currentAvailable;

  try {
    await ApiService.updateRoomAvailability(
      roomId,
      nextAvailable
    );

    await loadGuesthouseAndRooms();
  } catch (err) {
    alert(err.message || 'Error updating room status');
  }
};

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    try {
      await ApiService.deleteRoom(roomId);
      loadGuesthouseAndRooms();
    } catch (err) {
      alert(err.message || 'Failed to delete room');
    }
  };

  const handleUpdateRoomClick = (room) => {
    setUpdatingRoomId(room.id);
    setUpdateRoomNumber(room.roomNumber);
    setUpdateType(room.type);
    setUpdateCapacity(room.capacity);
    setUpdatePricePerNight(room.pricePerNight);
setUpdateAvailability(room.available === true);
    setShowUpdateForm(true);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    try {
      await ApiService.updateRoom(updatingRoomId, {
        roomNumber: updateRoomNumber,
        roomType: updateType,
        capacity: Number(updateCapacity),
        price: Number(updatePricePerNight),
        available: updateAvailability,
      });
      setShowUpdateForm(false);
      setUpdatingRoomId(null);
      setUpdateRoomNumber('');
      setUpdateType('SUITE');
      setUpdateCapacity(2);
      setUpdatePricePerNight(2500);
      setUpdateAvailability(true);
      loadGuesthouseAndRooms();
    } catch (err) {
      alert(err.message || 'Failed to update room');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/owner')}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Owner Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Room Inventory Management</h1>
          <p className="text-xs text-stone-500">Configure room types, rates per night, and toggle live availability</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Add Room Form */}
      {showForm && (
        <form onSubmit={handleAddRoom} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4 text-xs font-semibold">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Add New Room</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-stone-700 uppercase mb-1">Room Number</label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="101"
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-stone-700 uppercase mb-1">Room Type</label>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                <option value="SINGLE">Single Room</option>
                <option value="DOUBLE">Double Room</option>
                <option value="TWIN">Twin Room</option>
                <option value="FAMILY">Family Room</option>
                <option value="SUITE">Suite</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-700 uppercase mb-1">Max Guests</label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-stone-700 uppercase mb-1">Price per Night (ETB)</label>
              <input
                type="number"
                required
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs"
            >
              Save Room
            </button>
          </div>
        </form>
      )}

      {/* Update Room Form */}
      {showUpdateForm && (
        <form onSubmit={handleUpdateRoom} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4 text-xs font-semibold">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Update Room</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-stone-700 uppercase mb-1">Room Number</label>
              <input
                type="text"
                required
                value={updateRoomNumber}
                onChange={(e) => setUpdateRoomNumber(e.target.value)}
                placeholder="101"
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-stone-700 uppercase mb-1">Room Type</label>
              <select
                required
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                <option value="SINGLE">Single Room</option>
                <option value="DOUBLE">Double Room</option>
                <option value="TWIN">Twin Room</option>
                <option value="FAMILY">Family Room</option>
                <option value="SUITE">Suite</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-700 uppercase mb-1">Max Guests</label>
              <input
                type="number"
                required
                value={updateCapacity}
                onChange={(e) => setUpdateCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block text-stone-700 uppercase mb-1">Price per Night (ETB)</label>
              <input
                type="number"
                required
                value={updatePricePerNight}
                onChange={(e) => setUpdatePricePerNight(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="updateAvailability"
              checked={updateAvailability}
              onChange={(e) => setUpdateAvailability(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="updateAvailability" className="text-stone-700">
              Room is available for booking
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowUpdateForm(false);
                setUpdatingRoomId(null);
                setUpdateRoomNumber('');
                setUpdateType('SUITE');
                setUpdateCapacity(2);
                setUpdatePricePerNight(2500);
                setUpdateAvailability(true);
              }}
              className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Update Room
            </button>
          </div>
        </form>
      )}

      {/* Room Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Room No.</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Capacity</th>
                <th className="px-6 py-3.5">Nightly Rate</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-bold text-stone-900">Room {room.roomNumber}</td>
                  <td className="px-6 py-4">{room.type}</td>
                  <td className="px-6 py-4">{room.capacity} Guests</td>
                  <td className="px-6 py-4 font-bold">{room.pricePerNight.toLocaleString()} ETB</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                       room.available === true
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                {room.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleUpdateRoomClick(room)}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg text-xs flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Update
                      </button>
                      <button
  onClick={() => handleToggleStatus(room.id, room.available)}
  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs"
>
  Toggle Availability
</button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
