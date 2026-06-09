import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { featuredProducts } from '../data/products';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';

const matchesPriceRange = (price, priceRange) => {
  if (priceRange === 'all') return true;
  if (priceRange === 'upTo20k') return price <= 20000;
  if (priceRange === '20kTo60k') return price > 20000 && price <= 60000;
  if (priceRange === 'above60k') return price > 60000;
  return true;
};

export default function Category({ forcedSlug }) {
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams();
  const slug = forcedSlug || routeSlug;
  
  const { showAlert } = useModal();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { t, formatPrice, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const products = useMemo(() => {
    const base = featuredProducts.filter(p => p.category === slug);
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = base.filter((product) => {
      const matchesSearch = normalizedQuery === '' || product.name.toLowerCase().includes(normalizedQuery);
      const matchesPrice = matchesPriceRange(product.price, priceRange);
      return matchesSearch && matchesPrice;
    });

    if (sortBy === 'priceAsc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') return [...filtered].sort((a, b) => b.price - a.price);
    if (sortBy === 'nameAsc') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [slug, searchTerm, priceRange, sortBy]);

  const handleBuyNow = (product) => {
    addToCart(product);
    navigate(lang === 'pt' ? '/pt/checkout' : '/checkout');
  };

  const getCategoryTitle = (categorySlug) => {
    if (categorySlug === 'mates-y-cuias') return t('menu_mates');
    if (categorySlug === 'yerba-mate') return t('menu_yerba');
    if (categorySlug === 'velas-y-inciensos') return t('menu_velas');
    return categorySlug;
  };

  return (
    <div style={{ padding: '5rem 5%', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--color-primary-green)', fontFamily: "'Playfair Display', serif" }}>
        {t('category_title')}: {getCategoryTitle(slug)}
      </h1>
      <div className="filters-bar" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder={t('search_category_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-control"
        />
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
      {products.length === 0 ? (
        <p>{t('no_products_category')}</p>
      ) : (
        <div className="product-grid">
          {products.map(product => {
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
    </div>
  );
}