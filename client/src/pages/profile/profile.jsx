import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import ApiService from "../../services/api.js";
import { User, Mail, ShieldCheck, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(
    user?.name || user?.fullName || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e) => {
  e.preventDefault();

  setLoading(true);
  setMessage("");
  setError("");

  try {
    const updatedUser = await ApiService.updateProfile({
      name,
      email,
      phone: user?.phone || "",
    });

    setMessage("Profile information updated successfully.");

    console.log("Updated user:", updatedUser);
  } catch (err) {
    console.error("Profile update error:", err);

    setError(
      err?.message || "Failed to update profile."
    );
  } finally {
    setLoading(false);
  }
};

  const firstLetter =
    name?.charAt(0)?.toUpperCase() || "R";

  return (
    <div className="min-h-screen bg-stone-100 p-6 md:p-8">

      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">

        <button
          type="button"
          onClick={() => navigate("/receptionist")}
          className="flex items-center gap-2 px-4 py-2 mb-5
                     bg-stone-700 hover:bg-stone-800
                     text-white rounded-xl text-sm font-semibold
                     transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-stone-900">
          Update Profile
        </h1>

        <p className="text-sm text-stone-500 mt-1">
          Update your receptionist account information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl
                      border border-stone-200 shadow-sm overflow-hidden">

        {/* Profile Header */}
        <div className="bg-blue-900 px-6 py-8">

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-full
                            bg-white flex items-center
                            justify-center text-blue-900
                            text-2xl font-bold">
              {firstLetter}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                {name || "Receptionist"}
              </h2>

              <p className="text-blue-100 text-sm">
                {email || "No email available"}
              </p>

              <div className="flex items-center gap-1 mt-2
                              text-xs text-blue-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                RECEPTIONIST
              </div>
            </div>

          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleUpdateProfile}
          className="p-6 space-y-6"
        >

          {/* Success */}
          {message && (
            <div className="bg-emerald-50 border border-emerald-200
                            text-emerald-800 px-4 py-3 rounded-xl
                            text-sm">
              {message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-800 px-4 py-3 rounded-xl
                            text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold
                              text-stone-700 mb-2">
              Full Name
            </label>

            <div className="relative">

              <User
                className="absolute left-3 top-1/2
                           -translate-y-1/2
                           w-4 h-4 text-stone-400"
              />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3
                           border border-stone-300
                           rounded-xl text-sm
                           focus:outline-none
                           focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your full name"
              />

            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold
                              text-stone-700 mb-2">
              Email Address
            </label>

            <div className="relative">

              <Mail
                className="absolute left-3 top-1/2
                           -translate-y-1/2
                           w-4 h-4 text-stone-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3
                           border border-stone-300
                           rounded-xl text-sm
                           focus:outline-none
                           focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your email"
              />

            </div>
          </div>

          {/* Role - Read Only */}
          <div>
            <label className="block text-sm font-semibold
                              text-stone-700 mb-2">
              Role
            </label>

            <div className="flex items-center gap-3
                            bg-stone-50 border
                            border-stone-200
                            rounded-xl px-4 py-3">

              <ShieldCheck className="w-5 h-5 text-blue-700" />

              <span className="text-sm font-bold
                               text-stone-700">
                RECEPTIONIST
              </span>

            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2
                         px-6 py-3
                         bg-blue-600 hover:bg-blue-700
                         disabled:opacity-60
                         text-white rounded-xl
                         text-sm font-bold
                         transition"
            >

              <Save className="w-4 h-4" />

              {loading
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </form>
      </div>
    </div>
  );
}