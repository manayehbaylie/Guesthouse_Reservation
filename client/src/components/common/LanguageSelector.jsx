import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function LanguageSelector({ variant = 'light' }) {
  const { language, languages, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedLanguage = languages.find((item) => item.code === language) || languages[0];
  const isDark = variant === 'dark';

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={t('Language: {{name}}', { name: selectedLanguage.name })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
          isDark
            ? 'text-white hover:bg-white/10'
            : 'text-stone-700 hover:bg-stone-100'
        }`}
      >
        <Languages aria-hidden="true" className="h-4 w-4" />
        <span>{selectedLanguage.code.toUpperCase()}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('Choose language')}
          className="absolute right-0 z-[100] mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 text-stone-900 shadow-xl shadow-stone-950/15"
        >
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase text-stone-400">
            {t('Language')}
          </p>
          {languages.map((item) => {
            const active = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLanguage(item.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active ? 'bg-amber-50 text-stone-950' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="w-8 text-xs font-bold text-stone-400">{item.code.toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-stone-500">{item.nativeName}</span>
                </span>
                {active && <Check aria-hidden="true" className="h-4 w-4 text-amber-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}