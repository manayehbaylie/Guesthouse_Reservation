
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  ShieldCheck,
  Users,
  CalendarCheck,
  Receipt,
  ArrowRight,
} from "lucide-react";

export function AboutUs() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="bg-[#043658] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
            {t('ABOUT US')}
          </p>

          <h1
            className="mt-3 text-5xl font-normal sm:text-6xl"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            {t('About Guesthouse Platform')}
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-white/80">
            {t('An Ethiopian guesthouse reservation platform designed to make finding and booking guesthouses easier, safer, and more convenient.')}
          </p>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl">
            <p className="text-base leading-8 text-slate-600">
              {t('Guesthouse Platform connects guests with verified guesthouses across Ethiopia through one simple digital platform.')}
            </p>

            <p className="mt-6 text-base leading-8 text-slate-600">
              {t('Instead of relying only on phone calls, walk-ins, or informal booking methods, guests can explore available guesthouses, view rooms, make reservations, and receive confirmation through the platform.')}
            </p>

            <p className="mt-6 text-base leading-8 text-slate-600">
              {t('For guesthouse owners and staff, the platform provides tools for managing guesthouses, rooms, reservations, payments, and daily operations.')}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate("/guesthouses")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-xl focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <ShieldCheck className="h-8 w-8 text-[#043658] transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]" />

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Verified Stays')}
                </h2>
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Guests can discover guesthouses that have passed the verification process.')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-xl focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Users className="h-8 w-8 text-[#043658] transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]" />

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Built for Everyone')}
                </h2>
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Designed for guests, owners, receptionists, and administrators.')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/search")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-xl focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <CalendarCheck className="h-8 w-8 text-[#043658] transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]" />

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Reliable Booking')}
                </h2>
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Reservations are managed digitally to help prevent double-booking.')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/search")}
              className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#043658] hover:bg-[#043658] hover:shadow-xl focus-visible:bg-[#043658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Receipt className="h-8 w-8 text-[#043658] transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]" />

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#043658] transition-colors group-hover:text-white group-focus-visible:text-white">
                  {t('Clear Receipts')}
                </h2>
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600 transition-colors group-hover:text-white/85 group-focus-visible:text-white/85">
                {t('Guests can receive clear booking and payment information after making reservations.')}
              </p>
            </button>
          </div>

          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#043658] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#064b78]"
            >
              {t('Explore Guesthouses')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;

