import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Payments() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar de Conta */}
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem' }}>Olá, Martina.</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to="/perfil/pedidos">Meus Pedidos</Link></li>
          <li><Link to="/perfil/enderecos">Endereços</Link></li>
          <li><Link to="/perfil/pagamentos" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Pagamentos</Link></li>
          <li><Link to="/perfil">Dados Pessoais</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sair da Conta
            </button>
          </li>
        </ul>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Métodos de Pagamento</h2>
          <button className="btn">Adicionar Cartão</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', borderLeft: '4px solid var(--color-accent-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>Mastercard</strong>
              <span className="badge">Principal</span>
            </div>
            <p style={{ color: '#555', marginBottom: '0.2rem', letterSpacing: '2px' }}>**** **** **** 4321</p>
            <p style={{ color: '#555', marginBottom: '1rem' }}>Validade: 12/28</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
