import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDENTIALS_FILE = path.join(__dirname, '..', '..', 'tiendanube-credentials.json');

// Obter credenciais salvas de OAuth ou variáveis de ambiente fallback
export const getTiendanubeCredentials = () => {
  let saved = {};
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      saved = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
    } catch (err) {
      console.error('Erro ao ler tiendanube-credentials.json:', err.message);
    }
  }

  // Fusão com variáveis de ambiente injetadas
  const appId = process.env.NUVEMSHOP_APP_ID || '33330';
  const clientSecret = process.env.NUVEMSHOP_CLIENT_SECRET || '';
  const storeId = saved.store_id || process.env.TIENDANUBE_STORE_ID || process.env.NUVEMSHOP_STORE_ID || '8078753';
  const accessToken = saved.access_token || process.env.NUVEMSHOP_ACCESS_TOKEN || process.env.TIENDANUBE_ACCESS_TOKEN || '';

  return {
    appId,
    clientSecret,
    storeId,
    accessToken
  };
};

// Salvar credenciais de OAuth obtidas no handshake
export const saveTiendanubeCredentials = (credentials) => {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
    console.log('Credenciais da Tiendanube salvas com sucesso em:', CREDENTIALS_FILE);
    // Exibe o token de forma destacada nos logs do Render para o administrador salvá-lo como variável de ambiente
    console.log('\n============================================================');
    console.log('  ATENÇÃO: SALVE ESTE TOKEN NO RENDER COMO VARIÁVEL DE AMBIENTE');
    console.log('  Nome: NUVEMSHOP_ACCESS_TOKEN');
    console.log(`  Valor: ${credentials.access_token}`);
    console.log(`  Store ID: ${credentials.store_id}  (salve como NUVEMSHOP_STORE_ID)`);
    console.log('============================================================\n');
    return true;
  } catch (err) {
    console.error('Erro ao salvar credenciais da Tiendanube:', err.message);
    return false;
  }
};

// Trocar código de autorização OAuth por Token Permanente
export const exchangeCodeForToken = async (code) => {
  const { appId, clientSecret } = getTiendanubeCredentials();
  
  if (!clientSecret) {
    throw new Error('NUVEMSHOP_CLIENT_SECRET não configurada no arquivo de ambiente (.env).');
  }

  console.log(`[Tiendanube OAuth] Trocando código de autorização (${code}) por Token permanente...`);

  const response = await fetch('https://www.tiendanube.com/apps/authorize/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'RaicesApp (pavilla.santana@yahoo.com)'
    },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na troca de token Tiendanube: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // Resposta esperada: { access_token: '...', token_type: 'bearer', scope: '...', user_id: 123456 }
  const creds = {
    access_token: data.access_token,
    store_id: String(data.user_id),
    scope: data.scope,
    authorized_at: new Date().toISOString()
  };

  saveTiendanubeCredentials(creds);
  return creds;
};

