import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { api } from "../../services/api.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.forgotPassword(email);
      const message = response?.message || "If an account exists for that email, a reset link has been sent.";

      setSuccess(message);

      if (response?.resetToken) {
        setTimeout(() => {
          navigate(`/reset-password?token=${encodeURIComponent(response.resetToken)}`);
        }, 900);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong while sending the reset link.");
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
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Security</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">Reset password</h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#043658] shadow-lg shadow-amber-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-8 sm:px-8">
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-600">
                Enter the email address linked to your account and we’ll send a secure reset link.
              </p>
            </div>

            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-sm font-bold text-stone-800">
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-14 w-full rounded-xl border border-stone-300 bg-stone-50 pl-12 pr-4 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
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
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-amber-500 text-base font-black text-[#043658] shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#043658] border-t-transparent" />
                  Sending link...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 font-bold text-stone-700 transition hover:text-stone-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>

              <Link to="/register" className="font-bold text-amber-600 hover:text-amber-700">
                Create account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
