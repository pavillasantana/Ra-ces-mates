import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError, isAuthenticated, is2FAVerified } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Se já logado e verificado, manda para o perfil
  useEffect(() => {
    if (isAuthenticated && is2FAVerified) {
      navigate('/perfil');
    }
  }, [isAuthenticated, is2FAVerified, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login({ email, password });
    
    if (result === '2fa') {
      navigate('/2fa');
    } else if (result === 'success') {
      navigate('/perfil');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Acesse sua Conta</h2>
        
        {error && <div style={{ backgroundColor: '#fdecea', color: '#d9534f', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Acessando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Não tem conta? <Link to="/register" style={{ color: 'var(--color-accent-green)', fontWeight: 'bold' }}>Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
