import { useMemo, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';

const matchesPriceRange = (price, priceRange) => {
  if (priceRange === 'all') return true;
  if (priceRange === 'upTo20k') return price <= 20000;
  if (priceRange === '20kTo60k') return price > 20000 && price <= 60000;
  if (priceRange === 'above60k') return price > 60000;
  return true;
};

export default function Home({ heroImage, collections, featuredProducts }) {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { t, formatPrice, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const results = featuredProducts.filter((product) => {
      const matchesSearch = normalizedQuery === '' || product.name.toLowerCase().includes(normalizedQuery);
      const matchesCat = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = matchesPriceRange(product.price, priceRange);
      return matchesSearch && matchesCat && matchesPrice;
    });

    if (sortBy === 'priceAsc') return results.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') return results.sort((a, b) => b.price - a.price);
    if (sortBy === 'nameAsc') return results.sort((a, b) => a.name.localeCompare(b.name));
    return results; // relevance default
  }, [featuredProducts, searchTerm, selectedCategory, priceRange, sortBy]);

  const handleBuyNow = (product) => {
    addToCart(product);
    // Dispatch purchase related begin checkout GA4 event
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        value: product.price,
        currency: 'ARS',
        items: [{
          item_id: String(product.id),
          item_name: product.name,
          price: product.price,
          quantity: 1
        }]
      });
    }
    navigate(lang === 'pt' ? '/pt/checkout' : '/checkout');
  };

  const handleCollectionClick = (colTitle) => {
    // GA4 select_promotion view item list
    console.log(`%c📊 [GA4 EVENT DISPATCHED] select_promotion:`, 'color: #18281a; font-weight: bold; background-color: #f4f1eb; padding: 4px 8px; border: 1px solid #18281a; border-radius: 4px;', {
      promotion_name: `Collection: ${colTitle}`,
      creative_name: 'Homepage Collection Grid Card',
      location: 'Homepage'
    });
    if (window.gtag) {
      window.gtag('event', 'select_promotion', {
        promotion_name: `Collection: ${colTitle}`,
        creative_name: 'Homepage Collection Grid Card',
        location: 'Homepage'
      });
    }
  };

  return (
    <main className="main-content">
      {/* Hero Section Premium */}
      <section className="hero" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-content" style={{ backgroundColor: 'rgba(252, 249, 243, 0.9)', padding: '3.5rem', borderRadius: '12px', maxWidth: '550px', border: '1px solid rgba(156, 108, 80, 0.2)' }}>
          <span className="badge" style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-highlight-terracotta)', fontWeight: 'bold' }}>
            Ritual Diario
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', margin: '0.8rem 0', color: 'var(--color-primary-green)' }}>
            {t('hero_title')}
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#4a4a4a', lineHeight: '1.6', marginBottom: '1.8rem' }}>
            {t('hero_subtitle')}
          </p>
          <a href="#colecoes" className="btn" style={{ padding: '1rem 2rem', fontSize: '1rem', letterSpacing: '1px' }}>
            {t('hero_cta')}
          </a>
        </div>
      </section>

      {/* Sección de Categorías: Explorá Nuestros Rituales */}
      <section id="colecoes" className="collections-section">
        <h2 className="section-title">
          {t('explore_rituals')}
        </h2>
        <div className="collections-grid">
          {collections.map(col => {
            let targetLink = `/colecciones/${col.slug}`;
            if (col.slug === 'mates-y-cuias') targetLink = lang === 'pt' ? '/pt/cuias' : '/mates';
            else if (col.slug === 'yerba-mate') targetLink = lang === 'pt' ? '/pt/erva-mate' : '/yerba-mate';
            else if (col.slug === 'velas-y-inciensos') targetLink = lang === 'pt' ? '/pt/velas-e-incensos' : '/velas-y-sahumerios';
            
            return (
              <Link 
                key={col.id} 
                to={targetLink} 
                onClick={() => handleCollectionClick(t(col.title))}
                className="collection-card" 
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <img src={col.image} alt={t(col.title)} />
                <div className="collection-content">
                  <h3>{t(col.title)}</h3>
                  <p>{t(col.description)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sección Kits & Combos (Venda Casada) */}
      <section className="combos-section" style={{ padding: '4rem 5%', backgroundColor: '#fcfbf7', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            {lang === 'pt' ? 'Kits & Combos Promocionais' : 'Kits y Combos Promocionales'}
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            {lang === 'pt' 
              ? 'Adquira nossos rituais completos com condições especiais e descontos exclusivos.' 
              : 'Adquirí nuestros rituales completos con condiciones especiales y descuentos exclusivos.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Combo 1 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-subtle)', display: 'flex', flexDirection: 'column', border: '1px solid #f0efeb' }}>
              <div style={{ position: 'relative', height: '220px' }}>
                <img 
                  src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600&auto=format&fit=crop" 
                  alt="Combo Ritual Raíces" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <span className="product-badge sale" style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#d9534f', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px' }}>15% OFF</span>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--color-primary-green)' }}>
                    Combo Ritual Raíces
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem 0' }}>
                    {lang === 'pt' 
                      ? 'Kit completo para iniciar seu ritual: Cuia Torpedo Premium, Bomba de Alpaca e Erva-Mate Orgânica.' 
                      : 'Kit completo para iniciar tu ritual: Mate Torpedo Premium, Bombilla de Alpaca y Yerba Mate Orgánica.'}
                  </p>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#555', margin: '0 0 1.5rem 0' }}>
                    <li>1x Mate Torpedo Premium</li>
                    <li>1x Bombilla de Alpaca</li>
                    <li>1x Yerba Mate Orgánica Premium 500g</li>
                  </ul>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-accent-green)' }}>
                      {formatPrice(75650)}
                    </span>
                    <span style={{ fontSize: '0.9rem', textDecoration: 'line-through', color: '#999' }}>
                      {formatPrice(89000)}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const prod1 = featuredProducts.find(p => p.id === 1);
                      const prod3 = featuredProducts.find(p => p.id === 3);
                      const prod5 = featuredProducts.find(p => p.id === 5);
                      if (prod1 && prod3 && prod5) {
                        addToCart(prod1);
                        addToCart(prod3);
                        addToCart(prod5);
                        showAlert(
                          lang === 'pt' ? 'Combo Adicionado' : 'Combo Agregado', 
                          lang === 'pt' ? 'O Combo Ritual Raíces foi adicionado ao seu carrinho!' : '¡El Combo Ritual Raíces fue agregado a tu carrito!', 
                          'success'
                        );
                      }
                    }} 
                    className="btn" 
                    style={{ width: '100%' }}
                  >
                    {lang === 'pt' ? 'Adicionar Combo' : 'Agregar Combo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Combo 2 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-subtle)', display: 'flex', flexDirection: 'column', border: '1px solid #f0efeb' }}>
              <div style={{ position: 'relative', height: '220px' }}>
                <img 
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop" 
                  alt="Combo Armonía del Hogar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <span className="product-badge sale" style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#d9534f', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px' }}>10% OFF</span>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--color-primary-green)' }}>
                    {lang === 'pt' ? 'Combo Harmonia do Lar' : 'Combo Armonía del Hogar'}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem 0' }}>
                    {lang === 'pt' 
                      ? 'Transforme seu ambiente com aromas selecionados: Vela Aromática de Sândalo e Incensos Naturais.' 
                      : 'Transformá tu ambiente con aromas seleccionados: Vela Aromática de Sándalo y Sahumerios Naturales.'}
                  </p>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#555', margin: '0 0 1.5rem 0' }}>
                    <li>1x Vela Aromática de Sándalo y Miel</li>
                    <li>1x Sahumerios Naturais de Copal y Lavanda</li>
                  </ul>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-accent-green)' }}>
                      {formatPrice(20250)}
                    </span>
                    <span style={{ fontSize: '0.9rem', textDecoration: 'line-through', color: '#999' }}>
                      {formatPrice(22500)}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const prod10 = featuredProducts.find(p => p.id === 10);
                      const prod11 = featuredProducts.find(p => p.id === 11);
                      if (prod10 && prod11) {
                        addToCart(prod10);
                        addToCart(prod11);
                        showAlert(
                          lang === 'pt' ? 'Combo Adicionado' : 'Combo Agregado', 
                          lang === 'pt' ? 'O Combo Harmonia do Lar foi adicionado ao seu carrinho!' : '¡El Combo Armonía del Hogar fue agregado a tu carrito!', 
                          'success'
                        );
                      }
                    }} 
                    className="btn" 
                    style={{ width: '100%' }}
                  >
                    {lang === 'pt' ? 'Adicionar Combo' : 'Agregar Combo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="produtos" className="products-section">
        <h2 className="section-title">{t('featured_essentials')}</h2>
        <div className="filters-bar">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-control"
          />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-control">
            <option value="all">{t('all_categories')}</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.slug}>{t(collection.title)}</option>
            ))}
          </select>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="filter-control">
            <option value="all">{t('all_ranges')}</option>
            <option value="upTo20k">{t('up_to_20k')}</option>
            <option value="20kTo60k">{t('range_20k_to_60k')}</option>
            <option value="above60k">{t('above_60k')}</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-control">
            <option value="relevance">{t('sortBy_relevance')}</option>
            <option value="priceAsc">{t('sortBy_priceAsc')}</option>
            <option value="priceDesc">{t('sortBy_priceDesc')}</option>
            <option value="nameAsc">{t('sortBy_nameAsc')}</option>
          </select>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="products-empty">{t('no_products_found')}</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => {
              const productUrl = lang === 'pt' ? `/pt/produto/${product.id}` : `/producto/${product.id}`;
              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrap">
                    {product.badge && (
                      <span className={`product-badge ${product.badge}`}>
                        {t(`badge_${product.badge}`)}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`favorite-btn ${isFavorite(product.id) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(product)}
                    >
                      {isFavorite(product.id) ? '♥' : '♡'}
                    </button>
                    <Link to={productUrl} style={{display: 'block', height: '100%'}}>
                      <img src={product.image} alt={t(product.name)} loading="lazy" />
                    </Link>
                  </div>
                  <div className="product-info">
                    <h3><Link to={productUrl}>{t(product.name)}</Link></h3>
                    <p className="product-price">{formatPrice(product.price)}</p>
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                      <button className="btn btn-outline" onClick={() => addToCart(product)}>{t('add_to_cart')}</button>
                      <button className="btn" onClick={() => handleBuyNow(product)}>{t('buy_now')}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}