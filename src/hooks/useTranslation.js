import { useAppStore } from '../store/appStore';
import { translations } from '../i18n/translations';

export const useTranslation = () => {
  const rawLang = useAppStore((s) => s.lang) || 'es';
  const lang = rawLang.toLowerCase() === 'pt' ? 'pt' : 'es';
  
  const t = (key) => {
    // Attempt resolved language, then fallback to es, then to the key itself
    return translations[lang]?.[key] || translations['es']?.[key] || key;
  };
  
  return { t, lang: lang.toUpperCase() };
};
