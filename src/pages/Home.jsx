import { useCartStore } from '../store/cartStore';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export default function Home({ heroImage, collections, featuredProducts }) {
  const { addToCart } = useCartStore();

  return (
    <main className="main-content">
      <section className="hero" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-content" style={{ backgroundColor: 'rgba(252, 249, 243, 0.85)', padding: '3rem', borderRadius: '8px' }}>
          <span className="badge">Nova Coleção</span>
          <h2>Artesanal Heritage</h2>
          <p>Mates pintados à mão que conectam o design contemporâneo à nossa verdadeira essência e tradição sul-americana.</p>
          <a href="#colecoes" className="btn">Descubra as Cuias</a>
        </div>
      </section>

      <section id="colecoes" className="collections-section">
        <h2 className="section-title">Nossas Coleções</h2>
        <div className="collections-grid">
          {collections.map(col => (
            <div key={col.id} className="collection-card">
              <img src={col.image} alt={col.title} />
              <div className="collection-content">
                <h3>{col.title}</h3>
                <p>{col.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="produtos" className="products-section">
        <h2 className="section-title">Destaques Essenciais</h2>
        <div className="product-grid">
          {featuredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrap">
                <a href={`/produto/${product.id}`} style={{display: 'block', height: '100%'}}>
                  <img src={product.image} alt={product.name} />
                </a>
              </div>
              <div className="product-info">
                <h3><a href={`/produto/${product.id}`}>{product.name}</a></h3>
                <p className="product-price">{formatPrice(product.price)}</p>
                <button className="btn btn-outline" onClick={() => addToCart(product)}>Adicionar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
