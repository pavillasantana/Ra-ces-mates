import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { initAnalytics, trackEvent } from './utils/analytics';

import './App.css';

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCHsbju6NpoYQE5I2h48DthEDcPpvQ4jhRiFDy0aomy52Yi9dwxZubW8sBSM5ROLwnof1fs8JQe51IMXHl2pUbRRVwiDkh8hBQaBf3-f265PCQAWIbBZr8h-v4EtM1YZIfOJlpZPJnWTZcGtOGqWNkZJiDj-FiHUpJvdsYC5Bh1pDIiLj0RpJbFIfoKo8zAYzotinFgHYKO1wazRQ8LxFoRHr6ofIdDvgm1-xem6Lrw0hat3Jl-hKUkP0R7qEArFeuuxh6JwaCKcoZM";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, is2FAVerified } = useAuthStore();
  const { lang } = useTranslation();
  return (isAuthenticated && is2FAVerified)
    ? children
    : <Navigate to={lang === 'pt' ? "/pt/login" : "/login"} replace />;
};

function AppContent() {
  const [isMPModalOpen, setIsMPModalOpen] = useState(false);
  const [isCouponPopupOpen, setIsCouponPopupOpen] = useState(false);
  const [couponEmail, setCouponEmail] = useState('');
  const [couponSubmitted, setCouponSubmitted] = useState(false);
  const [couponEmailError, setCouponEmailError] = useState('');

  const { t, lang, setLang, formatPrice } = useTranslation();
  const { showAlert } = useModal();
  const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const { isAuthenticated, is2FAVerified } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem('raices-coupon-popup-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setIsCouponPopupOpen(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync language with URL prefix
  useEffect(() => {
    const isPtPath = location.pathname.startsWith('/pt');
    if (isPtPath && lang !== 'pt') {
      setLang('pt');
    } else if (!isPtPath && lang === 'pt') {
      setLang('es');
    }
  }, [location.pathname, lang, setLang]);

  // Set canonical and hreflang alternate tags dynamically
  useEffect(() => {
    // 1. Set canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    const currentUrl = `https://raicesoficial.online${location.pathname}`;
    canonicalEl.setAttribute('href', currentUrl);

    // 2. Set hreflang alternate links
    let esEl = document.querySelector('link[hreflang="es-ar"]');
    if (!esEl) {
      esEl = document.createElement('link');
      esEl.setAttribute('rel', 'alternate');
      esEl.setAttribute('hreflang', 'es-ar');
      document.head.appendChild(esEl);
    }
    let ptEl = document.querySelector('link[hreflang="pt-br"]');
    if (!ptEl) {
      ptEl = document.createElement('link');
      ptEl.setAttribute('rel', 'alternate');
      ptEl.setAttribute('hreflang', 'pt-br');
      document.head.appendChild(ptEl);
    }
    let defaultEl = document.querySelector('link[hreflang="x-default"]');
    if (!defaultEl) {
      defaultEl = document.createElement('link');
      defaultEl.setAttribute('rel', 'alternate');
      defaultEl.setAttribute('hreflang', 'x-default');
      document.head.appendChild(defaultEl);
    }

    // Determine target alternate paths
    let esPath = location.pathname;
    let ptPath = location.pathname;

    if (location.pathname.startsWith('/pt')) {
      ptPath = location.pathname;
      if (location.pathname === '/pt') esPath = '/';
      else if (location.pathname === '/pt/cuias') esPath = '/mates';
      else if (location.pathname === '/pt/erva-mate') esPath = '/yerba-mate';
      else if (location.pathname === '/pt/velas-e-incensos') esPath = '/velas-y-sahumerios';
      else if (location.pathname.startsWith('/pt/produto/')) esPath = location.pathname.replace('/pt/produto/', '/producto/');
      else if (location.pathname === '/pt/checkout') esPath = '/checkout';
      else if (location.pathname === '/pt/login') esPath = '/login';
      else if (location.pathname === '/pt/register') esPath = '/register';
      else if (location.pathname === '/pt/contacto') esPath = '/contacto';
      else if (location.pathname === '/pt/perfil') esPath = '/perfil';
      else esPath = location.pathname.replace('/pt/', '/');
    } else {
      esPath = location.pathname;
      if (location.pathname === '/') ptPath = '/pt';
      else if (location.pathname === '/mates') ptPath = '/pt/cuias';
      else if (location.pathname === '/yerba-mate') ptPath = '/pt/erva-mate';
      else if (location.pathname === '/velas-y-sahumerios') ptPath = '/pt/velas-e-incensos';
      else if (location.pathname.startsWith('/producto/')) ptPath = location.pathname.replace('/producto/', '/pt/produto/');
      else if (location.pathname === '/checkout') ptPath = '/pt/checkout';
      else if (location.pathname === '/login') ptPath = '/pt/login';
      else if (location.pathname === '/register') ptPath = '/pt/register';
      else if (location.pathname === '/contacto') ptPath = '/pt/contacto';
      else if (location.pathname === '/perfil') ptPath = '/pt/perfil';
      else ptPath = '/pt' + location.pathname;
    }

    esEl.setAttribute('href', `https://raicesoficial.online${esPath}`);
    ptEl.setAttribute('href', `https://raicesoficial.online${ptPath}`);
    defaultEl.setAttribute('href', `https://raicesoficial.online${esPath}`);
  }, [location.pathname]);

  // Track page view GA4 event
  useEffect(() => {
    trackEvent('page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title
    });
  }, [location]);

  const handleLanguageChange = (newLang) => {
    if (newLang === lang) return;
    setLang(newLang);
    let newPath = location.pathname;
    if (newLang === 'pt') {
      if (newPath === '/') newPath = '/pt';
      else if (newPath === '/mates') newPath = '/pt/cuias';
      else if (newPath === '/yerba-mate') newPath = '/pt/erva-mate';
      else if (newPath === '/velas-y-sahumerios') newPath = '/pt/velas-e-incensos';
      else if (newPath.startsWith('/producto/')) newPath = newPath.replace('/producto/', '/pt/produto/');
      else if (newPath === '/checkout') newPath = '/pt/checkout';
      else if (newPath === '/login') newPath = '/pt/login';
      else if (newPath === '/register') newPath = '/pt/register';
      else if (newPath === '/contacto') newPath = '/pt/contacto';
      else if (newPath === '/perfil') newPath = '/pt/perfil';
      else if (!newPath.startsWith('/pt')) newPath = '/pt' + newPath;
    } else {
      if (newPath === '/pt') newPath = '/';
      else if (newPath === '/pt/cuias') newPath = '/mates';
      else if (newPath === '/pt/erva-mate') newPath = '/yerba-mate';
      else if (newPath === '/pt/velas-e-incensos') newPath = '/velas-y-sahumerios';
      else if (newPath.startsWith('/pt/produto/')) newPath = newPath.replace('/pt/produto/', '/producto/');
      else if (newPath === '/pt/checkout') newPath = '/checkout';
      else if (newPath === '/pt/login') newPath = '/login';
      else if (newPath === '/pt/register') newPath = '/register';
      else if (newPath === '/pt/contacto') newPath = '/contacto';
      else if (newPath === '/pt/perfil') newPath = '/perfil';
      else if (newPath.startsWith('/pt/')) newPath = newPath.replace('/pt/', '/');
    }
    navigate(newPath);
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (!couponEmail || !couponEmail.includes('@')) {
      setCouponEmailError(t('welcome_coupon_invalid_email'));
      return;
    }
    localStorage.setItem('raices-coupon-email', couponEmail);
    setCouponSubmitted(true);
    setCouponEmailError('');
  };

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

    let recId = 5;
    if (isMate) recId = 10;
    else if (isYerba) recId = 3;
    else if (isCafe) recId = 10;

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
    trackEvent('select_promotion', {
      promotion_name: 'Cart Sidebar Cross-Sell Recommendation',
      item_name: recProduct.name,
      creative_name: 'Sidebar Recommendation Card',
      location: 'Cart Drawer Sidebar'
    });

    showAlert(t('cart_alert_title'), `${recProduct.name} ${t('cart_alert_body')}`, 'success');
  };

  const handlePagamentoMP = () => {
    toggleCart();
    setIsMPModalOpen(true);
  };

  const closeCouponPopup = () => {
    localStorage.setItem('raices-coupon-popup-dismissed', '1');
    setIsCouponPopupOpen(false);
  };

  const homeUrl = lang === 'pt' ? '/pt' : '/';
  const matesUrl = lang === 'pt' ? '/pt/cuias' : '/mates';
  const yerbaUrl = lang === 'pt' ? '/pt/erva-mate' : '/yerba-mate';
  const velasUrl = lang === 'pt' ? '/pt/velas-e-incensos' : '/velas-y-sahumerios';
  const contactoUrl = lang === 'pt' ? '/pt/contacto' : '/contacto';
  const profileUrl = isAuthenticated && is2FAVerified 
    ? (lang === 'pt' ? '/pt/perfil' : '/perfil')
    : (lang === 'pt' ? '/pt/login' : '/login');

  return (
    <div className="app-container">
      {/* Header Global */}
      <header className="site-header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to={homeUrl} style={{ display: 'flex', alignItems: 'center' }}>
            <Logo width="150" />
          </Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><Link to={homeUrl}>{t('nav_home')}</Link></li>
            <li className="dropdown">
              <span className="dropdown-toggle" style={{ cursor: 'pointer' }}>
                {t('nav_products')} <span style={{ fontSize: '0.6rem', marginLeft: '0.2rem' }}>▼</span>
              </span>
              <ul className="dropdown-menu">
                <li><Link to={matesUrl}>{t('menu_mates')}</Link></li>
                <li><Link to={yerbaUrl}>{t('menu_yerba')}</Link></li>
                <li><Link to={velasUrl}>{t('menu_velas')}</Link></li>
              </ul>
            </li>
            <li><Link to={contactoUrl}>{t('nav_contact')}</Link></li>
          </ul>
        </nav>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {/* Seletor de Idiomas */}
          <div className="language-selector" style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', backgroundColor: 'var(--color-bg-secondary)', padding: '0.3rem 0.6rem', borderRadius: '20px', border: '1px solid #e0dfdb' }}>
            <button 
              onClick={() => handleLanguageChange('es')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: lang === 'es' ? 'var(--color-primary-green)' : '#888', 
                fontWeight: lang === 'es' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: lang === 'es' ? '#fff' : 'transparent',
                boxShadow: lang === 'es' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              ES
            </button>
            <button 
              onClick={() => handleLanguageChange('pt')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: lang === 'pt' ? 'var(--color-primary-green)' : '#888', 
                fontWeight: lang === 'pt' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: lang === 'pt' ? '#fff' : 'transparent',
                boxShadow: lang === 'pt' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              PT
            </button>
          </div>

          <Link to={profileUrl} style={{ fontSize: '1.2rem', textDecoration: 'none' }}>
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
          <h2>{t('nav_cart')}</h2>
          <button className="close-cart" onClick={toggleCart}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <p>{t('cart_empty')}</p>
            <button className="btn" onClick={toggleCart}>{t('continue_shopping')}</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => {
                const productUrl = lang === 'pt' ? `/pt/produto/${item.id}` : `/producto/${item.id}`;
                return (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={t(item.name)} loading="lazy" />
                    <div className="cart-item-details">
                      <h4><Link to={productUrl} onClick={toggleCart} style={{ color: 'inherit', textDecoration: 'none' }}>{t(item.name)}</Link></h4>
                      <p className="cart-item-price">{formatPrice(item.price)}</p>
                      <div className="cart-item-actions">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>{t('remove_item')}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Recomendação no Carrinho (Sprint 3) */}
            {(() => {
              const rec = getCartRecommendation();
              if (!rec) return null;
              const recUrl = lang === 'pt' ? `/pt/produto/${rec.id}` : `/producto/${rec.id}`;
              return (
                <div style={{ padding: '1rem', borderTop: '1px dashed #e0dfdb', borderBottom: '1px dashed #e0dfdb', backgroundColor: '#fdfcfb' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-highlight-terracotta)' }}>
                    {t('cart_cross_sell_title')}
                  </p>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <img src={rec.image} alt={t(rec.name)} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f0efeb' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Link to={recUrl} onClick={toggleCart} style={{ color: 'inherit', textDecoration: 'none' }}>{t(rec.name)}</Link>
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
                  <span>{t('subtotal')}:</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="total-line discount">
                  <span>{t('discount_label')}</span>
                  <span>{formatPrice(transferDiscountTotal)}</span>
                </div>
              </div>
              <div className="checkout-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <Link 
                  to={lang === 'pt' ? "/pt/checkout" : "/checkout"} 
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
        {/* Rotas em Espanhol (Default) */}
        <Route path="/" element={<Home heroImage={heroImage} collections={collections} featuredProducts={featuredProducts} />} />
        <Route path="/mates" element={<Category forcedSlug="mates-y-cuias" />} />
        <Route path="/yerba-mate" element={<Category forcedSlug="yerba-mate" />} />
        <Route path="/velas-y-sahumerios" element={<Category forcedSlug="velas-y-inciensos" />} />
        
        <Route path="/producto/:id" element={<ProductDetail products={featuredProducts} />} />
        <Route path="/categoria/:slug" element={<Category />} />
        <Route path="/colecciones/:slug" element={<Category />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
        <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/perfil/direcciones" element={<PrivateRoute><Addresses /></PrivateRoute>} />
        <Route path="/perfil/pagos" element={<PrivateRoute><Payments /></PrivateRoute>} />
        <Route path="/perfil/pedidos" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/perfil/favoritos" element={<PrivateRoute><Favorites /></PrivateRoute>} />

        {/* Rotas em Português (/pt) */}
        <Route path="/pt" element={<Home heroImage={heroImage} collections={collections} featuredProducts={featuredProducts} />} />
        <Route path="/pt/cuias" element={<Category forcedSlug="mates-y-cuias" />} />
        <Route path="/pt/erva-mate" element={<Category forcedSlug="yerba-mate" />} />
        <Route path="/pt/velas-e-incensos" element={<Category forcedSlug="velas-y-inciensos" />} />
        
        <Route path="/pt/produto/:id" element={<ProductDetail products={featuredProducts} />} />
        <Route path="/pt/checkout" element={<Checkout />} />
        <Route path="/pt/contacto" element={<Contact />} />
        <Route path="/pt/login" element={<Login />} />
        <Route path="/pt/register" element={<Register />} />
        <Route path="/pt/2fa" element={<TwoFactorAuth />} />
        <Route path="/pt/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/pt/perfil/direcciones" element={<PrivateRoute><Addresses /></PrivateRoute>} />
        <Route path="/pt/perfil/pagos" element={<PrivateRoute><Payments /></PrivateRoute>} />
        <Route path="/pt/perfil/pedidos" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/pt/perfil/favoritos" element={<PrivateRoute><Favorites /></PrivateRoute>} />
      </Routes>

      {/* Footer Global */}
      <footer className="site-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '3rem 1rem 2rem', borderTop: '1px solid rgba(28, 28, 24, 0.08)' }}>
        <Logo width="120" />
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{lang === 'pt' ? 'Mates Premium • Envios para toda a Argentina' : 'Mates Premium • Envíos a toda Argentina'}</p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>&copy; 2026 Raíces Artesanal Heritage. {lang === 'pt' ? 'Todos os direitos reservados.' : 'Todos los derechos reservados.'}</p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#aaa', marginTop: '0.4rem' }}>
          {lang === 'pt' ? 'Desenvolvido por' : 'Desarrollado por'} <a href="https://pstec.pavilasantana.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#1e3f20'} onMouseOut={(e) => e.target.style.color = '#666'}>PSTec</a>
        </p>
      </footer>

      {/* Botão Flutuante do WhatsApp */}
      <a href="https://wa.me/5491176419463" target="_blank" rel="noopener noreferrer" className="whatsapp-float">
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

            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>{t('qr_payment_title')}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{t('qr_payment_desc')}</p>

            <div style={{ border: '2px solid #009ee3', padding: '1rem', borderRadius: '12px', backgroundColor: '#fcfcfc', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=009ee3&data=${encodeURIComponent(`https://www.mercadopago.com.ar/checkout/pay?amount=${qrDiscountTotal}`)}`}
                alt="Mercado Pago QR Code"
                style={{ width: '180px', height: '180px' }}
              />
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>{t('qr_payment_total')}</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--color-accent-green)' }}>{formatPrice(qrDiscountTotal)}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
              <button 
                onClick={() => {
                  clearCart();
                  setIsMPModalOpen(false);
                  showAlert(t('alert_title_success'), t('checkout_success_message'), 'success');
                }} 
                className="btn" 
                style={{ width: '100%', padding: '0.8rem' }}
              >
                {t('qr_payment_done')}
              </button>
              <button
                onClick={() => setIsMPModalOpen(false)}
                style={{ width: '100%', padding: '0.8rem', background: 'none', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {t('qr_payment_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Coupon Popup with Email Capture (Sprint 3) */}
      {isCouponPopupOpen && (
        <div className="coupon-popup-overlay" onClick={closeCouponPopup}>
          <div className="coupon-popup-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-primary-green)', fontSize: '1.4rem', margin: '0 0 0.8rem 0' }}>
              {t('welcome_coupon_title')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 1.2rem 0', lineHeight: '1.5' }}>
              {t('welcome_coupon_desc')}
            </p>
            
            {!couponSubmitted ? (
              <form onSubmit={handleCouponSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                <input
                  type="email"
                  required
                  placeholder={t('welcome_coupon_email_placeholder')}
                  value={couponEmail}
                  onChange={(e) => setCouponEmail(e.target.value)}
                  style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.95rem' }}
                />
                {couponEmailError && (
                  <span style={{ color: '#d9534f', fontSize: '0.8rem', textAlign: 'left' }}>
                    {couponEmailError}
                  </span>
                )}
                <button type="submit" className="btn" style={{ padding: '0.8rem', fontWeight: 'bold' }}>
                  {t('welcome_coupon_submit')}
                </button>
              </form>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-accent-green)', fontWeight: 'bold', margin: 0 }}>
                  {t('welcome_coupon_success')}
                </p>
                <div className="coupon-code" style={{ fontSize: '1.5rem', letterSpacing: '2px', fontWeight: 'bold', backgroundColor: '#f4f1eb', padding: '0.8rem 2rem', borderRadius: '4px', border: '1px dashed var(--color-primary-green)', color: 'var(--color-primary-green)', width: '100%', textAlign: 'center' }}>
                  RAICES5
                </div>
                <button className="btn" onClick={closeCouponPopup} style={{ padding: '0.8rem 2rem' }}>
                  {t('welcome_coupon_btn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
