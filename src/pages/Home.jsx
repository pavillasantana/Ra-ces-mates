import { useMemo, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { goToTiendanubeCheckout } from '../utils/tiendanube';
import { useModal } from '../components/ModalProvider';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

const matchesPriceRange = (price, priceRange) => {
  if (priceRange === 'all') return true;
  if (priceRange === 'upTo20k') return price <= 20000;
  if (priceRange === '20kTo60k') return price > 20000 && price <= 60000;
  if (priceRange === 'above60k') return price > 60000;
  return true;
};

export default function Home({ heroImage, collections, featuredProducts }) {
  const { showAlert } = useModal();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const results = featuredProducts.filter((product) => {
      const matchesSearch = normalizedQuery === '' || product.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = matchesPriceRange(product.price, priceRange);
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy === 'priceAsc') return [...results].sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') return [...results].sort((a, b) => b.price - a.price);
    if (sortBy === 'nameAsc') return [...results].sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, [featuredProducts, searchTerm, selectedCategory, priceRange, sortBy]);

  const handleBuyNow = (product) => {
    const redirected = goToTiendanubeCheckout(product.tiendanubeProductId, 1);
    if (!redirected) showAlert('Tiendanube', 'Produto sem ID da Tiendanube configurado.', 'error');
  };

  const trackGA4Event = (eventName, params) => {
    console.log(`%c📊 [GA4 EVENT DISPATCHED] ${eventName}:`, 'color: #18281a; font-weight: bold; background-color: #f4f1eb; padding: 4px 8px; border: 1px solid #18281a; border-radius: 4px;', params);
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }
  };

  const handleSealClick = (sealTitle) => {
    trackGA4Event('select_promotion', {
      promotion_name: sealTitle,
      creative_name: 'Trust Seals Grid',
      location: 'Homepage Footer/Mid'
    });
  };

  const handleCollectionClick = (colTitle) => {
    trackGA4Event('view_item_list', {
      item_list_name: 'Collections Grid',
      category: colTitle
    });
  };

  return (
    <main className="main-content">
      {/* Hero Section Premium */}
      <section className="hero" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-content" style={{ backgroundColor: 'rgba(252, 249, 243, 0.9)', padding: '3.5rem', borderRadius: '12px', maxWidth: '550px', border: '1px solid rgba(156, 108, 80, 0.2)' }}>
          <span className="badge" style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-highlight-terracotta)', fontWeight: 'bold' }}>
            {t('nav_home') === 'Inicio' ? 'Ritual Diario' : 'Ritual Diário'}
          </span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', margin: '0.8rem 0', color: 'var(--color-primary-green)' }}>
            {t('hero_title')}
          </h2>
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
          {t('nav_home') === 'Inicio' ? 'Explorá Nuestros Rituales' : 'Explore Nossos Rituais'}
        </h2>
        <div className="collections-grid">
          {collections.map(col => (
            <Link 
              key={col.id} 
              to={`/colecciones/${col.slug}`} 
              onClick={() => handleCollectionClick(col.title)}
              className="collection-card" 
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <img src={col.image} alt={col.title} />
              <div className="collection-content">
                <h3>{col.title}</h3>
                <p>{col.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="produtos" className="products-section">
        <h2 className="section-title">Destaques Essenciais</h2>
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Buscar produto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-control"
          />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-control">
            <option value="all">Todas categorias</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.slug}>{collection.title}</option>
            ))}
          </select>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="filter-control">
            <option value="all">Todas faixas</option>
            <option value="upTo20k">Até ARS 20.000</option>
            <option value="20kTo60k">ARS 20.001 a 60.000</option>
            <option value="above60k">Acima de ARS 60.000</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-control">
            <option value="relevance">Mais relevantes</option>
            <option value="priceAsc">Menor preço</option>
            <option value="priceDesc">Maior preço</option>
            <option value="nameAsc">Nome (A-Z)</option>
          </select>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="products-empty">Nenhum produto encontrado com os filtros aplicados.</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <button
                    type="button"
                    className={`favorite-btn ${isFavorite(product.id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(product)}
                  >
                    {isFavorite(product.id) ? '♥' : '♡'}
                  </button>
                  <Link to={`/produto/${product.id}`} style={{display: 'block', height: '100%'}}>
                    <img src={product.image} alt={product.name} />
                  </Link>
                </div>
                <div className="product-info">
                  <h3><Link to={`/produto/${product.id}`}>{product.name}</Link></h3>
                  <p className="product-price">{formatPrice(product.price)}</p>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <button className="btn btn-outline" onClick={() => addToCart(product)}>Adicionar</button>
                    <button className="btn" onClick={() => handleBuyNow(product)}>Comprar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}