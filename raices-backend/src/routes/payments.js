import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  getTiendanubeCredentials,
  exchangeCodeForToken,
  submitOrderToTiendanube
} from '../utils/tiendanube.js';

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

// ──────────────────────────────────────────────────────────────────────────────
// 0. Endpoint de Fretes (Tiendanube Shipping Carriers API)
// Chamado pelo frontend ao buscar o CEP — retorna as opções reais de envio
// da loja na Tiendanube. Se o token não estiver disponível, retorna fallback.
// ──────────────────────────────────────────────────────────────────────────────
router.get('/shipping-rates', async (req, res) => {
  const { cp = '', province = '' } = req.query;
  const { accessToken, storeId } = getTiendanubeCredentials();

  // Fallback inteligente por região — ativo quando não há token OAuth ainda
  const isLocal = province.toLowerCase().includes('buenos aires') || province.toLowerCase().includes('autónoma');
  const FALLBACK_RATES = [
    { id: 'andreani',    name: 'Andreani Envío Nacional',          time: '3-5 días hábiles',  price: 4500 },
    { id: 'oca',         name: 'OCA Envíos a Domicilio',           time: '4-6 días hábiles',  price: 5200 },
    { id: 'envios_pack', name: 'Envíos Pack Estándar',             time: '2-4 días hábiles',  price: 3800 }
  ];
  if (isLocal) {
    FALLBACK_RATES.unshift({ id: 'motomensajeria', name: 'Motomensajería Express (CABA/GBA)', time: 'Entrega en 24h hábiles', price: 3500 });
  }

  if (!accessToken) {
    console.warn('[Shipping Rates] access_token ausente. Retornando fallback local.');
    return res.json({ source: 'fallback', rates: FALLBACK_RATES });
  }

  try {
    // Busca as transportadoras cadastradas na loja da Tiendanube
    const tnRes = await fetch(`https://api.tiendanube.com/v1/${storeId}/shipping_carriers`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RaicesApp (pavilla.santana@yahoo.com)'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!tnRes.ok) {
      const errBody = await tnRes.text();
      console.warn(`[Shipping Rates] Falha na API Tiendanube (${tnRes.status}): ${errBody}. Usando fallback.`);
      return res.json({ source: 'fallback', rates: FALLBACK_RATES });
    }

    const carriers = await tnRes.json();

    // Mapeia as transportadoras para o formato esperado pelo frontend
    const rates = (Array.isArray(carriers) ? carriers : []).map(carrier => ({
      id:    String(carrier.id),
      name:  carrier.name || 'Envío',
      time:  carrier.delivery_time ? `${carrier.delivery_time} días hábiles` : 'Consultar plazo',
      price: parseFloat(carrier.price || carrier.base_price || 0)
    })).filter(r => !isNaN(r.price));

    if (rates.length === 0) {
      console.warn('[Shipping Rates] Tiendanube retornou 0 transportadoras. Usando fallback.');
      return res.json({ source: 'fallback', rates: FALLBACK_RATES });
    }

    console.log(`[Shipping Rates] ${rates.length} transportadora(s) retornada(s) da Tiendanube para CP: ${cp}`);
    return res.json({ source: 'tiendanube', rates });

  } catch (err) {
    console.error('[Shipping Rates] Exceção ao buscar fretes na Tiendanube:', err.message);
    return res.json({ source: 'fallback', rates: FALLBACK_RATES });
  }
});

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

    // B. Buscar ou simular usuário no Banco (Somente se o MongoDB estiver oficialmente conectado)
    let user = null;
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      try {
        user = await User.findOne({ email });
        if (!user) {
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
      } catch (dbErr) {
        console.warn('Erro ao conectar ao banco MongoDB, continuando em memória:', dbErr.message);
      }
    }

    // C. Motor de Cálculo Matemático do Backend (Segurança Contra Fraudes)
    // Formula: Valor Final = Subtotal - Cupom - Desconto Modalidade + Frete
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Validação do Cupom (5% do subtotal)
    let couponDiscount = 0;
    if (couponCode && couponCode.toUpperCase() === 'RAICES5') {
      const userCoupons = appliedCouponsByUser.get(email) || [];
      if (!userCoupons.includes('RAICES5')) {
        couponDiscount = subtotal * 0.05;
      }
    }

    // Validação do desconto de modalidade de pagamento (Calculado diretamente sobre o valor do produto, subtotal, não sobre o frete)
    const discountRate = DISCOUNT_RATES[paymentMethod] || 0;
    const modalidadeDiscount = subtotal * discountRate;
    
    // Total calculado
    const totalCalculated = Math.round((subtotal - couponDiscount - modalidadeDiscount) + shippingCost);

    // D. Registrar transação processada
    processedTransactions.add(transactionId);
    
    // Gravar cupom usado se houver
    if (couponCode && couponCode.toUpperCase() === 'RAICES5') {
      const userCoupons = appliedCouponsByUser.get(email) || [];
      userCoupons.push('RAICES5');
      appliedCouponsByUser.set(email, userCoupons);
    }

    // E. Salvar pedido no histórico do usuário (Somente se o usuário do banco foi instanciado com sucesso)
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

    if (user && isDbConnected) {
      try {
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
      } catch (saveErr) {
        console.warn('Erro ao salvar pedido no usuário MongoDB:', saveErr.message);
      }
    }

    // F. Processamento Silencioso na Tiendanube em segundo plano (Background)
    submitOrderToTiendanube({
      email,
      cart,
      shippingAddress,
      shippingMethod,
      shippingCost,
      paymentMethod,
      couponCode
    }).then(async (tnResult) => {
      if (tnResult.success) {
        console.log(`[Checkout Sincronizado] Pedido sincronizado com Tiendanube. ID: ${tnResult.orderId}`);
        newOrder.tiendanubeOrderId = tnResult.orderId;
        
        // Se o banco de dados estiver disponível, atualiza o pedido com o ID da Tiendanube
        if (user && isDbConnected) {
          try {
            // Busca o usuário atualizado
            const currentUser = await User.findOne({ email });
            if (currentUser) {
              const ordIndex = currentUser.orders.findIndex(o => o.orderId === newOrder.orderId);
              if (ordIndex !== -1) {
                currentUser.orders[ordIndex].tiendanubeOrderId = tnResult.orderId;
                currentUser.markModified('orders');
                await currentUser.save();
                console.log('[Checkout Sincronizado] ID da Tiendanube adicionado ao MongoDB com sucesso.');
              }
            }
          } catch (dbUpdateErr) {
            console.error('Erro ao atualizar ID Tiendanube no MongoDB:', dbUpdateErr.message);
          }
        }
      } else {
        console.warn('[Checkout Sincronizado] Falha silenciosa ao criar pedido na Tiendanube:', tnResult.reason || tnResult.details);
      }
    }).catch(err => {
      console.error('[Checkout Sincronizado] Erro na sincronização da Tiendanube:', err.message);
    });

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

