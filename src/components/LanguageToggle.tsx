import { useLanguage, LANG_CODES, LANG_LABELS } from '@/hooks/use-language';

interface Props {
  className?: string;
  /** Tailwind color classes for the text (e.g. "text-white/80"). */
  tone?: string;
}

const ALL_CODES = ['en', ...LANG_CODES] as const;

/**
 * EN | RU | EL | DE language toggle. English is the default; the others
 * auto-translate the whole page via an edge function.
 */
const LanguageToggle = ({ className = '', tone = '' }: Props) => {
  const { lang, setLang, translating } = useLanguage();

  return (
    <div
      className={`notranslate inline-flex items-center uppercase tracking-[0.18em] font-montserrat font-extrabold select-none ${tone} ${className || 'text-sm'}`}
      translate="no"
      aria-label="Language"
    >
      {ALL_CODES.map((code, i) => (
        <span key={code} className="inline-flex items-center">
          {i > 0 && <span className="opacity-40 px-0.5">/</span>}
          <button
            type="button"
            onClick={() => setLang(code)}
            className={`px-1 transition-opacity ${lang === code ? 'opacity-100' : 'opacity-50 hover:opacity-80'} ${
              translating && lang === code ? 'animate-pulse' : ''
            }`}
            aria-pressed={lang === code}
          >
            {LANG_LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  );
};

export default LanguageToggle;
