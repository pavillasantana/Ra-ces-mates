import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { tempToken, verify2FA, loading, error, clearError } = useAuthStore();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!tempToken) {
      navigate(lang === 'pt' ? '/pt/login' : '/login');
    }
  }, [tempToken, navigate, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (code.length >= 4) {
      const success = await verify2FA(code);
      if (success) {
        navigate(lang === 'pt' ? '/pt/perfil' : '/perfil');
      }
    }
  };

  if (!tempToken) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', fontFamily: "'Playfair Display', serif", color: 'var(--color-primary-green)', fontSize: '2rem' }}>
          {t('twofa_title')}
        </h1>
        <p style={{ marginBottom: '2rem', color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {t('twofa_subtitle')}
        </p>
        
        {error && <div style={{ backgroundColor: '#fdecea', color: '#d9534f', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="••••••" 
              required 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem' }} 
            />
          </div>
          <button type="submit" className="btn" disabled={loading || code.length < 4} style={{ marginTop: '1rem' }}>
            {loading ? t('login_loading') : t('twofa_btn')}
          </button>
        </form>
      </div>
    </div>
  );
}
