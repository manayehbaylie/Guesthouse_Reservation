
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  CalendarCheck,
  Receipt,
  ArrowRight,
} from "lucide-react";

export function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="bg-[#043658] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
            ABOUT US
          </p>

          <h1
            className="mt-3 text-5xl font-normal sm:text-6xl"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            About Guesthouse Platform
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-white/80">
            An Ethiopian guesthouse reservation platform designed to make
            finding and booking guesthouses easier, safer, and more
            convenient.
          </p>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl">
            <p className="text-base leading-8 text-slate-600">
              Guesthouse Platform connects guests with verified
              guesthouses across Ethiopia through one simple digital
              platform.
            </p>

            <p className="mt-6 text-base leading-8 text-slate-600">
              Instead of relying only on phone calls, walk-ins, or
              informal booking methods, guests can explore available
              guesthouses, view rooms, make reservations, and receive
              confirmation through the platform.
            </p>

            <p className="mt-6 text-base leading-8 text-slate-600">
              For guesthouse owners and staff, the platform provides tools
              for managing guesthouses, rooms, reservations, payments,
              and daily operations.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-[#043658]" />

              <h2 className="mt-5 text-lg font-black text-[#043658]">
                Verified Stays
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Guests can discover guesthouses that have passed the
                verification process.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <Users className="h-8 w-8 text-[#043658]" />

              <h2 className="mt-5 text-lg font-black text-[#043658]">
                Built for Everyone
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Designed for guests, owners, receptionists, and
                administrators.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <CalendarCheck className="h-8 w-8 text-[#043658]" />

              <h2 className="mt-5 text-lg font-black text-[#043658]">
                Reliable Booking
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Reservations are managed digitally to help prevent
                double-booking.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <Receipt className="h-8 w-8 text-[#043658]" />

              <h2 className="mt-5 text-lg font-black text-[#043658]">
                Clear Receipts
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Guests can receive clear booking and payment information
                after making reservations.
              </p>
            </div>
          </div>

          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#043658] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#064b78]"
            >
              Explore Guesthouses
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;

