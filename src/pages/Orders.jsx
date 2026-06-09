import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';

const formatDate = (value, locale) => new Date(value).toLocaleDateString(locale);

const fallbackOrders = [{ 
  id: 'RCS-1042', 
  date: '2026-05-22T10:00:00.000Z', 
  total: 86500, 
  status: 'En tránsito', 
  statusPt: 'Em trânsito',
  trackingCode: 'RAI654321AR', 
  items: ['Mate Torpedo Artesanal', 'Yerba Premium Pajarito'], 
  itemsPt: ['Mate Torpedo Artesanal', 'Erva Premium Pajarito'],
  timeline: ['Pago aprobado', 'Preparación concluida', 'En tránsito', 'Salió a distribución'],
  timelinePt: ['Pagamento aprovado', 'Preparação concluída', 'Em trânsito', 'Saiu para entrega']
}];

export default function Orders() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { t, lang } = useTranslation();
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
    navigate(lang === 'pt' ? '/pt/login' : '/login');
  };

  const welcomeText = lang === 'pt' ? `Olá, ${user?.name?.split(' ')[0] || 'Cliente'}.` : `Hola, ${user?.name?.split(' ')[0] || 'Cliente'}.`;
  
  const ordersLink = lang === 'pt' ? '/pt/perfil/pedidos' : '/perfil/pedidos';
  const addressesLink = lang === 'pt' ? '/pt/perfil/direcciones' : '/perfil/direcciones';
  const paymentsLink = lang === 'pt' ? '/pt/perfil/pagos' : '/perfil/pagos';
  const favoritesLink = lang === 'pt' ? '/pt/perfil/favoritos' : '/perfil/favoritos';
  const personalDataLink = lang === 'pt' ? '/pt/perfil' : '/perfil';

  const localeStr = lang === 'pt' ? 'pt-BR' : 'es-AR';

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar de Cuenta */}
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem', fontFamily: "'Playfair Display', serif" }}>{welcomeText}</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to={ordersLink} style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>{lang === 'pt' ? 'Meus Pedidos' : 'Mis Pedidos'}</Link></li>
          <li><Link to={addressesLink}>{lang === 'pt' ? 'Endereços' : 'Direcciones'}</Link></li>
          <li><Link to={paymentsLink}>{lang === 'pt' ? 'Pagamentos' : 'Pagos'}</Link></li>
          <li><Link to={favoritesLink}>{lang === 'pt' ? 'Favoritos' : 'Favoritos'}</Link></li>
          <li><Link to={personalDataLink}>{lang === 'pt' ? 'Dados Pessoais' : 'Datos Personales'}</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {lang === 'pt' ? 'Sair' : 'Cerrar Sesión'}
            </button>
          </li>
        </ul>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--color-primary-green)', marginBottom: '1.5rem' }}>
          {lang === 'pt' ? 'Histórico de Pedidos' : 'Historial de Pedidos'}
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.2rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', padding: '1rem' }}>
            {orders.map((order) => {
              const orderStatus = lang === 'pt' ? (order.statusPt || order.status) : order.status;
              return (
                <button key={order.id} type="button" onClick={() => setSelectedId(order.id)} style={{ width: '100%', textAlign: 'left', border: '1px solid #eee', borderRadius: '8px', padding: '0.9rem', marginBottom: '0.7rem', background: activeOrder?.id === order.id ? '#eefcf4' : '#fff', cursor: 'pointer' }}>
                  <strong>{order.id}</strong>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>{formatDate(order.date, localeStr)} · ARS {order.total.toLocaleString('es-AR')}</div>
                  <div style={{ color: 'var(--color-accent-green)', fontSize: '0.9rem' }}>{orderStatus}</div>
                </button>
              );
            })}
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', padding: '1.3rem' }}>
            {activeOrder ? (<>
              <h3 style={{ marginTop: 0, marginBottom: '0.7rem' }}>{activeOrder.id}</h3>
              <p style={{ marginTop: 0, color: '#555' }}>
                {lang === 'pt' ? 'Rastreamento:' : 'Seguimiento:'} <strong>{activeOrder.trackingCode}</strong>
              </p>
              <ul style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>
                {(lang === 'pt' ? (activeOrder.itemsPt || activeOrder.items) : activeOrder.items).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {(lang === 'pt' ? (activeOrder.timelinePt || activeOrder.timeline) : activeOrder.timeline).map((step, index, arr) => (
                  <div key={step} style={{ borderLeft: '3px solid var(--color-accent-green)', paddingLeft: '0.7rem', color: index === arr.length - 1 ? 'var(--color-accent-green)' : '#444', fontWeight: index === arr.length - 1 ? 600 : 400 }}>
                    {step}
                  </div>
                ))}
              </div>
            </>) : (
              <p>{lang === 'pt' ? 'Nenhum pedido encontrado.' : 'Ningún pedido encontrado.'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
