import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';
import { trackEvent } from '../utils/analytics';

export default function ProductDetail({ products }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { t, formatPrice, lang } = useTranslation();
  const { showAlert } = useModal();

  const product = products.find(p => p.id === parseInt(id));

  const getCategoryTitle = (categorySlug) => {
    if (categorySlug === 'mates-y-cuias') return t('menu_mates');
    if (categorySlug === 'yerba-mate') return t('menu_yerba');
    if (categorySlug === 'velas-y-inciensos') return t('menu_velas');
    return categorySlug;
  };

  const handleBuyNow = () => {
    addToCart(product);
    // Dispatch begin_checkout event
    trackEvent('begin_checkout', {
      value: product.price,
      currency: 'ARS',
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        price: product.price,
        quantity: 1
      }]
    });
    navigate(lang === 'pt' ? '/pt/checkout' : '/checkout');
  };

  useEffect(() => {
    if (product) {
      // Dispatch view_item event
      trackEvent('view_item', {
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
  }, [product]);

  // Motor de Cross-Selling Dinâmico (Sprint 3)
  const recommendations = useMemo(() => {
    if (!product) return [];

    const isMate = product.category === 'mates-y-bombillas' || product.tags?.includes('Mate');
    const isYerba = product.category === 'yerba-mate' || product.tags?.includes('Yerba');
    const isCafe = product.category === 'cafe-de-especialidad' || product.tags?.includes('Café');

    if (isMate) {
      return products.filter(p => p.id === 5 || p.id === 10);
    }
    if (isYerba) {
      return products.filter(p => p.id === 1 || p.id === 3);
    }
    if (isCafe) {
      return products.filter(p => p.id === 10 || p.id === 11);
    }

    return products.filter(p => p.id === 5 || p.id === 3);
  }, [product, products]);

  const trackCrossSellClick = (recProduct) => {
    trackEvent('select_promotion', {
      promotion_name: `Cross-Sell recommendation from: ${product?.name}`,
      item_name: recProduct.name,
      creative_name: 'Cross-Sell Slider Item',
      location: 'Product Details Bottom'
    });
  };

  const handleAddCrossSell = (recProduct) => {
    addToCart(recProduct);
    trackCrossSellClick(recProduct);
    showAlert(t('cart_alert_title'), `${recProduct.name} ${t('cart_alert_body')}`, 'success');
  };

  // Localized mock reviews
  const mockReviews = useMemo(() => {
    if (!product) return [];
    if (lang === 'pt') {
      return [
        { id: 1, author: 'Rodrigo M.', rating: 5, text: 'Qualidade excepcional. Superou minhas expectativas, acabamento impecável.', date: '12 de Maio de 2026' },
        { id: 2, author: 'Camila S.', rating: 5, text: 'Perfeito para o meu ritual diário. Recomendo de olhos fechados.', date: '28 de Abril de 2026' }
      ];
    } else {
      return [
        { id: 1, author: 'Rodrigo M.', rating: 5, text: 'Calidad excepcional. Superó mis expectativas, terminación impecable.', date: '12 de Mayo de 2026' },
        { id: 2, author: 'Camila S.', rating: 5, text: 'Perfecto para mi ritual diario. Lo recomiendo con los ojos cerrados.', date: '28 de Abril de 2026' }
      ];
    }
  }, [product, lang]);

  if (!product) return <div style={{padding: '5rem', textAlign: 'center'}}>{t('product_not_found')}</div>;

  return (
    <div style={{ backgroundColor: '#fcfaf6', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="product-detail-page" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '5rem 5%', backgroundColor: '#fff', borderBottom: '1px solid #e5e5e0' }}>
        <div className="product-detail-image" style={{ backgroundColor: '#fdfcfb', padding: '2rem', borderRadius: '12px', border: '1px solid #f0efeb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={product.image} alt={t(product.name)} style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
        <div className="product-detail-info" style={{ padding: '1rem 0' }}>
          <span style={{ color: 'var(--color-highlight-terracotta)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            {getCategoryTitle(product.category).toUpperCase()}
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', margin: '0.5rem 0 0.5rem 0', color: 'var(--color-primary-green)' }}>{t(product.name)}</h1>
          
          {/* Reviews Star Rating Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: '#f5a623' }}>★★★★★</span>
            <strong style={{ color: '#333' }}>4.9</strong>
            <span style={{ color: '#777' }}>({lang === 'pt' ? '18 avaliações' : '18 opiniones'})</span>
          </div>

          <p className="product-price" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-highlight-terracotta)', marginBottom: '2rem' }}>{formatPrice(product.price)}</p>

          <p style={{ lineHeight: '1.8', marginBottom: '2rem', color: '#555', fontSize: '1.05rem' }}>
            {t('product_detail_desc')}
            <br /><br />
            <strong>{t('product_detail_warning_label')}</strong> {t('product_detail_warning_text')}
          </p>

          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <button className="btn" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={() => addToCart(product)}>
              {t('add_to_cart_detail')}
            </button>
            <button className="btn btn-outline" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={handleBuyNow}>
              {t('buy_now_detail')}
            </button>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem' }} 
              onClick={() => {
                toggleFavorite(product);
                showAlert(t('fav_alert_title'), isFavorite(product.id) ? t('fav_alert_removed') : t('fav_alert_added'), 'success');
              }}
            >
              {isFavorite(product.id) ? t('fav_remove') : t('fav_add')}
            </button>
          </div>
        </div>
      </div>

      {/* Bloco de Avaliações / Reviews (Visual Trust Seals) */}
      <section style={{ padding: '4rem 5%', maxWidth: '1200px', margin: '0 auto', borderBottom: '1px solid #e5e5e0' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', color: 'var(--color-primary-green)', marginBottom: '2rem' }}>
          {lang === 'pt' ? 'Opiniões dos Clientes' : 'Opiniones de los Clientes'}
        </h3>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {mockReviews.map(review => (
            <div key={review.id} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0dfdb', boxShadow: 'var(--shadow-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{review.author}</span>
                <span style={{ fontSize: '0.8rem', color: '#777' }}>{review.date}</span>
              </div>
              <div style={{ color: '#f5a623', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                {'★'.repeat(review.rating)}
              </div>
              <p style={{ margin: 0, color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>{review.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bloco de Cross-Selling Dinâmico (Sprint 3) */}
      {recommendations.length > 0 && (
        <section className="cross-sell-section" style={{ padding: '4rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--color-primary-green)', margin: '0 0 0.5rem 0' }}>
              {t('cross_sell_title')}
            </h3>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
              {t('cross_sell_subtitle')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', justifyContent: 'center' }}>
            {recommendations.map(rec => {
              const recUrl = lang === 'pt' ? `/pt/produto/${rec.id}` : `/producto/${rec.id}`;
              return (
                <div 
                  key={rec.id} 
                  style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e0dfdb', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                  }}
                >
                  <img 
                    src={rec.image} 
                    alt={t(rec.name)} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #f0efeb' }} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <Link to={recUrl} style={{ color: 'inherit', textDecoration: 'none' }} onClick={() => trackCrossSellClick(rec)}>{t(rec.name)}</Link>
                    </h4>
                    <span style={{ color: 'var(--color-highlight-terracotta)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {formatPrice(rec.price)}
                    </span>
                    <button 
                      onClick={() => handleAddCrossSell(rec)}
                      className="btn" 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.8rem', 
                        alignSelf: 'flex-start',
                        backgroundColor: 'var(--color-primary-green)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      + {t('cross_sell_add')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}