import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Bot, LoaderCircle, MapPin, Sparkles, UserRound } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { ApiService } from "../../services/api.js";

const SUGGESTIONS = [
  "Find a cheap double room for 2 people.",
  "How do I make a reservation?",
  "Show my bookings.",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hello. I can help you find approved guesthouses and available rooms, answer platform questions, or look up booking information you are authorized to see.",
};

function Recommendation({ guesthouse }) {
  const { t } = useLanguage();

  return (
    <article className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-stone-900">{guesthouse.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{guesthouse.city}</span>
          </p>
        </div>
        <span className="shrink-0 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
          {t("Approved")}
        </span>
      </div>
      <div className="divide-y divide-stone-100">
        {guesthouse.rooms.map((room) => (
          <div key={room.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="text-stone-700">
              {t(room.roomType)} · {room.capacity} {t("guests")}
            </span>
            <span className="font-semibold text-stone-900">ETB {room.price.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100 px-4 py-3">
        <Link
          to={`/guesthouse/${guesthouse.id}`}
          className="text-sm font-semibold text-stone-800 underline decoration-amber-500 underline-offset-4 hover:text-stone-950"
        >
          {t("View guesthouse")}
        </Link>
      </div>
    </article>
  );
}

export function Assistant() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState(() => [
    { ...INITIAL_MESSAGE, content: t(INITIAL_MESSAGE.content) },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endOfMessages = useRef(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendMessage = async (value = draft) => {
    const content = value.trim();
    if (!content || sending) return;

    const previousMessages = messages.filter((item) => item !== INITIAL_MESSAGE);
    setMessages((current) => [...current, { role: "user", content }]);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const result = await ApiService.chatWithAssistant({
        message: content,
        language,
        history: previousMessages.slice(-8).map(({ role, content: text }) => ({
          role,
          content: text,
        })),
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result?.reply || "I couldn't prepare a response. Please try again.",
          recommendations: Array.isArray(result?.recommendations) ? result.recommendations : [],
          mode: result?.mode,
        },
      ]);
    } catch (requestError) {
      setError(requestError?.message || "The assistant could not respond. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col bg-[#f5f8fa] px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-5 flex items-center gap-3 border-b border-stone-200 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#043658] text-amber-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t("Guesthouse Reservation Platform")}</p>
            <h1 className="text-xl font-bold text-stone-950">{t("AI Assistant")}</h1>
          </div>
          <span className="hidden rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-600 sm:inline-flex">
            {user?.role || "USER"}
          </span>
        </header>

        <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite" aria-label="Assistant conversation">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex gap-3 ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.role === "user" ? "bg-amber-100 text-stone-800" : "bg-[#043658] text-white"}`}>
                  {item.role === "user" ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[88%] space-y-3 sm:max-w-[78%] ${item.role === "user" ? "text-right" : ""}`}>
                  <p className={`whitespace-pre-wrap rounded-lg px-4 py-3 text-left text-sm leading-6 ${item.role === "user" ? "bg-[#043658] text-white" : "bg-stone-100 text-stone-800"}`}>
                    {item.content}
                  </p>
                  {item.recommendations?.length > 0 && (
                    <div className="grid gap-3 text-left sm:grid-cols-2">
                      {item.recommendations.map((guesthouse) => (
                        <Recommendation key={guesthouse.id} guesthouse={guesthouse} />
                      ))}
                    </div>
                  )}
                  {item.mode === "database" && (
                    <p className="px-1 text-left text-xs text-stone-500">
                      {t("Database mode: live listings and account-scoped booking answers.")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#043658] text-white"><Bot className="h-4 w-4" /></span>
                <span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> {t("Checking platform information…")}</span>
              </div>
            )}
            <div ref={endOfMessages} />
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-3 sm:px-6">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(t(suggestion))}
                  disabled={sending}
                  className="rounded-full border border-stone-300 bg-white px-3 py-2 text-left text-xs font-medium text-stone-700 transition hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50"
                >
                  {t(suggestion)}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="mx-4 mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:mx-6">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="border-t border-stone-200 p-3 sm:p-4">
            <label htmlFor="assistant-message" className="sr-only">{t("Ask the assistant")}</label>
            <div className="flex items-end gap-2 rounded-lg border border-stone-300 bg-white p-2 focus-within:border-[#043658] focus-within:ring-2 focus-within:ring-[#043658]/10">
              <textarea
                id="assistant-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                maxLength={2000}
                rows={1}
                placeholder={t("Ask about rooms, guesthouses, bookings…")}
                className="max-h-32 min-h-10 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send message"
                title="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#043658] text-white transition hover:bg-[#0b2f4a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-stone-500">{t("Verify reservation details in your dashboard before making changes.")}</p>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}