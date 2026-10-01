import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export function Contact() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#043658] text-white">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
              {t('CONTACT')}
            </p>

            <h1
              className="mt-3 text-5xl font-normal sm:text-6xl"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
              }}
            >
              {t('Get in Touch')}
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base leading-8 text-white/80">
              {t('Have a question about a guesthouse, reservation, payment, or the platform? Reach out to us and our team will be happy to help.')}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            <a
              href="mailto:manayehbaylie@gmail.com"
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FFC107]/70 hover:bg-white/10 hover:shadow-xl focus-visible:-translate-y-1.5 focus-visible:border-[#FFC107] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 focus-visible:ring-offset-[#043658] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC107]/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FFC107] group-focus-visible:scale-110 group-focus-visible:bg-[#FFC107]">
                <Mail className="h-6 w-6 text-[#FFC107]" />
              </div>
              <p className="mt-3 text-sm text-white/60">{t('Email')}</p>
              <p className="mt-1 break-all text-sm font-bold text-white transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]">
                manayehbaylie@gmail.com
              </p>
              <span className="mt-2 inline-block text-xs font-semibold text-white/50 transition-colors group-hover:text-white/80 group-focus-visible:text-white/80">{t('Send an email')}</span>
            </a>

            <a
              href="tel:+251924392994"
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FFC107]/70 hover:bg-white/10 hover:shadow-xl focus-visible:-translate-y-1.5 focus-visible:border-[#FFC107] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 focus-visible:ring-offset-[#043658] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC107]/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FFC107] group-focus-visible:scale-110 group-focus-visible:bg-[#FFC107]">
                <Phone className="h-6 w-6 text-[#FFC107]" />
              </div>
              <p className="mt-3 text-sm text-white/60">{t('Phone')}</p>
              <p className="mt-1 text-sm font-bold text-white transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]">
                +251 924392994
              </p>
              <span className="mt-2 inline-block text-xs font-semibold text-white/50 transition-colors group-hover:text-white/80 group-focus-visible:text-white/80">{t('Call us')}</span>
            </a>

            <a
              href="https://t.me/+251924392994"
              target="_blank"
              rel="noreferrer"
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FFC107]/70 hover:bg-white/10 hover:shadow-xl focus-visible:-translate-y-1.5 focus-visible:border-[#FFC107] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 focus-visible:ring-offset-[#043658] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC107]/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FFC107] group-focus-visible:scale-110 group-focus-visible:bg-[#FFC107]">
                <Send className="h-6 w-6 text-[#FFC107] transition-colors group-hover:text-[#043658] group-focus-visible:text-[#043658]" />
              </div>
              <p className="mt-3 text-sm text-white/60">{t('Telegram')}</p>
              <p className="mt-1 text-sm font-bold text-white transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]">
                +251 924392994
              </p>
              <span className="mt-2 inline-block text-xs font-semibold text-white/50 transition-colors group-hover:text-white/80 group-focus-visible:text-white/80">{t('Message us on Telegram')}</span>
            </a>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Addis%20Ababa%2C%20Ethiopia"
              target="_blank"
              rel="noreferrer"
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FFC107]/70 hover:bg-white/10 hover:shadow-xl focus-visible:-translate-y-1.5 focus-visible:border-[#FFC107] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2 focus-visible:ring-offset-[#043658] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC107]/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FFC107] group-focus-visible:scale-110 group-focus-visible:bg-[#FFC107]">
                <MapPin className="h-6 w-6 text-[#FFC107]" />
              </div>
              <p className="mt-3 text-sm text-white/60">{t('Location')}</p>
              <p className="mt-1 text-sm font-bold text-white transition-colors group-hover:text-[#FFC107] group-focus-visible:text-[#FFC107]">
                Addis Ababa, Ethiopia
              </p>
              <span className="mt-2 inline-block text-xs font-semibold text-white/50 transition-colors group-hover:text-white/80 group-focus-visible:text-white/80">{t('Open in Maps')}</span>
            </a>

          </div>

        </div>
      </section>
    </div>
  );
}

export default Contact;