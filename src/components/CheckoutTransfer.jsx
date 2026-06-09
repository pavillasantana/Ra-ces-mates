import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import './CheckoutTransfer.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export default function CheckoutTransfer({ onBack }) {
  const { cart, clearCart } = useCartStore();
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: ''
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountTotal = cartTotal * 0.9;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWhatsAppCheckout = () => {
    const orderItems = cart.map(item => `${item.quantity}x ${item.name}`).join('%0A');
    const message = `*NUEVO PEDIDO - RAÍCES*%0A%0A*Cliente:* ${formData.nombre}%0A*Email:* ${formData.email}%0A*Teléfono:* ${formData.telefono}%0A*Dirección:* ${formData.direccion}, ${formData.ciudad} - ${formData.provincia}%0A%0A*Artículos:*%0A${orderItems}%0A%0A*Total a Pagar (Transferencia):* ${formatPrice(discountTotal)}%0A%0A_Aguardando envío del comprobante al alias: RAICES.MATE_`;
    
    window.open(`https://wa.me/5491176419463?text=${message}`, '_blank');
    clearCart();
    onBack();
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Tu carrito está vacío.</h2>
        <button className="btn" onClick={onBack}>Volver a la tienda</button>
      </div>
    );
  }

  return (
    <div className="checkout-transfer-container">
      <button className="back-btn" onClick={onBack}>← Volver a la tienda</button>
      
      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>1. Datos de Entrega</h2>
          <form>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Dirección Completa (Calle, Número, Piso/Depto)</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ciudad / Localidad</label>
                <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Provincia</label>
                <input type="text" name="provincia" value={formData.provincia} onChange={handleInputChange} required />
              </div>
            </div>
          </form>

          <div className="payment-instructions">
            <h2>2. Datos Bancarios</h2>
            <p>Realizá la transferencia para garantizar el descuento de 10%.</p>
            <div className="bank-card">
              <p><strong>Banco:</strong> Banco Galicia</p>
              <p><strong>Titular:</strong> Raíces Artesanal S.A.</p>
              <p><strong>CBU/CVU:</strong> 0070000000000000000000</p>
              <p><strong>Alias:</strong> RAICES.MATE</p>
            </div>
          </div>
        </div>

        <div className="checkout-summary">
          <h2>Resumen del Pedido</h2>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id} className="summary-item">
                <img src={item.image} alt={item.name} />
                <div className="summary-item-info">
                  <h4>{item.name}</h4>
                  <p>Cant: {item.quantity}</p>
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
              <span>Descuento Transferencia (10%):</span>
              <span>- {formatPrice(cartTotal * 0.1)}</span>
            </div>
            <div className="total-line final-total">
              <span>Total a Pagar:</span>
              <span>{formatPrice(discountTotal)}</span>
            </div>
          </div>

          <button 
            className="btn btn-whatsapp-checkout" 
            onClick={handleWhatsAppCheckout}
            disabled={!formData.nombre || !formData.telefono || !formData.direccion}
          >
            Enviar Comprobante vía WhatsApp
          </button>
          <p className="checkout-disclaimer">
            Al hacer clic, serás redirigido a nuestro WhatsApp para enviar el comprobante de pago y finalizar tu pedido.
          </p>
        </div>
      </div>
    </div>
  );
}
