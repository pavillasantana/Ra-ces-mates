import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useCartStore } from './store/cartStore';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import { useTranslation } from './hooks/useTranslation';
import { useModal } from './components/ModalProvider';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import TwoFactorAuth from './pages/TwoFactorAuth';
import Payments from './pages/Payments';
import Contact from './pages/Contact';
import Category from './pages/Category';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import Logo from './components/Logo';

import { featuredProducts, collections } from './data/products';

import './App.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCHsbju6NpoYQE5I2h48DthEDcPpvQ4jhRiFDy0aomy52Yi9dwxZubW8sBSM5ROLwnof1fs8JQe51IMXHl2pUbRRVwiDkh8hBQaBf3-f265PCQAWIbBZr8h-v4EtM1YZIfOJlpZPJnWTZcGtOGqWNkZJiDj-FiHUpJvdsYC5Bh1pDIiLj0RpJbFIfoKo8zAYzotinFgHYKO1wazRQ8LxFoRHr6ofIdDvgm1-xem6Lrw0hat3Jl-hKUkP0R7qEArFeuuxh6JwaCKcoZM";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, is2FAVerified } = useAuthStore();
  return (isAuthenticated && is2FAVerified)
    ? children
    : <Navigate to="/login" replace />;
};

function App() {
  const [isMPModalOpen, setIsMPModalOpen] = useState(false);
  const [isCouponPopupOpen, setIsCouponPopupOpen] = useState(false);
  const { setLang } = useAppStore();
  const { t, lang } = useTranslation();
  const { showAlert } = useModal();
  const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity } = useCartStore();
  const { isAuthenticated, is2FAVerified } = useAuthStore();

  useEffect(() => {
    const dismissed = localStorage.getItem('raices-coupon-popup-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setIsCouponPopupOpen(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const transferDiscountTotal = cartTotal * 0.9;
  const qrDiscountTotal = cartTotal * 0.95;
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const getCartRecommendation = () => {
    if (cart.length === 0) return null;
    const firstItem = cart[0];
    const isMate = firstItem.category === 'mates-y-bombillas' || firstItem.tags?.includes('Mate');
    const isYerba = firstItem.category === 'yerba-mate' || firstItem.tags?.includes('Yerba');
    const isCafe = firstItem.category === 'cafe-de-especialidad' || firstItem.tags?.includes('Café');

    let recId = 5; // Default: Yerba mate orgânica
    if (isMate) recId = 10; // Vela sândalo
    else if (isYerba) recId = 3; // Bombilha alpaca
    else if (isCafe) recId = 10; // Vela sândalo

    // Evita recomendar algo que já está no carrinho
    if (cart.some(item => item.id === recId)) {
      const fallbackRecs = [5, 10, 3, 11, 1].filter(id => !cart.some(item => item.id === id));
      if (fallbackRecs.length > 0) recId = fallbackRecs[0];
    }

    return featuredProducts.find(p => p.id === recId);
  };

  const handleAddCartRec = (recProduct) => {
    const { addToCart: storeAddToCart } = useCartStore.getState();
    storeAddToCart(recProduct);
    
    // GA4 select_promotion click tracker
    console.log(`%c📊 [GA4 EVENT DISPATCHED] select_promotion:`, 'color: #18281a; font-weight: bold; background-color: #f4f1eb; padding: 4px 8px; border: 1px solid #18281a; border-radius: 4px;', {
      promotion_name: 'Cart Sidebar Cross-Sell Recommendation',
      item_name: recProduct.name,
      creative_name: 'Sidebar Recommendation Card',
      location: 'Cart Drawer Sidebar'
    });
    if (window.gtag) {
      window.gtag('event', 'select_promotion', {
        promotion_name: 'Cart Sidebar Cross-Sell Recommendation',
        item_name: recProduct.name,
        creative_name: 'Sidebar Recommendation Card',
        location: 'Cart Drawer Sidebar'
      });
    }

    showAlert('Producto Agregado', `${recProduct.name} se agregó al carrito.`, 'success');
  };

  const handlePagamentoMP = () => {
    toggleCart();
    setIsMPModalOpen(true);
  };

  const closeCouponPopup = () => {
    localStorage.setItem('raices-coupon-popup-dismissed', '1');
    setIsCouponPopupOpen(false);
  };

  return (
    <Router>
      <div className="app-container">
        {/* Header Global */}
        <header className="site-header">
          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Logo width="150" />
            </Link>
          </div>
          <nav className="main-nav">
            <ul>
              <li><Link to="/">{t('nav_home')}</Link></li>
              <li className="dropdown">
                <span className="dropdown-toggle" style={{ cursor: 'pointer' }}>
                  {lang === 'ES' ? 'Productos' : 'Produtos'} <span style={{ fontSize: '0.6rem', marginLeft: '0.2rem' }}>▼</span>
                </span>
                <ul className="dropdown-menu">
                  <li><Link to="/colecciones/mates-y-cuias">Mates & Cuias</Link></li>
                  <li><Link to="/colecciones/yerba-mate">Yerba Mate</Link></li>
                  <li><Link to="/colecciones/velas-y-inciensos">{lang === 'ES' ? 'Velas y Inciensos' : 'Velas e Incensos'}</Link></li>
                  <li><Link to="/colecciones/artesanias">{lang === 'ES' ? 'Artesanías' : 'Artesanatos'}</Link></li>
                </ul>
              </li>
              <li><Link to="/contato">{t('nav_contact')}</Link></li>
            </ul>
          </nav>
          <div className="header-actions">
            <button className="lang-switch" onClick={() => setLang(lang === 'ES' ? 'PT' : 'ES')}>
              {lang} / {lang === 'ES' ? 'PT' : 'ES'}
            </button>
            <Link to={isAuthenticated && is2FAVerified ? "/perfil" : "/login"} style={{ fontSize: '1.2rem', textDecoration: 'none' }}>
              👤
            </Link>
            <button className="cart-icon-wrapper" onClick={toggleCart}>
              🛒
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </button>
          </div>
        </header>

        {/* Carrinho Sidebar */}
        {isCartOpen && <div className="cart-overlay" onClick={toggleCart}></div>}
        <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h2>Carrinho</h2>
            <button className="close-cart" onClick={toggleCart}>✕</button>
          </div>
          {cart.length === 0 ? (
            <p style={{textAlign: 'center', opacity: 0.6, marginTop: '2rem'}}>Seu carrinho está vazio.</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} />
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <p className="cart-item-price">{formatPrice(item.price)}</p>
                      <div className="cart-item-actions">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remover</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Recomendação no Carrinho (Sprint 3) */}
              {(() => {
                const rec = getCartRecommendation();
                if (!rec) return null;
                return (
                  <div style={{ padding: '1rem', borderTop: '1px dashed #e0dfdb', borderBottom: '1px dashed #e0dfdb', backgroundColor: '#fdfcfb' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-highlight-terracotta)' }}>
                      {lang === 'ES' ? 'Aprovechá y compralo junto:' : 'Aproveite e compre junto:'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                      <img src={rec.image} alt={rec.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f0efeb' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.name}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-highlight-terracotta)', fontWeight: 'bold' }}>
                          {formatPrice(rec.price)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleAddCartRec(rec)}
                        style={{
                          backgroundColor: 'var(--color-primary-green)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        + {t('cross_sell_add')}
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div className="cart-footer">
                <div className="cart-totals">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="total-line discount">
                    <span>C/ Transferência (-10%):</span>
                    <span>{formatPrice(transferDiscountTotal)}</span>
                  </div>
                </div>
                <div className="checkout-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <Link 
                    to="/checkout" 
                    className="btn" 
                    onClick={toggleCart} 
                    style={{ 
                      textAlign: 'center', 
                      display: 'block', 
                      width: '100%', 
                      padding: '1.1rem', 
                      fontSize: '1.05rem', 
                      fontWeight: 'bold',
                      backgroundColor: 'var(--color-accent-green)',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    {t('cart_checkout_btn')}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rotas */}
        <Routes>
          <Route path="/" element={<Home heroImage={heroImage} collections={collections} featuredProducts={featuredProducts} />} />
          <Route path="/produto/:id" element={<ProductDetail products={featuredProducts} />} />
          <Route path="/categoria/:slug" element={<Category />} />
          <Route path="/colecciones/:slug" element={<Category />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/2fa" element={<TwoFactorAuth />} />
          <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/perfil/enderecos" element={<PrivateRoute><Addresses /></PrivateRoute>} />
          <Route path="/perfil/pagamentos" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/perfil/pedidos" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/perfil/favoritos" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        </Routes>

        {/* Footer Global */}
        <footer className="site-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '3rem 1rem 2rem', borderTop: '1px solid rgba(28, 28, 24, 0.08)' }}>
          <Logo width="120" />
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Mates Premium • Envios para toda Argentina</p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>&copy; 2026 Raíces Artesanal Heritage. Todos los derechos reservados.</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#aaa', marginTop: '0.4rem' }}>
            Desenvolvido por <a href="https://pstec.pavilasantana.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#1e3f20'} onMouseOut={(e) => e.target.style.color = '#666'}>PSTec</a>
          </p>
        </footer>

        {/* Botão Flutuante do WhatsApp */}
        <a href="https://wa.me/NUMERO_REAL" target="_blank" rel="noopener noreferrer" className="whatsapp-float">
          ✆
        </a>

        {/* Modal Mercado Pago QR Code */}
        {isMPModalOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '1.8rem', color: '#009ee3', fontWeight: 'bold' }}>mercado</span>
                <span style={{ fontSize: '1.8rem', color: '#009ee3', fontWeight: '300' }}>pago</span>
              </div>

              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>Pagamento via QR Code</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Escaneie o código com o aplicativo do Mercado Pago ou do seu banco.</p>

              <div style={{ border: '2px solid #009ee3', padding: '1rem', borderRadius: '12px', backgroundColor: '#fcfcfc', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=009ee3&data=${encodeURIComponent(`https://www.mercadopago.com.ar/checkout/pay?amount=${qrDiscountTotal}`)}`}
                  alt="Mercado Pago QR Code"
                  style={{ width: '180px', height: '180px' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Total a pagar:</span>
                <strong style={{ fontSize: '1.6rem', color: 'var(--color-accent-green)' }}>{formatPrice(qrDiscountTotal)}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                <button 
                  onClick={() => {
                    const { clearCart } = useCartStore.getState();
                    clearCart();
                    setIsMPModalOpen(false);
                    showAlert('¡Gracias!', 'Pagamento simulado com sucesso! Muito obrigado.', 'success');
                  }} 
                  className="btn" 
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  Já realizei o pagamento
                </button>
                <button
                  onClick={() => setIsMPModalOpen(false)}
                  style={{ width: '100%', padding: '0.8rem', background: 'none', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {isCouponPopupOpen && (
          <div className="coupon-popup-overlay" onClick={closeCouponPopup}>
            <div className="coupon-popup-card" onClick={(e) => e.stopPropagation()}>
              <h3>Cupom de boas-vindas</h3>
              <p>Use o código abaixo no checkout e ganhe 5% OFF.</p>
              <div className="coupon-code">RAICES5</div>
              <button className="btn" onClick={closeCouponPopup}>Entendi</button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
