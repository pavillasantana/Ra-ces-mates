import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const formatDate = (value) => new Date(value).toLocaleDateString('pt-BR');

const fallbackOrders = [{ id: 'RCS-1042', date: '2026-05-22T10:00:00.000Z', total: 86500, status: 'Em trânsito', trackingCode: 'RAI654321AR', items: ['Cuia Torpedo Artesanal', 'Erva Premium Pajarito'], timeline: ['Pagamento aprovado', 'Separação concluída', 'Em trânsito', 'Saiu para entrega'] }];

export default function Orders() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [selectedId, setSelectedId] = useState(null);

  const orders = useMemo(() => {
    const all = JSON.parse(localStorage.getItem('raices-orders') || '[]');
    const userEmail = user?.email;
    const userOrders = all.filter((order) => !userEmail || order.customerEmail === userEmail);
    return userOrders.length > 0 ? userOrders : fallbackOrders;
  }, [user?.email]);

  const activeOrder = orders.find((order) => order.id === selectedId) || orders[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem' }}>Olá, {user?.name?.split(' ')[0] || 'Cliente'}.</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to="/perfil/pedidos" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Meus Pedidos</Link></li>
          <li><Link to="/perfil/enderecos">Endereços</Link></li>
          <li><Link to="/perfil/pagamentos">Pagamentos</Link></li>
          <li><Link to="/perfil/favoritos">Favoritos</Link></li>
          <li><Link to="/perfil">Dados Pessoais</Link></li>
          <li style={{ marginTop: '2rem' }}><button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer' }}>Sair da Conta</button></li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Histórico de Pedidos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.2rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', padding: '1rem' }}>
            {orders.map((order) => (
              <button key={order.id} type="button" onClick={() => setSelectedId(order.id)} style={{ width: '100%', textAlign: 'left', border: '1px solid #eee', borderRadius: '8px', padding: '0.9rem', marginBottom: '0.7rem', background: activeOrder?.id === order.id ? '#eefcf4' : '#fff', cursor: 'pointer' }}>
                <strong>{order.id}</strong>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{formatDate(order.date)} · ARS {order.total.toLocaleString('es-AR')}</div>
                <div style={{ color: 'var(--color-accent-green)', fontSize: '0.9rem' }}>{order.status}</div>
              </button>
            ))}
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', padding: '1.3rem' }}>
            {activeOrder ? (<>
              <h3 style={{ marginTop: 0, marginBottom: '0.7rem' }}>{activeOrder.id}</h3>
              <p style={{ marginTop: 0, color: '#555' }}>Rastreamento: <strong>{activeOrder.trackingCode}</strong></p>
              <ul style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>{activeOrder.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <div style={{ display: 'grid', gap: '0.6rem' }}>{activeOrder.timeline.map((step, index) => <div key={step} style={{ borderLeft: '3px solid var(--color-accent-green)', paddingLeft: '0.7rem', color: index === activeOrder.timeline.length - 1 ? 'var(--color-accent-green)' : '#444', fontWeight: index === activeOrder.timeline.length - 1 ? 600 : 400 }}>{step}</div>)}</div>
            </>) : <p>Nenhum pedido encontrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
