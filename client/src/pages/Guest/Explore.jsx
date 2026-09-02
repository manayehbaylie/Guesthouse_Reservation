
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CalendarCheck,
  Receipt,
  ArrowRight,
  Building2,
} from "lucide-react";

export function Explore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-[#043658] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
            EXPLORE
          </p>

          <h1
            className="mt-3 text-5xl font-normal sm:text-6xl"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            Find a Guesthouse You Can Trust
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/80">
            Discover verified guesthouses across Ethiopia and find a
            comfortable place for your next stay.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-black text-[#043658]">
                Verified Guesthouses
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Discover guesthouses that have passed the platform
                verification process.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <CalendarCheck className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-black text-[#043658]">
                Easy Reservations
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Search available rooms and reserve your preferred stay
                easily.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <Receipt className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-black text-[#043658]">
                Clear Confirmation
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Complete your reservation and receive clear booking
                confirmation and payment information.
              </p>
            </div>
          </div>

          <div className="mt-14 rounded-3xl bg-white p-10 text-center shadow-sm">
            <Building2 className="mx-auto h-14 w-14 text-[#FFC107]" />

            <h2 className="mt-5 text-2xl font-black text-[#043658]">
              Ready to find your stay?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Browse all available guesthouses and choose the one that
              best fits your needs.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/guesthouses")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#043658] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#064b78]"
              >
                View All Guesthouses
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#043658] px-6 py-3.5 text-sm font-black text-[#043658] transition hover:bg-[#043658]/5"
              >
                Search with Filters
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

