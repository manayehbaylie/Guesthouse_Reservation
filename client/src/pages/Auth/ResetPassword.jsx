import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { api } from "../../services/api.js";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.resetPassword(token, newPassword);
      setSuccess(response?.message || "Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1400);
    } catch (err) {
      setError(err?.message || "Unable to reset the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-amber-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl">
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="bg-gradient-to-r from-[#043658] to-[#0c4d75] px-6 py-7 text-white sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Secure</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">Create new password</h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#043658] shadow-lg shadow-amber-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-8 sm:px-8">
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-stone-800">
                New password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter a strong password"
                  className="h-14 w-full rounded-xl border border-stone-300 bg-stone-50 pl-12 pr-12 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-stone-800">
                Confirm password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  className="h-14 w-full rounded-xl border border-stone-300 bg-stone-50 pl-12 pr-12 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-amber-500 text-base font-black text-[#043658] shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#043658] border-t-transparent" />
                  Updating password...
                </>
              ) : (
                <>
                  Reset password
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-sm font-bold text-stone-700 transition hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
