import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { featuredProducts } from '../data/products';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { goToTiendanubeCheckout } from '../utils/tiendanube';

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

export default function Category() {
  const { slug } = useParams();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const products = useMemo(() => {
    const base = featuredProducts.filter(p => p.category === slug || (slug === 'ervas' && p.category === 'ervas'));
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
    const redirected = goToTiendanubeCheckout(product.tiendanubeProductId, 1);
    if (!redirected) alert('Produto sem ID da Tiendanube configurado.');
  };

  return (
    <div style={{ padding: '5rem 5%', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textTransform: 'capitalize' }}>Categoria: {slug}</h2>
      <div className="filters-bar" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Buscar nesta categoria"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-control"
        />
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
      {products.length === 0 ? (
        <p>Nenhum produto encontrado nesta categoria.</p>
      ) : (
        <div className="product-grid">
          {products.map(product => (
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
    </div>
  );
}