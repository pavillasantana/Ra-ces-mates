import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simula criação de conta
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Criar Conta</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Nome Completo</label>
            <input type="text" required style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>E-mail</label>
            <input type="email" required style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Senha</label>
            <input type="password" required style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Cadastrar</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Já tem conta? <Link to="/login" style={{ color: 'var(--color-accent-green)', fontWeight: 'bold' }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
