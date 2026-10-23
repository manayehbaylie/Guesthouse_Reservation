import React, { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, MessageCircle, Unlink } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function TelegramLinkCard() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const linkRequested = searchParams.get("telegram") === "link";
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramCode, setTelegramCode] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramError, setTelegramError] = useState("");
  const [telegramMessage, setTelegramMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [pollUntil, setPollUntil] = useState(null);

  const refreshTelegramStatus = async () => {
    setTelegramLoading(true);
    setTelegramError("");
    try {
      const status = await ApiService.getTelegramLinkStatus();
      setTelegramLinked(status.linked);
    } catch (error) {
      setTelegramError(error?.message || t("Unable to check Telegram link status."));
    } finally {
      setTelegramLoading(false);
    }
  };

  useEffect(() => {
    void refreshTelegramStatus();
  }, []);

  useEffect(() => {
    if (!pollUntil || telegramLinked) return undefined;
    let checking = false;
    const interval = window.setInterval(async () => {
      if (Date.now() >= pollUntil) {
        setPollUntil(null);
        return;
      }
      if (checking) return;
      checking = true;
      try {
        const status = await ApiService.getTelegramLinkStatus();
        if (status.linked) {
          setTelegramLinked(true);
          setTelegramCode(null);
          setTelegramMessage(t("Telegram connected successfully."));
          setPollUntil(null);
        }
      } catch {
        // Keep polling until the two-minute window expires.
      } finally {
        checking = false;
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [pollUntil, telegramLinked, t]);

  const createTelegramLink = async () => {
    setTelegramLoading(true);
    setTelegramError("");
    setTelegramMessage("");
    setTelegramCode(null);
    setCopied(false);
    setPollUntil(null);
    const telegramWindow = window.open("about:blank", "_blank");
    if (telegramWindow) telegramWindow.opener = null;

    try {
      const link = await ApiService.createTelegramLinkCode();
      setTelegramCode(link);
      setPollUntil(Date.now() + 2 * 60 * 1000);
      if (link.linkUrl && telegramWindow) {
        telegramWindow.location.replace(link.linkUrl);
        setTelegramMessage(t("Telegram opened. You can also send /link <code> to the bot."));
      } else {
        telegramWindow?.close();
        setTelegramMessage("");
      }
    } catch (error) {
      setPollUntil(null);
      telegramWindow?.close();
      setTelegramError(error?.message || t("Unable to create a Telegram link."));
    } finally {
      setTelegramLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    setTelegramLoading(true);
    setTelegramError("");
    setTelegramMessage("");
    try {
      await ApiService.unlinkTelegramAccount();
      setPollUntil(null);
      setTelegramLinked(false);
      setTelegramCode(null);
      setTelegramMessage(t("Telegram has been disconnected from your account."));
    } catch (error) {
      setTelegramError(error?.message || t("Unable to unlink Telegram."));
    } finally {
      setTelegramLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(telegramCode.code);
      setCopied(true);
      setTelegramError("");
    } catch {
      setTelegramError(t("Unable to copy the code. Select and copy it manually."));
    }
  };

  return (
    <section className={`rounded-xl border bg-stone-50 p-4 sm:p-5 ${linkRequested && !telegramLinked ? "border-sky-500 ring-2 ring-sky-200" : "border-stone-200"}`} aria-labelledby="telegram-link-heading">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-sky-100 p-2.5 text-sky-800">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="telegram-link-heading" className="font-bold text-stone-900">{t("Telegram")}</h3>
          <p className="mt-1 text-sm text-stone-600">
            {t("Connect your Telegram account to use the assistant and receive booking updates.")}
          </p>
          {linkRequested && !telegramLinked && (
            <p role="status" className="mt-2 text-sm font-semibold text-sky-900">
              {t("Connect Telegram here to finish linking your account.")}
            </p>
          )}

          {telegramError && <p role="alert" className="mt-3 text-sm text-red-700">{telegramError}</p>}
          {telegramMessage && <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{telegramMessage}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {telegramLoading && !telegramCode ? (
              <span className="inline-flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("Checking connection...")}
              </span>
            ) : telegramLinked ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                  {t("Connected")} ✅
                </span>
                <button
                  type="button"
                  onClick={unlinkTelegram}
                  disabled={telegramLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
                >
                  <Unlink className="h-4 w-4" /> {t("Disconnect")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={createTelegramLink}
                disabled={telegramLoading}
                className="rounded-lg bg-sky-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900 disabled:opacity-60"
              >
                {telegramLoading ? t("Please wait...") : t("Connect Telegram")}
              </button>
            )}
            <button
              type="button"
              onClick={refreshTelegramStatus}
              disabled={telegramLoading}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {t("Check connection")}
            </button>
          </div>

          {telegramCode && (
            <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-800">
                {t("Or send /link <code> to the bot. Expires in 10 minutes.")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-md bg-stone-100 px-3 py-2 font-mono text-sm text-stone-900">
                  {telegramCode.code}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  aria-label={t("Copy Telegram link code")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("Copied") : t("Copy code")}
                </button>
              </div>
              {telegramCode.linkUrl && (
                <a
                  href={telegramCode.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 underline"
                >
                  {t("Open Telegram bot")} <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}