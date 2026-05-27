import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
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
          <li><Link to="/perfil/pagamentos">Pagamentos</Link></li>
          <li><Link to="/perfil" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Dados Pessoais</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sair da Conta
            </button>
          </li>
        </ul>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h2 style={{ marginBottom: '2rem' }}>Configurações de Perfil</h2>
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', maxWidth: '600px' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>Nome Completo</label>
              <input type="text" defaultValue="Cliente Argentino" style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>E-mail</label>
              <input type="email" defaultValue="cliente@argentina.com" style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>Telefone / WhatsApp</label>
              <input type="text" defaultValue="+54 9 11 0000-0000" style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} type="button">Salvar Alterações</button>
          </form>
        </div>
      </div>
    </div>
  );
}
