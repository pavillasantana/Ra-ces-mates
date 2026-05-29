import { useAppStore } from '../store/appStore';
import { translations } from '../i18n/translations';

export const useTranslation = () => {
  const lang = useAppStore((s) => s.lang) || 'es';
  const t = (key) => translations[lang]?.[key] || translations['es'][key] || key;
  return { t, lang };
};
