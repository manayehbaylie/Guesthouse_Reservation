import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Mail, Phone, ShieldCheck } from "lucide-react";
import { api } from "../../services/api.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const normalizePhone = (value) => {
  const compact = value.trim().replace(/[\s\-()]/g, "");
  if (/^09\d{8}$/.test(compact)) return `+251${compact.slice(1)}`;
  if (/^9\d{8}$/.test(compact)) return `+251${compact}`;
  if (/^2519\d{8}$/.test(compact)) return `+${compact}`;
  return compact;
};

export function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [method, setMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState("request");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const otpRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async (event) => {
    event.preventDefault();
    setError("");
    const normalized = method === "phone" ? normalizePhone(identifier) : identifier.trim();
    if (!normalized) {
      setError(method === "email" ? t("Please enter your email address.") : t("Please enter your phone number."));
      return;
    }
    if (method === "phone" && !/^\+2519\d{8}$/.test(normalized)) {
      setError(t("Please enter a valid Ethiopian phone number."));
      return;
    }
    if (method === "email" && !/^(?=.{6,30}(?:\+[^@]+)?@)[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:\.[a-z0-9]+)*)?@(gmail\.com|googlemail\.com)$/i.test(normalized)) {
      setError(t("Please enter a valid Gmail address."));
      return;
    }
    setLoading(true);
    try {
      const response = await api.forgotPassword(normalized, method);
      setChallengeId(response.challengeId);
      setSuccess(t("If the account exists, a code has been sent."));
      setStep("code");
      setCooldown(60);
    } catch (requestError) {
      setError(requestError.message || t("Unable to request a reset code."));
    } finally {
      setLoading(false);
    }
  };

  const setOtpValue = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(-6);
    if (digits.length > 1) {
      const next = Array(6).fill("");
      digits.split("").forEach((digit, digitIndex) => { next[digitIndex] = digit; });
      setCode(next);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const next = [...code];
    next[index] = digits;
    setCode(next);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setError("");
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError(t("Enter the 6-digit code."));
      return;
    }
    setLoading(true);
    try {
      const response = await api.verifyPasswordResetCode(challengeId, fullCode);
      setResetToken(response.resetToken);
      setStep("password");
      setSuccess("");
    } catch (verifyError) {
      setError(verifyError.message || t("Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await api.resendPasswordResetCode(challengeId);
      setCode(Array(6).fill(""));
      setCooldown(60);
      setSuccess(t("If the account exists, a code has been sent."));
      otpRefs.current[0]?.focus();
    } catch (resendError) {
      setError(resendError.message || t("Unable to resend the code."));
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError(t("Use at least 8 characters, including a letter and a number."));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("Passwords do not match."));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(resetToken, newPassword, confirmPassword);
      setStep("done");
      setSuccess(t("Password reset successfully."));
    } catch (resetError) {
      setError(resetError.message || t("Unable to reset the password."));
    } finally {
      setLoading(false);
    }
  };

  const heading = step === "request" ? t("Reset password") : step === "code" ? t("Enter verification code") : step === "password" ? t("Create new password") : t("Password reset complete");

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-amber-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl">
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="bg-gradient-to-r from-[#043658] to-[#0c4d75] px-6 py-7 text-white sm:px-8">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">{t("Security")}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{heading}</h1></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#043658]"><ShieldCheck className="h-6 w-6" /></div></div>
          </div>

          {step === "request" && <form onSubmit={requestCode} className="space-y-6 px-6 py-8 sm:px-8">
            <p className="text-sm font-medium text-stone-600">{t("Enter the email or phone number linked to your account.")}</p>
            <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1" role="tablist" aria-label={t("Recovery method")}>
              {["email", "phone"].map((entry) => <button key={entry} type="button" role="tab" aria-selected={method === entry} onClick={() => { setMethod(entry); setIdentifier(""); setError(""); }} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold ${method === entry ? "bg-white text-[#043658] shadow-sm" : "text-stone-600"}`}>{entry === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}{t(entry === "email" ? "Email" : "Phone")}</button>)}
            </div>
            <label htmlFor="forgot-identifier" className="block text-sm font-bold text-stone-800">{t(method === "email" ? "Email address" : "Phone Number")}<input id="forgot-identifier" type={method === "email" ? "email" : "tel"} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={method === "email" ? "you@gmail.com" : "+251 9XX XXX XXX"} autoComplete={method === "email" ? "email" : "tel"} required className="mt-2 h-14 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" /></label>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-amber-500 font-black text-[#043658] disabled:opacity-70">{loading ? t("Sending code...") : <>{t("Send reset code")}<ArrowRight className="h-5 w-5" /></>}</button>
          </form>}

          {step === "code" && <form onSubmit={verifyCode} className="space-y-6 px-6 py-8 sm:px-8">
            <p className="text-sm font-medium text-stone-600">{t("Enter the 6-digit code sent to your account.")}</p>
            <div className="flex justify-between gap-2 sm:gap-3" dir="ltr">{code.map((digit, index) => <input key={index} ref={(element) => { otpRefs.current[index] = element; }} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} pattern="[0-9]*" maxLength={6} aria-label={`${t("Digit")} ${index + 1}`} value={digit} onChange={(event) => setOtpValue(index, event.target.value)} onKeyDown={(event) => { if (event.key === "Backspace" && !code[index] && index > 0) otpRefs.current[index - 1]?.focus(); }} onPaste={(event) => { event.preventDefault(); setOtpValue(index, event.clipboardData.getData("text")); }} className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 text-center text-xl font-black text-[#043658] outline-none focus:border-amber-500 sm:h-14" />)}</div>
            {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-amber-500 font-black text-[#043658] disabled:opacity-70">{loading ? t("Checking code...") : <>{t("Verify code")}<ArrowRight className="h-5 w-5" /></>}</button>
            <div className="flex justify-between text-sm"><button type="button" disabled={cooldown > 0 || loading} onClick={resendCode} className="font-bold text-amber-700 disabled:text-stone-400">{cooldown ? `${t("Resend code in")} ${cooldown}s` : t("Resend code")}</button><button type="button" onClick={() => { setStep("request"); setError(""); setSuccess(""); }} className="font-bold text-stone-600">{t("Change account")}</button></div>
          </form>}

          {step === "password" && <form onSubmit={submitPassword} className="space-y-6 px-6 py-8 sm:px-8">
            <p className="text-sm font-medium text-stone-600">{t("Use at least 8 characters, including a letter and a number.")}</p>
            <label className="block text-sm font-bold text-stone-800">{t("New password")}<span className="relative mt-2 block"><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="h-14 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 pr-12 outline-none focus:border-amber-500" /><button type="button" aria-label={t(showPassword ? "Hide password" : "Show password")} onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
            <label className="block text-sm font-bold text-stone-800">{t("Confirm password")}<span className="relative mt-2 block"><input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="h-14 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 pr-12 outline-none focus:border-amber-500" /><button type="button" aria-label={t(showConfirmPassword ? "Hide password" : "Show password")} onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center rounded-xl bg-amber-500 font-black text-[#043658] disabled:opacity-70">{loading ? t("Updating password...") : t("Reset password")}</button>
          </form>}

          {step === "done" && <div className="space-y-6 px-6 py-8 sm:px-8"><div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div><button type="button" onClick={() => navigate("/login", { replace: true })} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-amber-500 font-black text-[#043658]">{t("Go to login")}<ArrowRight className="h-5 w-5" /></button></div>}

          <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-6 py-4 text-sm sm:px-8"><button type="button" onClick={() => navigate("/login")} className="inline-flex items-center gap-2 font-bold text-stone-700"><ArrowLeft className="h-4 w-4" />{t("Back to login")}</button><Link to="/register" className="font-bold text-amber-600">{t("Create account")}</Link></div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
