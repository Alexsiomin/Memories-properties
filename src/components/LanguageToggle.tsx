import { useLanguage } from '@/hooks/use-language';

interface Props {
  className?: string;
  /** Tailwind color classes for the text (e.g. "text-white/80"). */
  tone?: string;
}

/**
 * EN | RU language toggle. English is the default; RU auto-translates the
 * whole page via Lovable AI.
 */
const LanguageToggle = ({ className = '', tone = '' }: Props) => {
  const { lang, setLang, translating } = useLanguage();

  return (
    <div
      className={`notranslate inline-flex items-center uppercase tracking-[0.22em] font-montserrat font-extrabold select-none ${tone} ${className || 'text-sm'}`}
      translate="no"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-1 transition-opacity ${lang === 'en' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <span className="opacity-40">/</span>
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={`px-1 transition-opacity ${lang === 'ru' ? 'opacity-100' : 'opacity-50 hover:opacity-80'} ${translating ? 'animate-pulse' : ''}`}
        aria-pressed={lang === 'ru'}
      >
        RU
      </button>
    </div>
  );
};

export default LanguageToggle;
