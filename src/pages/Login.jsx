import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError, isAuthenticated, is2FAVerified } = useAuthStore();
  const { t, lang } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Se já logado e verificado, manda para o perfil
  useEffect(() => {
    if (isAuthenticated && is2FAVerified) {
      navigate(lang === 'pt' ? '/pt/perfil' : '/perfil');
    }
  }, [isAuthenticated, is2FAVerified, navigate, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login({ email, password });
    
    if (result === '2fa') {
      navigate('/2fa');
    } else if (result === 'success') {
      navigate(lang === 'pt' ? '/pt/perfil' : '/perfil');
    }
  };

  const title = lang === 'pt' ? 'Acessar sua Conta' : 'Acceder a tu Cuenta';
  const labelPassword = lang === 'pt' ? 'Senha' : 'Contraseña';
  const buttonText = loading 
    ? (lang === 'pt' ? 'Verificando...' : 'Verificando...')
    : (lang === 'pt' ? 'Entrar' : 'Entrar');
  const footerText = lang === 'pt' ? 'Não tem uma conta?' : '¿No tenés una cuenta?';
  const footerLinkText = lang === 'pt' ? 'Criar conta' : 'Crear cuenta';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', fontFamily: "'Playfair Display', serif", color: 'var(--color-primary-green)' }}>{title}</h1>
        
        {error && <div style={{ backgroundColor: '#fdecea', color: '#d9534f', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelPassword}</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
            {buttonText}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {footerText} <Link to={lang === 'pt' ? '/pt/register' : '/register'} style={{ color: 'var(--color-accent-green)', fontWeight: 'bold' }}>{footerLinkText}</Link>
        </p>
      </div>
    </div>
  );
}
