import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useCartStore } from './store/cartStore';

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
import { useAuthStore } from './store/authStore';

import './App.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

// Dados globais (Mockados para o MVP)
const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCHsbju6NpoYQE5I2h48DthEDcPpvQ4jhRiFDy0aomy52Yi9dwxZubW8sBSM5ROLwnof1fs8JQe51IMXHl2pUbRRVwiDkh8hBQaBf3-f265PCQAWIbBZr8h-v4EtM1YZIfOJlpZPJnWTZcGtOGqWNkZJiDj-FiHUpJvdsYC5Bh1pDIiLj0RpJbFIfoKo8zAYzotinFgHYKO1wazRQ8LxFoRHr6ofIdDvgm1-xem6Lrw0hat3Jl-hKUkP0R7qEArFeuuxh6JwaCKcoZM";
const collections = [
  { id: 1, title: "Cuias Artesanais", description: "Mates premium", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGniOY0C5GVh9fhgF4GNV_KkjVfH_4JGW7-pxzacj2eH9x4dR0VovB0kG3tdyp9WK4JGHSEVMo49khLtW3mZwQeqFLu4daZxSaVQ22Duypo8DQ9b64gBUsPOeI9jsI08u4ogwDr2TKbfXNnJCs9axWr6aZ9i1PZvXq6_nveIuA-ByrL1c6fQR47K_lrnwnEg5eeOrxE3arz0odJ3jjHYXZLGDPRrCzhAz21Oo4Q7IC9Bxi2tb3fFS-cm7U4nas4TTehHe79MjM2ryF" },
  { id: 2, title: "Ervas Especiais", description: "Blends autênticos", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGCD9syTpd148fvkt4a2DOHOoP7orD_sALeHGOOKjIcaPI27D2THhDwxkJte2xPDtlsxWZW0phIYrQP8fnkrIP0Zq6ktQv4TF5WNYZukr_lFlslAzX3egsgERWrU89P5JZkn7rOR-fv23n6n9WkBscwypGaUFb5rxN6k2WZ9Gm0iugvMhBhS7_r2Jap-FClCo_nH1lR7OYXxOdjZ6fC9icb5VxNBvRaJ-RgBOi2NoeuSvzWVtLTllfNS05z1U4VZTE05zDSKo5TmD0" },
  { id: 3, title: "Kits Presente", description: "Conjuntos essenciais", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkYmjnw3c-CB58V2cCUTemiCHy5HI4dxkLCyjIDcaHNHUieu1Bq3sl9MpewX8Pg3sJdLOkii2izeOs4kX1MDq7YYxlRZ1rupeH1BTEKGxNc3YDJZUlkFF0GWZCNtfDB9aZlNamr7yDTD5PNKkqW-_FWRgHuYEjwthNOFzVbcJugWRBbqQpeaAJp12q_Ad03fvfW46zGzQJtBbZH0dexO9MsJq5FbWDRLFz9JZ8f8i0vqt-J_TPbf-2yMdXtEMHM8ZmCtnIVStyZojA" }
];
export const featuredProducts = [
  { id: 1, name: "Mate Torpedo Premium", price: 45000, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3uBpTCWR4cn5bwTKdmWu648doP03WYxKq6AkuvIvAL_97XCZIqD-PAuCbkabTzz4YlIK5cTXQD1PIyPY0XxxxtiJNNfSklFe-iW_CEii5TC1ZbSPAPCPknZGwXYqryz5SM6DoVYkDJko3ed95jWTUB-Kb_RF8zRAWPGsJfcEVEJIBD2FwiZKXWm0r5UxAFwkCHnBt9OS76cSWYsXG7i35Kwpfpwpw33Hl17ZLuXVsYdVatwhUvpguYbmBOaBEcO1dt577IaMGpf-W" },
  { id: 2, name: "Mate Imperial Prata", price: 85000, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAac5uBWn9u61-r939Y6SoM7xWzdFF8g2mpqzZe_r4PFgO438j4YRbnDvMLGy7SPcW63fGiv-3n_RArPBmCLEHzA0U1TCq1U0XZzQC4IUY64VbJ8hB6PJ3sxELBzq5D6Ky-l-hAEG6iNw-FNLcV3eyDWRFCTiplmxEwnva9gHGh4Br-yDJjbYv_XYRYBUT0LNl-g8g9lCNj9DWgIw8qQNno819U97Em162UOkAJ1LeZV-4igp2W61Fsu4LF2KFdcdbIZu-2mCYCkNC7" },
  { id: 3, name: "Bombilha Alpaca", price: 32000, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBmlBhBigvVPWmjRnXVtxHCq90fBCnSQ3UF1n0_l0DsMdLqYa_vrv1kPIvL6vUh2FwQWVXBCaikseTcL9ilZUN9CN_XoTh2QnZa7z6R7myvjU8nqXBjt-gB0fx6W5jreTUlEyqWSyySZ4dyARMHfHGlvP1WUqv6_o2oOFz1B8rGdGNj8U5I2ga7Os2w84dPcqdSzhzH_DrN4hZDZVIOEf5IKuBpAeyr8DAQ2dMV4iFQjtynS8QbjD-kUYZhXgNl6W87yboBsG0rP5m" }
];

function App() {
  const [lang, setLang] = useState('ES');
  const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity } = useCartStore();
  const { isAuthenticated, is2FAVerified } = useAuthStore();

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountTotal = cartTotal * 0.9;
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

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
              <li><Link to="/">Home</Link></li>
              <li><Link to="/#produtos">Produtos</Link></li>
              <li><Link to="/contato">Contato</Link></li>
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
                    <span>{formatPrice(discountTotal)}</span>
                  </div>
                </div>
                <div className="checkout-options">
                  <button className="btn btn-mp">Pagar com Mercado Pago</button>
                  <Link to="/checkout" className="btn btn-transfer" onClick={toggleCart} style={{ textAlign: 'center', display: 'block' }}>
                    Checkout com Transferência
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
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/2fa" element={<TwoFactorAuth />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/perfil/enderecos" element={<Addresses />} />
          <Route path="/perfil/pagamentos" element={<Payments />} />
          <Route path="/perfil/pedidos" element={<Profile />} />
        </Routes>

        {/* Footer Global */}
        <footer className="site-footer">
          <h2>RAÍCES</h2>
          <p>Mates Premium • Envios para toda Argentina</p>
          <p>&copy; 2026 Raíces Artesanal Heritage. Todos os direitos reservados.</p>
        </footer>

        {/* Botão Flutuante do WhatsApp */}
        <a href="https://wa.me/5491100000000" target="_blank" rel="noopener noreferrer" className="whatsapp-float">
          ✆
        </a>
      </div>
    </Router>
  );
}

export default App;
