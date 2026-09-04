import React from "react";
import {
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function Contact() {
  return (
    <div className="min-h-screen bg-[#043658] text-white">
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
              CONTACT
            </p>

            <h1
              className="mt-3 text-5xl font-normal sm:text-6xl"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
              }}
            >
              Get in Touch
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base leading-8 text-white/80">
              Have a question about a guesthouse, reservation, payment,
              or the platform? Reach out to us and our team will be
              happy to help.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC107]/20 mx-auto">
                <Mail className="h-8 w-8 text-[#FFC107]" />
              </div>
              <p className="mt-4 text-sm text-white/60">Email</p>
              <p className="mt-1 font-bold text-white">
                guesthouseplatform@gmail.com
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC107]/20 mx-auto">
                <Phone className="h-8 w-8 text-[#FFC107]" />
              </div>
              <p className="mt-4 text-sm text-white/60">Phone</p>
              <p className="mt-1 font-bold text-white">
                +251 9XX XXX XXX
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC107]/20 mx-auto">
                <MapPin className="h-8 w-8 text-[#FFC107]" />
              </div>
              <p className="mt-4 text-sm text-white/60">Location</p>
              <p className="mt-1 font-bold text-white">
                Addis Ababa, Ethiopia
              </p>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

export default Contact;