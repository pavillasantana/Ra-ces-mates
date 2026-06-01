import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

// Registro de transações processadas em memória para idempotência (MVP)
// Em produção, isso seria armazenado em uma coleção no MongoDB com índice único.
const processedTransactions = new Set();
const appliedCouponsByUser = new Map(); // Controle de cupons para evitar duplicidade de uso na sessão

// Tabela de Descontos do MVP
const DISCOUNT_RATES = {
  transfer: 0.10,       // Transferência Bancária / Alias (10%)
  qr: 0.10,             // QR / Mercado Pago (10%)
  debit: 0.10,          // Cartão de Débito (10%)
  debit_card: 0.10,     // Cartão de Débito (10%)
  credit: 0.05,         // Cartão de Crédito (5%)
  credit_card: 0.05     // Cartão de Crédito (5%)
};

// 1. Motor de Validação de Cupons (Endpoint público)
router.post('/validate-coupon', (req, res) => {
  const { couponCode, email } = req.body;

  if (!couponCode || !email) {
    return res.status(400).json({ message: 'Código do cupom e e-mail do usuário são obrigatórios.' });
  }

  const normalizedCode = couponCode.trim().toUpperCase();
  
  if (normalizedCode !== 'RAICES5') {
    return res.status(400).json({ valid: false, message: 'Cupom inválido.' });
  }

  // Trava de duplicidade
  const userCoupons = appliedCouponsByUser.get(email) || [];
  if (userCoupons.includes(normalizedCode)) {
    return res.status(400).json({ 
      valid: false, 
      message: 'Este cupom de boas-vindas já foi aplicado nesta sessão para sua conta.' 
    });
  }

  return res.json({
    valid: true,
    code: 'RAICES5',
    rate: 0.05,
    message: 'Cupom de boas-vindas (5% OFF) aplicado com sucesso!'
  });
});

// 2. Checkout Unificado - Processar Pedido
router.post('/checkout', async (req, res) => {
  try {
    const { 
      transactionId, 
      email, 
      cart, 
      shippingAddress, 
      shippingMethod, 
      shippingCost,
      paymentMethod, 
      paymentToken, 
      couponCode 
    } = req.body;

    // A. Validação de Idempotência
    if (!transactionId) {
      return res.status(400).json({ message: 'ID de transação ausente. Requerido para idempotência.' });
    }

    if (processedTransactions.has(transactionId)) {
      return res.status(200).json({ 
        message: 'Pedido já processado anteriormente. (Idempotência Ativa)',
        idempotent: true
      });
    }

    // B. Buscar ou simular usuário no Banco
    let user = await User.findOne({ email });
    if (!user) {
      // Cria usuário básico caso compre sem conta (checkout de convidado), mantendo a higiene
      user = new User({
        name: shippingAddress.name || 'Cliente Convidado',
        email,
        phone: shippingAddress.phone || 'Sem Telefone',
        password: crypto.randomBytes(8).toString('hex'), // senha temporária
        addresses: [shippingAddress],
        orders: []
      });
      await user.save();
    }

    // C. Motor de Cálculo Matemático do Backend (Segurança Contra Fraudes)
    // Formula: Valor Final = (Subtotal - Cupom) * (1 - Desconto Modalidade) + Frete
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Validação do Cupom
    let couponDiscount = 0;
    if (couponCode && couponCode.toUpperCase() === 'RAICES5') {
      const userCoupons = appliedCouponsByUser.get(email) || [];
      if (!userCoupons.includes('RAICES5')) {
        couponDiscount = subtotal * 0.05; // 5% cumulativo
      }
    }

    // Validação do desconto de modalidade de pagamento
    const discountRate = DISCOUNT_RATES[paymentMethod] || 0;
    const discountedBase = subtotal - couponDiscount;
    const modalidadeDiscount = discountedBase * discountRate;
    
    // Total calculado
    const totalCalculated = Math.round((discountedBase - modalidadeDiscount) + shippingCost);

    // D. Registrar transação processada
    processedTransactions.add(transactionId);
    
    // Gravar cupom usado se houver
    if (couponCode && couponCode.toUpperCase() === 'RAICES5') {
      const userCoupons = appliedCouponsByUser.get(email) || [];
      userCoupons.push('RAICES5');
      appliedCouponsByUser.set(email, userCoupons);
    }

    // E. Salvar pedido no histórico do usuário
    const newOrder = {
      orderId: `PED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      transactionId,
      items: cart,
      shipping: {
        method: shippingMethod,
        cost: shippingCost,
        address: shippingAddress
      },
      payment: {
        method: paymentMethod,
        token: paymentToken || 'TRANSFER_OR_QR',
        discount: modalidadeDiscount,
        couponDiscount
      },
      subtotal,
      total: totalCalculated,
      status: paymentMethod === 'transfer' ? 'pending_payment' : 'paid',
      createdAt: new Date()
    };

    // Adiciona o pedido no array do usuário (Higiene: o script de migração já garante a existência do array)
    user.orders = user.orders || [];
    user.orders.push(newOrder);
    
    // Também adiciona endereço aos endereços salvos se não existir
    const addressExists = user.addresses.some(addr => addr.street === shippingAddress.street && addr.number === shippingAddress.number);
    if (!addressExists) {
      user.addresses.push({
        street: shippingAddress.street,
        number: shippingAddress.number,
        floor: shippingAddress.floor || '',
        city: shippingAddress.city,
        zip: shippingAddress.zip,
        province: shippingAddress.province
      });
    }

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Pedido processado e criado com sucesso!',
      order: newOrder
    });

  } catch (error) {
    console.error('Erro no checkout backend:', error);
    return res.status(500).json({ message: error.message });
  }
});

// 3. Webhook Nuvemshop (Idempotente)
router.post('/webhooks/tiendanube', (req, res) => {
  const signature = req.headers['x-linkedstore-signature'];
  const eventId = req.headers['x-event-id'] || req.body.id;

  // Verificação de origem básica
  if (!signature) {
    return res.status(401).json({ message: 'Assinatura Nuvemshop ausente.' });
  }

  // Idempotência
  if (processedTransactions.has(eventId)) {
    return res.status(200).json({ status: 'OK', message: 'Webhook já processado (Duplicidade evitada).' });
  }

  processedTransactions.add(eventId);
  console.log(`[Nuvemshop Webhook] Evento processado com sucesso ID: ${eventId}`);

  return res.status(200).json({ status: 'OK', message: 'Evento recebido e processado.' });
});

// 4. Webhook Mercado Pago (Idempotente)
router.post('/webhooks/mercadopago', (req, res) => {
  const mpSignature = req.headers['x-signature'] || req.query.id;
  const paymentId = req.body.data?.id || req.query.id;

  if (!paymentId) {
    return res.status(400).json({ message: 'ID do pagamento ausente.' });
  }

  // Idempotência
  if (processedTransactions.has(paymentId)) {
    return res.status(200).json({ status: 'OK', message: 'Notificação MP já processada.' });
  }

  processedTransactions.add(paymentId);
  console.log(`[Mercado Pago Webhook] Pagamento processado ID: ${paymentId}`);

  return res.status(200).json({ status: 'OK', message: 'Notificação recebida com sucesso.' });
});

export default router;
