import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';

export default function Favorites() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { favorites, removeFavorite } = useFavoritesStore();
  const { t, formatPrice, lang } = useTranslation();
  const { showAlert } = useModal();

  const handleLogout = () => {
    logout();
    navigate(lang === 'pt' ? '/pt/login' : '/login');
  };

  const handleBuyNow = (product) => {
    addToCart(product);
    navigate(lang === 'pt' ? '/pt/checkout' : '/checkout');
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem' }}>{t('profile_sidebar_title')}, {user?.name?.split(' ')[0] || 'Cliente'}.</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to="/perfil/pedidos">{t('profile_sidebar_orders')}</Link></li>
          <li><Link to="/perfil/direcciones">{t('profile_sidebar_addresses')}</Link></li>
          <li><Link to="/perfil/pagos">{t('profile_sidebar_payments')}</Link></li>
          <li><Link to="/perfil/favoritos" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>{t('profile_sidebar_favorites')}</Link></li>
          <li><Link to="/perfil">{t('profile_sidebar_personal')}</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {t('profile_sidebar_logout')}
            </button>
          </li>
        </ul>
      </div>

      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '2rem', fontFamily: "'Playfair Display', serif", color: 'var(--color-primary-green)' }}>{t('favorites_title')}</h1>
        {favorites.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '4rem 2rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>{t('favorites_empty')}</p>
            <Link to={lang === 'pt' ? '/pt' : '/'} className="btn">{t('favorites_explore')}</Link>
          </div>
        ) : (
          <div className="product-grid">
            {favorites.map((product) => {
              const productUrl = lang === 'pt' ? `/pt/produto/${product.id}` : `/producto/${product.id}`;
              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrap">
                    <Link to={productUrl} style={{display: 'block', height: '100%'}}>
                      <img src={product.image} alt={t(product.name)} loading="lazy" />
                    </Link>
                  </div>
                  <div className="product-info">
                    <h3><Link to={productUrl}>{t(product.name)}</Link></h3>
                    <p className="product-price">{formatPrice(product.price)}</p>
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                      <button className="btn" onClick={() => addToCart(product)}>{t('add_to_cart')}</button>
                      <button className="btn btn-outline" onClick={() => handleBuyNow(product)}>{t('buy_now')}</button>
                      <button className="btn btn-outline" onClick={() => removeFavorite(product.id)}>{t('remove_item')}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
