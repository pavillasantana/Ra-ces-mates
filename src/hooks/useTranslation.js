import { translations } from '../i18n/translations';
import { useAppStore } from '../store/appStore';

export const useTranslation = () => {
  const { lang, setLang } = useAppStore();
  
  const t = (key) => {
    return translations[lang]?.[key] || translations['es']?.[key] || key;
  };

  const formatPrice = (price) => {
    if (lang === 'pt') {
      // Convert ARS to BRL (using a realistic conversion rate: 1 BRL ≈ 180 ARS)
      const convertedPrice = Math.max(1, Math.round(price / 180));
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 0 
      }).format(convertedPrice);
    }
    // Spanish / default: ARS $
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      minimumFractionDigits: 0 
    }).format(price);
  };
  
  return { t, lang, setLang, formatPrice };
};