// Obter catálogo de produtos da Tiendanube para mapear dinamicamente os IDs
export const getTiendanubeProducts = async (accessToken, storeId) => {
  try {
    console.log(`[Tiendanube API] Buscando catálogo de produtos para Store: ${storeId}...`);
    const response = await fetch(`https://api.tiendanube.com/v1/${storeId}/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RaicesApp (pavilla.santana@yahoo.com)'
      }
    });

    if (!response.ok) {
      console.warn(`[Tiendanube API] Falha ao obter produtos (${response.status}). Usando mapeamento fallback.`);
      return [];
    }

    return await response.json();
  } catch (err) {
    console.error('[Tiendanube API] Erro ao buscar produtos:', err.message);
    return [];
  }
};

// Enviar pedido silencioso para a API da Tiendanube
export const submitOrderToTiendanube = async (checkoutData) => {
  const { accessToken, storeId } = getTiendanubeCredentials();

  if (!accessToken) {
    console.warn('[Tiendanube API] Integração ignorada: access_token ausente. O pedido foi processado apenas localmente.');
    return { success: false, reason: 'no_token_configured' };
  }

  try {
    // 1. Buscar produtos do catálogo oficial da Tiendanube para fazer o cruzamento dinâmico inteligente
    const tnProducts = await getTiendanubeProducts(accessToken, storeId);
    
    // 2. Montar lista de produtos cruzando dados do carrinho
    const matchedProducts = [];
    let fallbackVariantId = null;

    // Se houver algum produto no catálogo, guarda o primeiro id de variante como fallback universal
    if (tnProducts.length > 0 && tnProducts[0].variants && tnProducts[0].variants.length > 0) {
      fallbackVariantId = tnProducts[0].variants[0].id;
    }

    for (const item of checkoutData.cart) {
      let variantId = null;
      let price = (item.price || 0).toFixed(2);

      // A. Tenta casar pelo slug/handle tiendanubeProductId (ex: 'teste-v1')
      const targetHandle = String(item.tiendanubeProductId || '').trim().toLowerCase();
      
      // B. Tenta casar pelo nome do produto
      const targetName = String(item.name || '').trim().toLowerCase();

      // Procura no catálogo retornado
      const matchedTnProduct = tnProducts.find(p => {
        // Verifica se o handle bate em algum dos idiomas cadastrados
        const matchesHandle = p.handle && Object.values(p.handle).some(h => String(h).toLowerCase() === targetHandle);
        const matchesName = p.name && Object.values(p.name).some(n => String(n).toLowerCase() === targetName);
        return matchesHandle || matchesName || String(p.id) === targetHandle;
      });

      if (matchedTnProduct && matchedTnProduct.variants && matchedTnProduct.variants.length > 0) {
        variantId = matchedTnProduct.variants[0].id;
        console.log(`[Tiendanube Match] Casou "${item.name}" com variante oficial ID ${variantId} na Tiendanube.`);
      } else {
        // Fallback: se não achar, usa o fallback universal de estoque ou um número estático para evitar que a API rejeite
        variantId = fallbackVariantId || 999999999;
        console.log(`[Tiendanube Match] Não casou "${item.name}". Utilizando variant ID fallback: ${variantId}.`);
      }

      matchedProducts.push({
        variant_id: variantId,
        quantity: parseInt(item.quantity, 10) || 1,
        price: price
      });
    }

    // 3. Montar payload completo do pedido transacional seguindo a estrutura padrão
    const methodMap = {
      transfer: 'transfer',
      qr: 'mercadopago',
      credit_card: 'credit_card',
      debit_card: 'debit_card'
    };

    const paymentMethod = methodMap[checkoutData.paymentMethod] || 'custom';
    const shippingCost = (checkoutData.shippingCost || 0).toFixed(2);

    const orderPayload = {
      contact_email: checkoutData.email,
      contact_name: checkoutData.shippingAddress.name,
      contact_phone: checkoutData.shippingAddress.phone,
      shipping_pickup_type: 'ship',
      shipping_option: checkoutData.shippingMethod || 'Envío Personalizado',
      shipping_option_code: checkoutData.shippingMethod || 'custom',
      shipping_cost_owner: shippingCost,
      shipping_cost_customer: shippingCost,
      products: matchedProducts,
      shipping_address: {
        address:   checkoutData.shippingAddress.street    || 'Dirección no especificada',
        number:    checkoutData.shippingAddress.number    || 'S/N',
        floor:     checkoutData.shippingAddress.floor     || '',
        locality:  checkoutData.shippingAddress.locality  || checkoutData.shippingAddress.bairro || 'Centro',
        city:      checkoutData.shippingAddress.city      || 'CABA',
        province:  checkoutData.shippingAddress.province  || 'Capital Federal',
        country:   'AR',
        zipcode:   checkoutData.shippingAddress.zip       || '1081',
        phone:     checkoutData.shippingAddress.phone,
        recipient: checkoutData.shippingAddress.name
      },
      payment_details: {
        method: paymentMethod,
        status: ['transfer', 'qr'].includes(checkoutData.paymentMethod) ? 'pending' : 'paid'
      },
      gateway: 'custom_gateway',
      gateway_id: 'raices_checkout',
      status: 'open',
      payment_status: ['transfer', 'qr'].includes(checkoutData.paymentMethod) ? 'pending' : 'paid'
    };

    console.log(`[Tiendanube API] Enviando pedido silencioso para POST /v1/${storeId}/orders...`);
    
    const response = await fetch(`https://api.tiendanube.com/v1/${storeId}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RaicesApp (pavilla.santana@yahoo.com)'
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[Tiendanube API] Falha ao injetar pedido (${response.status}):`, errBody);
      return { success: false, status: response.status, details: errBody };
    }

    const createdOrder = await response.json();
    console.log(`[Tiendanube API] Pedido criado com total sucesso na Tiendanube! ID Oficial: ${createdOrder.id}`);
    return { success: true, orderId: createdOrder.id };

  } catch (err) {
    console.error('[Tiendanube API] Exceção crítica ao sincronizar com Tiendanube:', err.message);
    return { success: false, reason: 'exception', error: err.message };
  }
};
