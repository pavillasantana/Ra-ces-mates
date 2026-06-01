import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { goToTiendanubeCheckout } from '../utils/tiendanube';
import { useModal } from '../components/ModalProvider';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export default function Favorites() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { favorites, removeFavorite } = useFavoritesStore();
  const { showAlert } = useModal();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBuyNow = (product) => {
    const redirected = goToTiendanubeCheckout(product?.tiendanubeProductId, 1);
    if (!redirected) {
      showAlert('Tiendanube', 'Este produto ainda não está configurado para compra direta.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem' }}>Olá, {user?.name?.split(' ')[0] || 'Cliente'}.</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to="/perfil/pedidos">Meus Pedidos</Link></li>
          <li><Link to="/perfil/enderecos">Endereços</Link></li>
          <li><Link to="/perfil/pagamentos">Pagamentos</Link></li>
          <li><Link to="/perfil/favoritos" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Favoritos</Link></li>
          <li><Link to="/perfil">Dados Pessoais</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sair da Conta
            </button>
          </li>
        </ul>
      </div>

      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h2 style={{ marginBottom: '2rem' }}>Meus Favoritos</h2>
        {favorites.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '4rem 2rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>Você ainda não adicionou produtos aos favoritos.</p>
            <Link to="/" className="btn">Explorar produtos</Link>
          </div>
        ) : (
          <div className="product-grid">
            {favorites.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <Link to={`/produto/${product.id}`} style={{display: 'block', height: '100%'}}>
                    <img src={product.image} alt={product.name} />
                  </Link>
                </div>
                <div className="product-info">
                  <h3><Link to={`/produto/${product.id}`}>{product.name}</Link></h3>
                  <p className="product-price">{formatPrice(product.price)}</p>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <button className="btn" onClick={() => addToCart(product)}>Adicionar</button>
                    <button className="btn btn-outline" onClick={() => handleBuyNow(product)}>Comprar</button>
                    <button className="btn btn-outline" onClick={() => removeFavorite(product.id)}>Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}