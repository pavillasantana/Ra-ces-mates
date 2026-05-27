import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { tempToken, verify2FA, loading, error, clearError } = useAuthStore();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (code.length >= 4) {
      const success = await verify2FA(code);
      if (success) {
        navigate('/perfil');
      }
    }
  };

  if (!tempToken) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Autenticação em Dois Fatores</h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>Enviamos um código de segurança (App/SMS) para verificar sua identidade.</p>
        
        {error && <div style={{ backgroundColor: '#fdecea', color: '#d9534f', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Digite o código (ex: 123456)" 
              required 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem' }} 
            />
          </div>
          <button type="submit" className="btn" disabled={loading || code.length < 4} style={{ marginTop: '1rem' }}>
            {loading ? 'Verificando...' : 'Validar Código'}
          </button>
        </form>
      </div>
    </div>
  );
}
