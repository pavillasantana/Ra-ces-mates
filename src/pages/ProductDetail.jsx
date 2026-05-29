import { useParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { goToTiendanubeCheckout } from '../utils/tiendanube';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export default function ProductDetail({ products }) {
  const { id } = useParams();
  const { addToCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const product = products.find(p => p.id === parseInt(id));

  const handleBuyNow = () => {
    const redirected = goToTiendanubeCheckout(product?.tiendanubeProductId, 1);
    if (!redirected) {
      alert('Este produto ainda não está configurado para compra direta.');
    }
  };

  if (!product) return <div style={{padding: '5rem', textAlign: 'center'}}>Produto não encontrado.</div>;

  return (
    <div className="product-detail-page" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '5rem 5%', backgroundColor: '#fff', minHeight: '80vh' }}>
      <div className="product-detail-image" style={{ backgroundColor: '#f5f5f5', padding: '2rem', borderRadius: '8px' }}>
        <img src={product.image} alt={product.name} style={{ width: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
      </div>
      <div className="product-detail-info" style={{ padding: '2rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.name}</h1>
        <p className="product-price" style={{ fontSize: '1.8rem', color: 'var(--color-highlight-terracotta)', marginBottom: '2rem' }}>{formatPrice(product.price)}</p>

        <p style={{ lineHeight: '1.8', marginBottom: '2rem', color: '#555' }}>
          Este é um produto autêntico Raíces, cuidadosamente artesanal. Perfeito para rituais diários, unindo durabilidade e um design táctil e minimalista.
          <br /><br />
          <strong>Aviso Importante:</strong> Siga o guia de cura antes do primeiro uso. Não garantimos quebras por choque térmico em cuias orgânicas mal curadas.
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <button className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => addToCart(product)}>
            Adicionar ao Carrinho
          </button>
          <button className="btn btn-outline" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={handleBuyNow}>
            Comprar
          </button>
          <button className="btn btn-outline" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => toggleFavorite(product)}>
            {isFavorite(product.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
          </button>
        </div>
      </div>
    </div>
  );
}