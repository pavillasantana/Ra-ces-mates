/**
 * shippingProviders.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Arquitetura multi-transportadora para o checkout do Raíces.
 *
 * Cada provider:
 *  • Usa a API oficial quando as credenciais estão disponíveis via env vars
 *  • Retorna tarifas realistas configuráveis quando sem credenciais (mock)
 *  • É ativado/desativado por variável de ambiente — sem tocar no código
 *
 * Para ativar uma transportadora real no Render, adicione as env vars indicadas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Multiplicador de preço por distância (baseado na região da Argentina)
const REGION_MULTIPLIER = {
  'ciudad autónoma de buenos aires': 1.0,
  'buenos aires': 1.1,
  'córdoba': 1.3,
  'santa fe': 1.3,
  'mendoza': 1.5,
  'tucumán': 1.6,
  'entre ríos': 1.4,
  'corrientes': 1.7,
  'misiones': 1.8,
  'salta': 1.7,
  'jujuy': 1.8,
  'neuquén': 1.6,
  'río negro': 1.7,
  'chubut': 1.9,
  'santa cruz': 2.1,
  'tierra del fuego': 2.5,
};

function getRegionMultiplier(province = '') {
  const key = province.toLowerCase();
  for (const [region, mult] of Object.entries(REGION_MULTIPLIER)) {
    if (key.includes(region)) return mult;
  }
  return 1.4; // Fallback para províncias não mapeadas
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER 1 — OCA e-PAK
// API: http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx
// Para ativar: adicione OCA_CUIT e OCA_OPERATIVA no Render
// ─────────────────────────────────────────────────────────────────────────────
const ocaProvider = {
  id: 'oca',
  name: 'OCA e-PAK',
  isReal: !!(process.env.OCA_CUIT && process.env.OCA_OPERATIVA),

  async calculate({ cp, province, weightKg = 0.5 }) {
    const mult = getRegionMultiplier(province);
    const BASE_OCA_PRICE = 4800;

    if (this.isReal) {
      try {
        // API SOAP OCA — ativa quando OCA_CUIT e OCA_OPERATIVA estão configurados
        const params = new URLSearchParams({
          Cuit: process.env.OCA_CUIT,
          Operativa: process.env.OCA_OPERATIVA,
          PesoTotal: String(weightKg),
          VolumenTotal: '0.001',
          ValorDeclarado: '5000',
          Cpackages: '1',
          InicioVigencia: new Date().toLocaleDateString('es-AR'),
          DiasDeCorte: '1',
          CodigoPostalOrigen: process.env.OCA_ORIGIN_CP || '1000',
          CodigoPostalDestino: cp,
        });

        const url = `http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/Tarifar_Envio_Corporativo?${params}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const xml = await res.text();

        // Extrai o preço do XML SOAP retornado pela OCA
        const match = xml.match(/<Total>([\d.,]+)<\/Total>/i)
                   || xml.match(/<Precio>([\d.,]+)<\/Precio>/i);
        if (match) {
          const price = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(price) && price > 0) {
            console.log(`[OCA Real] Cotização para CP ${cp}: $${price}`);
            return [
              { id: 'oca_standard', name: 'OCA e-PAK Estándar', time: '3-5 días hábiles', price: Math.round(price), source: 'oca_api' },
            ];
          }
        }
        console.warn('[OCA Real] Não foi possível extrair preço do XML. Usando mock.');
      } catch (err) {
        console.warn('[OCA Real] Erro na API:', err.message, '— Usando mock.');
      }
    }

    // Mock realista baseado na região
    const price = Math.round(BASE_OCA_PRICE * mult);
    return [
      { id: 'oca_standard', name: 'OCA e-PAK Estándar',   time: '3-5 días hábiles', price,                     source: 'mock' },
      { id: 'oca_express',  name: 'OCA Express Prioritario', time: '1-2 días hábiles', price: Math.round(price * 1.4), source: 'mock' },
    ];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER 2 — Andreani
// API: https://apis.andreani.com/v2/tarifas
// Para ativar: adicione ANDREANI_API_KEY e ANDREANI_CONTRACT no Render
// ─────────────────────────────────────────────────────────────────────────────
const andreaniProvider = {
  id: 'andreani',
  name: 'Andreani',
  isReal: !!(process.env.ANDREANI_API_KEY && process.env.ANDREANI_CONTRACT),

  async calculate({ cp, province, weightKg = 0.5 }) {
    const mult = getRegionMultiplier(province);
    const BASE_ANDREANI_PRICE = 5500;

    if (this.isReal) {
      try {
        // API REST Andreani — ativa quando ANDREANI_API_KEY estiver configurada
        const res = await fetch('https://apis.andreani.com/v2/tarifas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.ANDREANI_API_KEY}`,
            'x-contrato': process.env.ANDREANI_CONTRACT,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cpDestino: cp,
            pesoBruto: weightKg,
            volumen: 1000,
            contrato: process.env.ANDREANI_CONTRACT,
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
          const data = await res.json();
          const tarifa = data?.tarifaConIva || data?.tarifa || data?.precio;
          if (tarifa) {
            console.log(`[Andreani Real] Cotização para CP ${cp}: $${tarifa}`);
            return [
              { id: 'andreani_standard', name: 'Andreani Envío a Domicilio', time: '3-5 días hábiles', price: Math.round(tarifa), source: 'andreani_api' },
            ];
          }
        }
        console.warn('[Andreani Real] Resposta inválida. Usando mock.');
      } catch (err) {
        console.warn('[Andreani Real] Erro na API:', err.message, '— Usando mock.');
      }
    }

    // Mock realista baseado na região
    const price = Math.round(BASE_ANDREANI_PRICE * mult);
    return [
      { id: 'andreani_standard', name: 'Andreani Envío a Domicilio', time: '3-5 días hábiles', price,                     source: 'mock' },
      { id: 'andreani_flex',     name: 'Andreani Flex (Con Seguimiento)', time: '2-4 días hábiles', price: Math.round(price * 1.2), source: 'mock' },
    ];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER 3 — Correo Argentino
// Nota: Não possui API pública. Tarifas referenciais baseadas no tarifário
// oficial publicado em correoargentino.com.ar. Atualizar mensalmente.
// Para ativar API real no futuro: configure CA_API_KEY (contrato corporativo)
// ─────────────────────────────────────────────────────────────────────────────
const correoArgentinoProvider = {
  id: 'correo_argentino',
  name: 'Correo Argentino',
  isReal: false, // Sem API pública — sempre usa tarifas referenciais

  async calculate({ cp, province, weightKg = 0.5 }) {
    const mult = getRegionMultiplier(province);
    const BASE_CA_PRICE = 3200; // Tarifas referenciais — atualizar periodicamente

    const price = Math.round(BASE_CA_PRICE * mult);
    return [
      { id: 'ca_encomienda', name: 'Correo Argentino Encomienda', time: '5-8 días hábiles', price,                     source: 'referential' },
      { id: 'ca_carta',      name: 'Correo Argentino Carta Expreso', time: '3-5 días hábiles', price: Math.round(price * 1.15), source: 'referential' },
    ];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER 4 — Motomensajería Express (CABA/GBA apenas)
// Sem API — tarifa fixa configurável via MOTO_PRICE no Render
// ─────────────────────────────────────────────────────────────────────────────
const motomensajeriaProvider = {
  id: 'motomensajeria',
  name: 'Motomensajería',
  isReal: true, // Sempre disponível — tarifa gerenciada diretamente

  async calculate({ province }) {
    const isLocal = province?.toLowerCase().includes('buenos aires') || province?.toLowerCase().includes('autónoma');
    if (!isLocal) return []; // Só para CABA/GBA

    const price = parseInt(process.env.MOTO_PRICE || '3500', 10);
    return [
      { id: 'moto_express', name: 'Motomensajería Express (CABA/GBA)', time: 'Entrega en 24h hábiles', price, source: 'fixed' },
    ];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATOR — Chama todos os providers ativos e agrega os resultados
// ─────────────────────────────────────────────────────────────────────────────
const ALL_PROVIDERS = [motomensajeriaProvider, correoArgentinoProvider, ocaProvider, andreaniProvider];

export async function calculateShippingRates({ cp, province, weightKg = 0.5 }) {
  const results = [];
  const errors  = [];

  await Promise.allSettled(
    ALL_PROVIDERS.map(async (provider) => {
      try {
        const rates = await provider.calculate({ cp, province, weightKg });
        if (Array.isArray(rates) && rates.length > 0) {
          results.push(...rates);
        }
      } catch (err) {
        errors.push({ provider: provider.id, error: err.message });
        console.warn(`[Shipping] Provider "${provider.id}" falhou:`, err.message);
      }
    })
  );

  if (errors.length > 0) {
    console.warn('[Shipping] Providers com erro:', errors);
  }

  console.log(`[Shipping] ${results.length} opção(ões) agregadas para CP ${cp} (${province})`);
  return results;
}

// Exporta providers individuais para referência
export { ocaProvider, andreaniProvider, correoArgentinoProvider, motomensajeriaProvider };