// ==========================================
// INTEGRAÇÃO E OAUTH DA TIENDANUBE (NUVEMSHOP)
// ==========================================

// Rota para iniciar o handshake OAuth da Tiendanube
router.get('/tiendanube/authorize', (req, res) => {
  try {
    const { appId } = getTiendanubeCredentials();
    const isBrazil = req.query.locale === 'pt' || req.query.country === 'BR';
    const domain = isBrazil ? 'www.nuvemshop.com.br' : 'www.tiendanube.com';
    
    // URL de autorização oficial da Tiendanube/Nuvemshop
    const authUrl = `https://${domain}/apps/${appId}/authorize`;
    console.log(`[Tiendanube OAuth] Redirecionando lojista para autorizar aplicativo: ${authUrl}`);
    return res.redirect(authUrl);
  } catch (err) {
    console.error('Erro ao iniciar autorização Tiendanube:', err.message);
    return res.status(500).send(`Erro interno ao processar autorização: ${err.message}`);
  }
});

// Rota de Redirecionamento (Callback) para receber o código OAuth temporário e gerar o Token permanente
router.get('/tiendanube/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    console.warn('[Tiendanube OAuth] Código de autorização ausente na query.');
    return res.status(400).send('Erro: Código de autorização ausente na URL.');
  }

  try {
    // Troca o código pelo token permanente e salva no JSON persistente
    const creds = await exchangeCodeForToken(code);
    
    // Retorna uma página de sucesso premium e moderna
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conexión exitosa - Raíces & Tiendanube</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            background-color: #0b130e;
            color: #f4ece1;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .card {
            background-color: #121c16;
            border: 1px solid rgba(197, 160, 89, 0.2);
            border-radius: 16px;
            padding: 40px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: fadeIn 0.8s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #c5a059;
            margin-bottom: 20px;
            letter-spacing: 2px;
          }
          .icon {
            width: 80px;
            height: 80px;
            background-color: #182a1f;
            color: #5ba370;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 24px auto;
            font-size: 40px;
            border: 2px solid #5ba370;
          }
          h1 {
            font-size: 24px;
            color: #f4ece1;
            margin-bottom: 12px;
          }
          p {
            color: #a4b3a9;
            line-height: 1.6;
            margin-bottom: 28px;
            font-size: 15px;
          }
          .store-info {
            background-color: #182a1f;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 30px;
            font-size: 14px;
            border: 1px solid rgba(91, 163, 112, 0.2);
          }
          .store-info span {
            color: #c5a059;
            font-weight: 600;
          }
          .btn {
            display: inline-block;
            background-color: #c5a059;
            color: #0b130e;
            padding: 12px 32px;
            font-weight: 600;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(197, 160, 89, 0.3);
          }
          .btn:hover {
            background-color: #d8b776;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(197, 160, 89, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">RAÍCES</div>
          <div class="icon">✓</div>
          <h1>¡Integración Exitosa!</h1>
          <p>Tu tienda de e-commerce sin cabeza (headless storefront) se ha conectado de forma totalmente segura con la API de Tiendanube.</p>
          
          <div class="store-info">
            Tienda ID conectada: <span>#${creds.store_id}</span>
          </div>

          <div style="background:#0d1f14;border:1px solid rgba(197,160,89,0.4);border-radius:8px;padding:16px;margin-bottom:24px;text-align:left;font-size:13px;">
            <p style="color:#c5a059;font-weight:700;margin:0 0 10px 0;font-size:14px;">⚠️ IMPORTANTE: Salve no Render agora</p>
            <p style="color:#a4b3a9;margin:0 0 6px 0;">Copie estas variáveis para o painel do Render → Environment:</p>
            <div style="background:#060f09;padding:10px;border-radius:6px;word-break:break-all;font-family:monospace;color:#5ba370;font-size:12px;line-height:1.8;">
              NUVEMSHOP_ACCESS_TOKEN = ${creds.access_token}<br>
              NUVEMSHOP_STORE_ID = ${creds.store_id}
            </div>
            <p style="color:#6b7f71;margin:8px 0 0 0;font-size:11px;">⚡ Depois de salvar, clique em "Save" no Render e aguarde o redeploy automático.</p>
          </div>

          <a href="${process.env.CLIENT_URL || 'https://raicesoficial.online'}" class="btn">Volver al Sitio</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Tiendanube OAuth Callback Error]:', err.message);
    return res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #0b130e; color: #f4ece1; min-height: 100vh;">
        <h2 style="color: #ff5f5f;">Error de Integración</h2>
        <p>${err.message}</p>
        <p>Verifique que las credenciales NUVEMSHOP_APP_ID y NUVEMSHOP_CLIENT_SECRET estén configuradas correctamente.</p>
      </div>
    `);
  }
});

export default router;
