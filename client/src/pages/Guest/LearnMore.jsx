import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

const guestSteps = [
  {
    icon: Search,
    title: "Find a stay",
    description: "Browse approved guesthouses and compare locations, rooms, and prices.",
  },
  {
    icon: CalendarCheck,
    title: "Choose your dates",
    description: "Select an available room and submit your reservation details.",
  },
  {
    icon: CreditCard,
    title: "Confirm your booking",
    description: "Follow the payment instructions and review your booking confirmation.",
  },
];

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || "";
const backendBaseUrl = /^https?:\/\//.test(configuredApiUrl)
  ? configuredApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "")
  : "";
const learnMoreHeroImage = `${backendBaseUrl}/uploads/guesthouses/1789584209457-3d8e0819-9c9f-4330-8d4e-860da27f1553.jpg`;

export function LearnMore() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="bg-white text-[#173c55]">
      <section className="relative isolate min-h-[420px] overflow-hidden bg-[#043658] text-white">
        <img
          src={learnMoreHeroImage}
          alt="Guesthouse surrounded by the Ethiopian landscape"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#032944]/95 via-[#043658]/75 to-[#043658]/25" />
        <div className="mx-auto flex min-h-[420px] max-w-7xl items-end px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
              {t('HOW IT WORKS')}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
              {t('A clearer way to find and book your stay')}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              {t('Discover approved guesthouses, make a reservation, and keep your booking details together in one place.')}
            </p>
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FFC107] px-5 py-3 text-sm font-bold text-[#043658] transition hover:-translate-y-0.5 hover:bg-[#ffca28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('Find a guesthouse')}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f5f8fa] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a66b00]">
              {t('FOR GUESTS')}
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#043658]">
              {t('From browsing to booking')}
            </h2>
          </div>

          <ol className="mt-9 grid gap-8 md:grid-cols-3">
            {guestSteps.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className="relative border-t-2 border-[#dce5eb] pt-5">
                <span className="absolute -top-[9px] left-0 h-4 w-4 rounded-full border-4 border-[#f5f8fa] bg-[#FFC107]" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658] text-[#FFC107]">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {t('Step {{count}}', { count: index + 1 })}
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#043658]">{t(title)}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{t(description)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a66b00]">
              {t('FOR PROPERTY TEAMS')}
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#043658]">
              {t('Tools for day-to-day operations')}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t('Owners can register a property and, after review, manage rooms and reservations through their account. Receptionists can support front-desk booking activity.')}
            </p>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#043658] px-5 py-3 text-sm font-bold text-[#043658] transition hover:bg-[#043658] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC107]"
            >
              {t('Create an account')}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-0 divide-y divide-slate-200 border-y border-slate-200">
            <div className="flex gap-4 py-5">
              <ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#0b7551]" />
              <div>
                <h3 className="font-bold text-[#043658]">{t('Review before listing')}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {t('Properties are subject to administrator approval before appearing in public search.')}
                </p>
              </div>
            </div>
            <div className="flex gap-4 py-5">
              <ClipboardCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#0b7551]" />
              <div>
                <h3 className="font-bold text-[#043658]">{t('Manage stays in one place')}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {t('Keep room availability and reservation activity organized through role-based tools.')}
                </p>
              </div>
            </div>
            <div className="flex gap-4 py-5">
              <Users aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#0b7551]" />
              <div>
                <h3 className="font-bold text-[#043658]">{t('Support for different roles')}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {t('Guest, owner, and receptionist accounts have tools suited to their work.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#043658] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#FFC107]">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              <p className="text-sm font-bold uppercase tracking-[0.14em]">{t('Ready when you are')}</p>
            </div>
            <h2 className="mt-2 text-2xl font-black">{t('Start planning your stay')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-5 py-3 text-sm font-bold text-[#043658] transition hover:bg-[#ffca28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t('Explore guesthouses')}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default LearnMore;