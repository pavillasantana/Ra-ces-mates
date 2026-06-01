import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';
import { goToTiendanubeCheckout } from '../utils/tiendanube';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export default function ProductDetail({ products }) {
  const { id } = useParams();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { t } = useTranslation();
  const { showAlert } = useModal();

  const product = products.find(p => p.id === parseInt(id));

  const handleBuyNow = () => {
    const redirected = goToTiendanubeCheckout(product?.tiendanubeProductId, 1);
    if (!redirected) {
      showAlert('Atenção', 'Este produto ainda não está configurado para compra direta.', 'warning');
    }
  };

  // Motor de Cross-Selling Dinâmico (Sprint 3)
  const recommendations = useMemo(() => {
    if (!product) return [];

    const isMate = product.category === 'mates-y-bombillas' || product.tags?.includes('Mate');
    const isYerba = product.category === 'yerba-mate' || product.tags?.includes('Yerba');
    const isCafe = product.category === 'cafe-de-especialidad' || product.tags?.includes('Café');

    if (isMate) {
      // Regra 1: Mate -> Erva-Mate Orgânica (5) + Vela Sândalo e Mel (10)
      return products.filter(p => p.id === 5 || p.id === 10);
    }
    if (isYerba) {
      // Regra 2: Yerba -> Mate Torpedo (1) + Bombilha Alpaca (3)
      return products.filter(p => p.id === 1 || p.id === 3);
    }
    if (isCafe) {
      // Regra 3: Café -> Vela Sândalo e Mel (10) + Incensos Copal/Lavanda (11)
      return products.filter(p => p.id === 10 || p.id === 11);
    }

    // Fallback: Erva Premium + Bombilla
    return products.filter(p => p.id === 5 || p.id === 3);
  }, [product, products]);

  const trackCrossSellClick = (recProduct) => {
    console.log(`%c📊 [GA4 EVENT DISPATCHED] select_promotion:`, 'color: #18281a; font-weight: bold; background-color: #f4f1eb; padding: 4px 8px; border: 1px solid #18281a; border-radius: 4px;', {
      promotion_name: `Cross-Sell recommendation from: ${product?.name}`,
      item_name: recProduct.name,
      creative_name: 'Cross-Sell Slider Item',
      location: 'Product Details Bottom'
    });
    if (window.gtag) {
      window.gtag('event', 'select_promotion', {
        promotion_name: `Cross-Sell recommendation from: ${product?.name}`,
        item_name: recProduct.name,
        creative_name: 'Cross-Sell Slider Item',
        location: 'Product Details Bottom'
      });
    }
  };

  const handleAddCrossSell = (recProduct) => {
    addToCart(recProduct);
    trackCrossSellClick(recProduct);
    showAlert('Producto Agregado', `${recProduct.name} se agregó al carrito.`, 'success');
  };

  if (!product) return <div style={{padding: '5rem', textAlign: 'center'}}>Produto não encontrado.</div>;

  return (
    <div style={{ backgroundColor: '#fcfaf6', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="product-detail-page" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '5rem 5%', backgroundColor: '#fff', borderBottom: '1px solid #e5e5e0' }}>
        <div className="product-detail-image" style={{ backgroundColor: '#fdfcfb', padding: '2rem', borderRadius: '12px', border: '1px solid #f0efeb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
        <div className="product-detail-info" style={{ padding: '1rem 0' }}>
          <span style={{ color: 'var(--color-highlight-terracotta)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            {product.category.toUpperCase()}
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', margin: '0.5rem 0 1rem 0', color: 'var(--color-primary-green)' }}>{product.name}</h1>
          <p className="product-price" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-highlight-terracotta)', marginBottom: '2rem' }}>{formatPrice(product.price)}</p>

          <p style={{ lineHeight: '1.8', marginBottom: '2rem', color: '#555', fontSize: '1.05rem' }}>
            Este é um produto autêntico Raíces, cuidadosamente artesanal e curado para apoiar o seu ritual diário de bem-estar.
            <br /><br />
            <strong>Aviso Importante:</strong> Nossos produtos são produzidos com matérias-primas nobres, unindo a tradição à sofisticação contemporânea.
          </p>

          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <button className="btn" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={() => addToCart(product)}>
              Adicionar ao Carrinho
            </button>
            <button className="btn btn-outline" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={handleBuyNow}>
              Comprar Agora
            </button>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem' }} 
              onClick={() => {
                toggleFavorite(product);
                showAlert('Favoritos', isFavorite(product.id) ? 'Removido dos favoritos!' : 'Adicionado aos favoritos!', 'success');
              }}
            >
              {isFavorite(product.id) ? '♥ Remover dos Favoritos' : '♡ Adicionar aos Favoritos'}
            </button>
          </div>
        </div>
      </div>

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
            {recommendations.map(rec => (
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
                  alt={rec.name} 
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #f0efeb' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <Link to={`/produto/${rec.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{rec.name}</Link>
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
}