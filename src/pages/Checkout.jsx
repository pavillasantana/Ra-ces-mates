import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import '../components/CheckoutTransfer.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', endereco: '', cidade: '', provincia: '', metodoFrete: 'mensajeria'
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountTotal = cartTotal * 0.9;
  
  // Cálculo de frete dinâmico simulado
  const freteBase = formData.metodoFrete === 'mensajeria' ? 3500 : 7000;
  const totalFinal = discountTotal + freteBase;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWhatsAppCheckout = () => {
    const orderItems = cart.map(item => `${item.quantity}x ${item.name}`).join('%0A');
    const metodoFreteNome = formData.metodoFrete === 'mensajeria' ? 'Motomensajería (CABA/GBA)' : 'Correo Argentino (Interior)';
    
    const message = `*NOVO PEDIDO - RAÍCES*%0A%0A*Cliente:* ${formData.nome}%0A*Email:* ${formData.email}%0A*WhatsApp:* ${formData.telefone}%0A*Endereço:* ${formData.endereco}, ${formData.cidade} - ${formData.provincia}%0A%0A*Itens:*%0A${orderItems}%0A%0A*Frete Escolhido:* ${metodoFreteNome} (${formatPrice(freteBase)})%0A*Total a Pagar (com Transferência):* ${formatPrice(totalFinal)}%0A%0A_Aguardando envio do comprovante para o alias: RAICES.MATE_`;
    
    window.open(`https://wa.me/5491100000000?text=${message}`, '_blank');
    clearCart();
    navigate('/');
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Seu carrinho está vazio.</h2>
        <button className="btn" onClick={() => navigate('/')}>Voltar para a loja</button>
      </div>
    );
  }

  return (
    <div className="checkout-transfer-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Voltar para a loja</button>
      
      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>1. Dados de Entrega e Logística</h2>
          <form>
            <div className="form-group">
              <label>Nome Completo</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input type="text" name="telefone" value={formData.telefone} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Endereço Completo (Rua, Número, Piso/Depto)</label>
              <input type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cidade / Localidad</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Província</label>
                <input type="text" name="provincia" value={formData.provincia} onChange={handleInputChange} required />
              </div>
            </div>

            <h3 style={{marginTop: '2rem', marginBottom: '1rem'}}>Opções de Frete</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer'}}>
                <input type="radio" name="metodoFrete" value="mensajeria" checked={formData.metodoFrete === 'mensajeria'} onChange={handleInputChange} />
                <div style={{flex: 1}}>
                  <strong>Motomensajería Express (CABA/GBA)</strong>
                  <p style={{fontSize: '0.85rem', color: '#666'}}>Entrega em até 24h úteis</p>
                </div>
                <strong style={{color: 'var(--color-highlight-terracotta)'}}>{formatPrice(3500)}</strong>
              </label>

              <label style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer'}}>
                <input type="radio" name="metodoFrete" value="correo" checked={formData.metodoFrete === 'correo'} onChange={handleInputChange} />
                <div style={{flex: 1}}>
                  <strong>Correo Argentino (Interior do País)</strong>
                  <p style={{fontSize: '0.85rem', color: '#666'}}>3 a 7 dias úteis</p>
                </div>
                <strong style={{color: 'var(--color-highlight-terracotta)'}}>{formatPrice(7000)}</strong>
              </label>
            </div>
          </form>

          <div className="payment-instructions">
            <h2>2. Dados Bancários</h2>
            <p>Realize a transferência para garantir o desconto de 10% no pedido.</p>
            <div className="bank-card">
              <p><strong>Banco:</strong> Banco Galicia</p>
              <p><strong>Titular:</strong> Raíces Artesanal S.A.</p>
              <p><strong>CBU:</strong> 0070000000000000000000</p>
              <p><strong>Alias:</strong> RAICES.MATE</p>
            </div>
          </div>
        </div>

        <div className="checkout-summary">
          <h2>Resumo do Pedido</h2>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id} className="summary-item">
                <img src={item.image} alt={item.name} />
                <div className="summary-item-info">
                  <h4>{item.name}</h4>
                  <p>Qtd: {item.quantity}</p>
                </div>
                <div className="summary-item-price">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="total-line">
              <span>Subtotal:</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="total-line discount-line">
              <span>Desconto (10%):</span>
              <span>- {formatPrice(cartTotal * 0.1)}</span>
            </div>
            <div className="total-line">
              <span>Custo de Frete:</span>
              <span>{formatPrice(freteBase)}</span>
            </div>
            <div className="total-line final-total">
              <span>Total a Pagar:</span>
              <span>{formatPrice(totalFinal)}</span>
            </div>
          </div>

          <button 
            className="btn btn-whatsapp-checkout" 
            onClick={handleWhatsAppCheckout}
            disabled={!formData.nome || !formData.telefone || !formData.endereco}
          >
            Enviar Comprovante via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
