import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { user, verify2FA } = useAuthStore();
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length >= 4) {
      verify2FA();
      navigate('/perfil');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Autenticação em Dois Fatores</h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>Enviamos um código SMS de segurança para verificar sua identidade.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Digite o código (ex: 1234)" 
              required 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem' }} 
            />
          </div>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Verificar Código</button>
        </form>
      </div>
    </div>
  );
}
