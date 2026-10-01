
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  ShieldCheck,
  CalendarCheck,
  Receipt,
  ArrowRight,
  Building2,
} from "lucide-react";

export function Explore() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-[#043658] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
            {t('EXPLORE')}
          </p>

          <h1
            className="mt-3 text-5xl font-normal sm:text-6xl"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            {t('Find a Guesthouse You Can Trust')}
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/80">
            {t('Discover verified guesthouses across Ethiopia and find a comfortable place for your next stay.')}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate("/guesthouses")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-lg focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107] transition-colors group-hover:bg-[#FFC107] group-hover:text-[#043658] group-focus-visible:bg-[#FFC107] group-focus-visible:text-[#043658]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Verified Guesthouses')}
                </h2>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#043658] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#FFC107] group-focus-visible:translate-x-1 group-focus-visible:text-[#FFC107]" />
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Discover guesthouses that have passed the platform verification process.')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/search")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-lg focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107] transition-colors group-hover:bg-[#FFC107] group-hover:text-[#043658] group-focus-visible:bg-[#FFC107] group-focus-visible:text-[#043658]">
                <CalendarCheck className="h-6 w-6" />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Easy Reservations')}
                </h2>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#043658] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#FFC107] group-focus-visible:translate-x-1 group-focus-visible:text-[#FFC107]" />
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Search available rooms and reserve your preferred stay easily.')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/search")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-lg focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107] transition-colors group-hover:bg-[#FFC107] group-hover:text-[#043658] group-focus-visible:bg-[#FFC107] group-focus-visible:text-[#043658]">
                <Receipt className="h-6 w-6" />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Clear Confirmation')}
                </h2>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#043658] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#FFC107] group-focus-visible:translate-x-1 group-focus-visible:text-[#FFC107]" />
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Complete your reservation and receive clear booking confirmation and payment information.')}
              </p>
            </button>
          </div>

          <div className="mt-14 rounded-3xl bg-white p-10 text-center shadow-sm">
            <Building2 className="mx-auto h-14 w-14 text-[#FFC107]" />

            <h2 className="mt-5 text-2xl font-black text-[#043658]">
              {t('Ready to find your stay?')}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {t('Browse all available guesthouses and choose the one that best fits your needs.')}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/guesthouses")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#043658] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#064b78]"
              >
                {t('View All Guesthouses')}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#043658] px-6 py-3.5 text-sm font-black text-[#043658] transition hover:bg-[#043658]/5"
              >
                {t('Search with Filters')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Explore;

