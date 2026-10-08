import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import ApiService from "../../services/api.js";
import { User, Mail, ShieldCheck, Save, ArrowLeft, MessageCircle, ExternalLink, Unlink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const role = String(user?.role || "USER").toUpperCase();
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const dashboardPath =
    role === "GUEST"
      ? "/guest/dashboard"
      : role === "OWNER"
        ? "/owner"
        : role === "ADMIN"
          ? "/admin"
          : role === "RECEPTIONIST"
            ? "/receptionist"
            : "/";

  const [name, setName] = useState(
    user?.name || user?.fullName || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramCode, setTelegramCode] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramError, setTelegramError] = useState("");

  const refreshTelegramStatus = async () => {
    setTelegramLoading(true);
    setTelegramError("");
    try {
      const status = await ApiService.getTelegramLinkStatus();
      setTelegramLinked(status.linked);
    } catch (err) {
      setTelegramError(err?.message || "Unable to check Telegram link status.");
    } finally {
      setTelegramLoading(false);
    }
  };

  useEffect(() => {
    refreshTelegramStatus();
  }, []);

  const handleCreateTelegramLink = async () => {
    setTelegramLoading(true);
    setTelegramError("");
    setTelegramCode(null);
    try {
      setTelegramCode(await ApiService.createTelegramLinkCode());
    } catch (err) {
      setTelegramError(err?.message || "Unable to create a Telegram link.");
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    setTelegramLoading(true);
    setTelegramError("");
    try {
      await ApiService.unlinkTelegramAccount();
      setTelegramLinked(false);
      setTelegramCode(null);
    } catch (err) {
      setTelegramError(err?.message || "Unable to unlink Telegram.");
    } finally {
      setTelegramLoading(false);
    }
  };

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

    setMessage(t('Profile information updated successfully.'));

    console.log("Updated user:", updatedUser);
  } catch (err) {
    console.error("Profile update error:", err);

    setError(
      err?.message || t('Failed to update profile.')
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
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 px-4 py-2 mb-5
                     bg-stone-700 hover:bg-stone-800
                     text-white rounded-xl text-sm font-semibold
                     transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Dashboard')}
        </button>

        <h1 className="text-2xl font-bold text-stone-900">
          {t('Update Profile')}
        </h1>

        <p className="text-sm text-stone-500 mt-1">
          {t('Update your account information')}
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
                {name || roleLabel}
              </h2>

              <p className="text-blue-100 text-sm">
                {email || "No email available"}
              </p>

              <div className="flex items-center gap-1 mt-2
                              text-xs text-blue-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                {role}
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
                {role}
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

      <section className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl
                          border border-stone-200 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-stone-900">Telegram chatbot</h2>
            <p className="mt-1 text-sm text-stone-600">
              Link Telegram to search guesthouses, ask the AI assistant, view role-authorized reservations, and receive booking updates.
            </p>
            {telegramError && (
              <p role="alert" className="mt-3 text-sm text-red-700">{telegramError}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {telegramLinked ? (
                <>
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                    Connected
                  </span>
                  <button
                    type="button"
                    onClick={handleUnlinkTelegram}
                    disabled={telegramLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTelegramLink}
                  disabled={telegramLoading}
                  className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
                >
                  {telegramLoading ? "Please wait..." : "Connect Telegram"}
                </button>
              )}
              <button
                type="button"
                onClick={refreshTelegramStatus}
                disabled={telegramLoading}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                Check connection
              </button>
            </div>
            {telegramCode && (
              <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm">
                <p className="font-semibold text-stone-800">
                  This one-time code expires at {new Date(telegramCode.expiresAt).toLocaleTimeString()}.
                </p>
                <p className="mt-1 text-stone-600">
                  {telegramCode.linkUrl
                    ? "Open the bot link to securely connect your account:"
                    : "In your Telegram bot chat, send /link followed by this code:"}
                </p>
                {telegramCode.linkUrl ? (
                  <a
                    href={telegramCode.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 font-semibold text-sky-800 underline"
                  >
                    Open Telegram bot <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <code className="mt-3 block break-all rounded bg-white p-3 font-mono text-stone-800">
                    {telegramCode.code}
                  </code>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}