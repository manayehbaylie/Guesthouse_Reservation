
import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    const subject = encodeURIComponent(
      `Guesthouse Platform Contact - ${name}`
    );

    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href =
      `mailto:guesthouseplatform@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#043658] text-white">
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">

          <div className="flex flex-col justify-center">
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

            <p className="mt-6 max-w-xl text-base leading-8 text-white/80">
              Have a question about a guesthouse, reservation, payment,
              or the platform? Send us a message and our team will be
              happy to help.
            </p>

            <div className="mt-9 space-y-6">

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Mail className="h-5 w-5 text-[#FFC107]" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    Email
                  </p>

                  <p className="font-bold">
                    guesthouseplatform@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Phone className="h-5 w-5 text-[#FFC107]" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    Phone
                  </p>

                  <p className="font-bold">
                    +251 9XX XXX XXX
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <MapPin className="h-5 w-5 text-[#FFC107]" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    Location
                  </p>

                  <p className="font-bold">
                    Addis Ababa, Ethiopia
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
            <h2 className="text-2xl font-black text-[#043658]">
              Send us a message
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              We would love to hear from you.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-[#043658]">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#043658]">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#043658]">
                  Message
                </label>

                <textarea
                  name="message"
                  required
                  rows="5"
                  placeholder="How can we help you?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#043658] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#FFC107] hover:text-[#043658]"
              >
                <Mail className="h-4 w-4" />
                Send Email
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}

export default Contact;

