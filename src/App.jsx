import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useCartStore } from './store/cartStore';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import { useTranslation } from './hooks/useTranslation';

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
          <div className="logo">
            <Link to="/"><h1>RAÍCES</h1></Link>
          </div>
          <nav className="main-nav">
            <ul>
              <li><Link to="/">{t('nav_home')}</Link></li>
              <li><Link to="/#produtos">{t('nav_products')}</Link></li>
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
                <div className="checkout-options">
                  <button className="btn btn-mp" onClick={handlePagamentoMP}>{t('btn_mp')}</button>
                  <Link to="/checkout" className="btn btn-transfer" onClick={toggleCart} style={{ textAlign: 'center', display: 'block' }}>
                    {t('btn_transfer')}
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
        <footer className="site-footer">
          <h2>RAÍCES</h2>
          <p>Mates Premium • Envios para toda Argentina</p>
          <p>&copy; 2026 Raíces Artesanal Heritage. Todos os direitos reservados.</p>
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
                    alert('Pagamento simulado com sucesso! Muito obrigado.');
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
