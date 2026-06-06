import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';
import '../components/CheckoutTransfer.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

const normalizeProvince = (raw) => {
  if (!raw) return raw;
  const p = raw.toLowerCase();
  if (p.includes('autonomous city') || p.includes('ciudad autónoma') ||
      p.includes('ciudad de buenos aires') || p === 'c') {
    return 'Ciudad Autónoma de Buenos Aires';
  }
  if (p === 'buenos aires') return 'Buenos Aires';
  return raw;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { t } = useTranslation();
  const { showAlert } = useModal();

  // 1. Estados do Formulário de Entrega
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    codigoPostal: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    provincia: ''
  });

  // 2. Estados Logísticos
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [zipSearched, setZipSearched] = useState(false);

  // 2b. Multi-bairro: quando um CP CABA cobre vários bairros
  // availableBarrios = ['Palermo', 'Recoleta', 'San Nicolás']
  // isMultipleZone = true → campo Barrio vira <select> dropdown
  const [availableBarrios, setAvailableBarrios] = useState([]);
  const [isMultipleZone, setIsMultipleZone] = useState(false);

  // 2c. Autocomplete do Código Postal (Nominatim por postalcode → localidades)
  const [cpSuggestions, setCpSuggestions]       = useState([]);
  const [showCpDropdown, setShowCpDropdown]     = useState(false);
  const [isLoadingCp, setIsLoadingCp]           = useState(false);
  const cpDebounceRef = useRef(null);

  // 2d. Autocomplete por Rua + Número
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const addressDebounceRef = useRef(null);
  const selectedFromSuggestionsRef = useRef(false);

  // 3. Estados de Cupons e Descontos
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // 4. Estados do Método de Pagamento
  const [paymentMethod, setPaymentMethod] = useState(''); // 'transfer' | 'qr' | 'debit_card' | 'credit_card'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(false);

  // 5. Estados do Cartão Seguro (Sem PCI-DSS)
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  const [cardBrand, setCardBrand] = useState('');
  const [cardToken, setCardToken] = useState('');

  // 6. Barreira de Estado: Validar se os dados de Entrega + Método de Envio estão preenchidos e válidos
  const isDeliverySectionValid = 
    formData.nome.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.telefone.trim() !== '' &&
    formData.codigoPostal.trim() !== '' &&
    formData.rua.trim() !== '' &&
    formData.numero.trim() !== '' &&
    formData.bairro.trim() !== '' &&
    formData.cidade.trim() !== '' &&
    formData.provincia.trim() !== '' &&
    selectedShipping !== null;

  // Cálculos de Totais baseados na Fórmula Estrita do MVP:
  // Valor Final = (Subtotal - Cupom) * (1 - Desconto Modalidade) + Frete
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Desconto do Cupom (5% cumulativo se o cupom 'RAICES5' for aplicado)
  const couponDiscountAmount = appliedCoupon ? cartSubtotal * appliedCoupon.rate : 0;
  
  // Desconto Condicional da Modalidade de Pagamento
  // 10% para Transferência/QR/Débito, 5% para Crédito - ativado automaticamente
  const getModalidadeDiscountRate = () => {
    if (paymentMethod === 'credit_card') return 0.05; // 5% crédito
    if (['transfer', 'qr', 'debit_card'].includes(paymentMethod)) return 0.10; // 10% à vista/débito/qr
    return 0;
  };
  
  const modalidadeDiscountRate = getModalidadeDiscountRate();
  const paymentDiscountAmount = cartSubtotal * modalidadeDiscountRate;
  
  // Custo do Frete
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  
  // Valor Final Matemático Estrito
  const totalFinal = cartSubtotal - couponDiscountAmount - paymentDiscountAmount + shippingCost;

  // Mudança de campos básicos
  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'codigoPostal') {
      setZipSearched(false);
      setShippingOptions([]);
      setSelectedShipping(null);
      setAvailableBarrios([]);
      setIsMultipleZone(false);
    }
  };

  // Quando o usuário escolhe um bairro no dropdown (CP multi-zona CABA)
  const handleBairroSelect = (e) => {
    setFormData(prev => ({ ...prev, bairro: e.target.value }));
  };



  // ─── AUTOCOMPLETE DO CÓDIGO POSTAL ────────────────────────────────────────────
  // Quando o usuário digita o CP → busca localidades no Nominatim por postalcode
  // → mostra dropdown com sugestões → clique preenche barrio, cidade, provincia.
  const handleCpInput = useCallback((e) => {
    const val = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, codigoPostal: val }));
    setCpSuggestions([]);
    setShowCpDropdown(false);

    if (val.length < 3) return;

    clearTimeout(cpDebounceRef.current);
    cpDebounceRef.current = setTimeout(async () => {
      setIsLoadingCp(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${val}&countrycodes=AR&format=json&addressdetails=1&limit=8`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'RaicesHeritageMate/1.0 (raicesoficial.online)' },
          signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) throw new Error('err');
        const data = await res.json();
        // Deduplica por combinação suburb+city para evitar repetições
        const seen = new Set();
        const sugs = data.reduce((acc, item) => {
          const addr = item.address || {};
          const suburb  = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
          const city    = addr.city || addr.town || addr.municipality || addr.county || '';
          const province= addr.state || '';
          const postcode= addr.postcode || val;
          const key     = `${suburb}|${city}`;
          if (!city || seen.has(key)) return acc;
          seen.add(key);
          acc.push({ suburb, city, province, postcode });
          return acc;
        }, []);
        setCpSuggestions(sugs);
        setShowCpDropdown(sugs.length > 0);
      } catch {
        // silencioso
      }
      setIsLoadingCp(false);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Usuário clicou numa sugestão de localidade do CP
  const handleCpSuggestionSelect = useCallback((sug) => {
    const cpClean = sug.postcode.replace(/[^\d]/g, '').slice(0, 4);
    const numCp   = parseInt(cpClean, 10);

    // Checa tabela CABA para multi-zona
    const cabaEntry  = !isNaN(numCp) ? CABA_BARRIO_TABLE[numCp] : undefined;
    const isMulti    = Array.isArray(cabaEntry);
    const autoBarrio = isMulti
      ? cabaEntry[0]
      : (typeof cabaEntry === 'string' ? cabaEntry : sug.suburb || '');

    setFormData(prev => ({
      ...prev,
      codigoPostal: cpClean || sug.postcode,
      bairro:   autoBarrio || sug.suburb || prev.bairro,
      cidade:   sug.city   || prev.cidade,
      provincia: normalizeProvince(sug.province) || prev.provincia,
    }));

    if (isMulti) { setAvailableBarrios(cabaEntry); setIsMultipleZone(true); }
    else         { setAvailableBarrios([]);         setIsMultipleZone(false); }

    setZipSearched(true);
    setCpSuggestions([]);
    setShowCpDropdown(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('[data-cp-autocomplete]')) setShowCpDropdown(false);
      if (!e.target.closest('[data-address-autocomplete]')) setShowAddressDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ─── AUTOCOMPLETE POR RUA + NÚMERO ───────────────────────────────────────────
  // Quando o usuário digita rua + número → busca endereços no Nominatim
  // → mostra dropdown com sugestões → clique preenche rua, número, cp, bairro, cidade, provincia.
  useEffect(() => {
    const { rua, numero } = formData;

    if (selectedFromSuggestionsRef.current) {
      selectedFromSuggestionsRef.current = false;
      return;
    }

    if (rua.trim().length < 3 || numero.trim().length < 1) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(async () => {
      setIsLoadingAddress(true);
      try {
        const query = encodeURIComponent(`${rua.trim()} ${numero.trim()}, Argentina`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'RaicesHeritageMate/1.0 (raicesoficial.online)' },
          signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) throw new Error('err');
        const data = await res.json();

        const sugs = data.reduce((acc, item) => {
          const addr = item.address || {};
          const road = addr.road || '';
          const house_number = addr.house_number || numero.trim();
          const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
          const city = addr.city || addr.town || addr.municipality || addr.county || '';
          const province = addr.state || '';
          const postcode = addr.postcode || '';

          if (!road || !city) return acc;

          // Formata a exibição amigável
          const display = `${road} ${house_number}, ${suburb ? suburb + ', ' : ''}${city} (${province}) - CP ${postcode}`;

          acc.push({
            road,
            house_number,
            suburb,
            city,
            province,
            postcode,
            display
          });
          return acc;
        }, []);

        setAddressSuggestions(sugs);
        setShowAddressDropdown(sugs.length > 0);
      } catch (err) {
        console.warn('[Address Autocomplete] Falhou:', err.message);
      } finally {
        setIsLoadingAddress(false);
      }
    }, 800);

    return () => clearTimeout(addressDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.rua, formData.numero]);

  // Usuário clicou numa sugestão de endereço
  const handleAddressSuggestionSelect = useCallback((sug) => {
    selectedFromSuggestionsRef.current = true;
    const cpClean = sug.postcode.replace(/[^\d]/g, '').slice(0, 4);
    const numCp = parseInt(cpClean, 10);

    // Checa tabela CABA para multi-zona se for CABA
    const cabaEntry  = !isNaN(numCp) ? CABA_BARRIO_TABLE[numCp] : undefined;
    const isMulti    = Array.isArray(cabaEntry);
    const autoBarrio = isMulti
      ? cabaEntry[0]
      : (typeof cabaEntry === 'string' ? cabaEntry : sug.suburb || '');

    setFormData(prev => ({
      ...prev,
      rua: sug.road || prev.rua,
      numero: sug.house_number || prev.numero,
      codigoPostal: cpClean || sug.postcode || prev.codigoPostal,
      bairro: autoBarrio || sug.suburb || prev.bairro,
      cidade: sug.city || prev.cidade,
      provincia: normalizeProvince(sug.province) || prev.provincia
    }));

    if (isMulti) { setAvailableBarrios(cabaEntry); setIsMultipleZone(true); }
    else         { setAvailableBarrios([]);         setIsMultipleZone(false); }

    setZipSearched(true);
    setAddressSuggestions([]);
    setShowAddressDropdown(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ─── useEffect REATIVO: Calcula frete quando endereço está completo ───────────────
  // Gatilho: rua + número + codigoPostal + bairro preenchidos
  // Desacoplado do lookup de CP — o frete só é buscado quando o endereço está COMPLETO.
  useEffect(() => {
    const { codigoPostal, rua, numero, bairro, cidade, provincia } = formData;
    const isAddressComplete =
      codigoPostal.trim().length >= 4 &&
      rua.trim().length >= 2 &&
      numero.trim().length >= 1 &&
      bairro.trim().length >= 2;

    if (!isAddressComplete || !zipSearched) return;

    // Extrai código numérico do CPA se necessário
    const cpaMatch = codigoPostal.toUpperCase().match(/^[A-Z](\d{4})[A-Z]{3}$/i);
    const numericCode = cpaMatch ? cpaMatch[1] : codigoPostal.trim();

    const fetchShippingRates = async () => {
      setIsCalculatingShipping(true);

      const FALLBACK_RATES = [
        { id: 'andreani',    name: 'Andreani Envío Nacional',          time: '3-5 días hábiles', price: 4500 },
        { id: 'oca',         name: 'OCA Envíos a Domicilio',           time: '4-6 días hábiles', price: 5200 },
        { id: 'envios_pack', name: 'Envíos Pack Estándar',             time: '2-4 días hábiles', price: 3800 },
      ];
      const isCABAorGBA = provincia.toLowerCase().includes('buenos aires') || provincia.toLowerCase().includes('autónoma');
      if (isCABAorGBA) {
        FALLBACK_RATES.unshift({ id: 'motomensajeria', name: 'Motomensajería Express (CABA/GBA)', time: 'Entrega en 24h hábiles', price: 3500 });
      }

      let finalRates = [];
      try {
        const shippingRes = await fetch(
          `${BACKEND_URL}/api/payments/shipping-rates`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Payload completo conforme spec da Tiendanube Shipping Carrier API
              shipping_address: {
                zipcode:  numericCode,
                street:   rua.trim(),
                number:   numero.trim(),
                floor:    formData.complemento.trim() || '',
                locality: bairro.trim(),
                city:     cidade.trim(),
                province: provincia.trim(),
                country:  'AR'
              },
              // Dados dos produtos para cálculo de volumetria
              currency: 'ARS',
              products: (cart || []).map(item => ({
                variant_id: item.tiendanubeVariantId || item.id || null,
                id: item.id, quantity: item.quantity || 1,
                weight: String(item.weight || '0.500'),
                width:  String(item.width  || '10.00'),
                height: String(item.height || '10.00'),
                depth:  String(item.depth  || '10.00'),
              }))
            }),
            signal: AbortSignal.timeout(12000)
          }
        );
        if (shippingRes.ok) {
          const shippingData = await shippingRes.json();
          if (Array.isArray(shippingData.rates) && shippingData.rates.length > 0) {
            finalRates = shippingData.rates;
            console.log(`[Frete] ${finalRates.length} opção(ões) da Tiendanube para ${bairro}, ${cidade}.`);
          } else {
            console.warn('[Frete] Tiendanube retornou lista vazia. Usando fallback.');
          }
        }
      } catch (err) {
        console.warn('[Frete] Backend indisponível:', err.message);
      }

      if (finalRates.length === 0) finalRates = FALLBACK_RATES;
      setShippingOptions(finalRates);
      setSelectedShipping(finalRates[0]);
      setIsCalculatingShipping(false);
      console.log(`[Frete] Endereço completo: ${rua} ${numero}, ${bairro}, ${cidade} ${numericCode}`);
    };

    // Debounce de 800ms para não disparar a cada tecla no campo "numero"
    const timer = setTimeout(fetchShippingRates, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.rua, formData.numero, formData.bairro, formData.codigoPostal, zipSearched]);

  // Mudança de campos de cartão
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      formattedValue = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
      const cleanNumber = value.replace(/\s+/g, '');
      if (cleanNumber.startsWith('4')) setCardBrand('Visa');
      else if (cleanNumber.startsWith('5')) setCardBrand('Mastercard');
      else if (cleanNumber.startsWith('3')) setCardBrand('American Express');
      else if (cleanNumber.startsWith('6')) setCardBrand('Discover');
      else setCardBrand('');
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
    setCardToken('');
  };

  // ─── TABELA INTERNA: CP CABA → BAIRRO(S) ─────────────────────────────────────
  // Valor string = CP unívoco → preenche automaticamente
  // Valor array  = CP multi-zona → campo Barrio vira <select> dropdown
  // Fonte: Correo Argentino + conhecimento da divisão postal de CABA.
  const CABA_BARRIO_TABLE = {
    // Microcentro / Centro — unión de barrios históricos

    1000:['Microcentro','San Nicolás'], 1001:'San Nicolás', 1002:'San Nicolás',
    1003:'Monserrat',  1004:'Monserrat',  1005:'Monserrat',
    1006:'San Nicolás', 1007:'San Nicolás', 1008:'San Nicolás',
    1009:'Retiro',     1010:'Retiro',     1011:'Retiro',     1012:'Retiro',
    1013:'San Telmo',  1014:'San Telmo',  1015:'San Telmo',  1016:'San Telmo',
    1017:'Constitución',1018:'Constitución',
    // CP 1019: Zona Microcentro Sur — multi-zona (spec: San Nicolás, Recoleta, Palermo)
    // Nota: na geopolitíca dos CPs de CABA, 1019 abrange o corredor da Av. Corrientes.
    // Oferece as opções conforme especificado: San Nicolás é o default (mais próximo geo).
    1019:['San Nicolás','Recoleta','Palermo'],
    1020:'Puerto Madero',1021:'Puerto Madero',1022:'Puerto Madero',
    1023:'Monserrat',  1024:'Monserrat',  1025:'Monserrat',  1026:'Monserrat',
    1027:'Monserrat',  1028:'Monserrat',  1029:'Monserrat',
    // Balvanera / San Cristóbal
    1030:'Balvanera',  1031:'Balvanera',  1032:'Balvanera',  1033:'Balvanera',
    1034:'San Cristóbal',1035:'San Cristóbal',1036:'Balvanera',1037:'Balvanera',
    1038:'Balvanera',  1039:'Balvanera',
    1040:'Balvanera',  1041:'Balvanera',  1042:'Balvanera',  1043:'Balvanera',
    1044:'Balvanera',  1045:'Balvanera',  1046:'Balvanera',  1047:'Balvanera',
    1048:'Balvanera',  1049:'Balvanera',
    1050:'Balvanera',  1051:'Balvanera',  1052:'Balvanera',  1053:'Balvanera',
    1054:'Balvanera',  1055:'Balvanera',  1056:'Balvanera',  1057:'Balvanera',
    1058:'Balvanera',  1059:'Balvanera',
    1060:'Almagro',    1061:'Almagro',    1062:'Almagro',    1063:'Almagro',
    1064:'Almagro',    1065:'Almagro',    1066:'Almagro',    1067:'Almagro',
    1068:'Almagro',    1069:'Almagro',
    1070:'Boedo',      1071:'Boedo',      1072:'Boedo',      1073:'Boedo',
    1074:'Boedo',      1075:'Boedo',      1076:'Boedo',      1077:'Boedo',
    1078:'Boedo',      1079:'Boedo',
    1080:'Balvanera',  1081:'Balvanera',  1082:'Balvanera',  1083:'San Cristóbal',
    1084:'San Cristóbal',1085:'San Cristóbal',1086:'San Cristóbal',
    1087:'Parque Patricios',1088:'Parque Patricios',1089:'Parque Patricios',
    1090:'Parque Patricios',1091:'Parque Patricios',1092:'Parque Patricios',
    1093:'Parque Patricios',1094:'Parque Patricios',1095:'Parque Patricios',
    // La Boca / Barracas
    1100:'La Boca',    1101:'La Boca',    1102:'La Boca',    1103:'La Boca',
    1104:'La Boca',
    1150:'Barracas',   1151:'Barracas',   1152:'Barracas',   1153:'Barracas',
    1154:'Barracas',   1155:'Barracas',   1156:'Barracas',
    // Caballito / Villa Crespo / Almagro — faixa de transição
    1200:'Caballito',  1201:'Caballito',  1202:'Caballito',  1203:'Caballito',
    1204:'Caballito',  1205:'Caballito',  1206:'Caballito',
    1207:'Villa Crespo',1208:'Villa Crespo',1209:'Villa Crespo',
    1210:'Villa Crespo',1211:'Villa Crespo',
    1212:'Almagro',    1213:'Almagro',    1214:'Almagro',    1215:'Almagro',
    // Recoleta / Barrio Norte — multi-zona real
    1300:['Palermo','Recoleta'],
    1301:'Palermo',    1302:'Palermo',    1303:'Palermo',    1304:'Palermo',
    1305:'Palermo',    1306:'Palermo',    1307:'Palermo',    1308:'Palermo',
    1309:'Palermo',    1310:'Palermo',
    1320:'Recoleta',   1321:'Recoleta',   1322:'Recoleta',   1323:'Recoleta',
    1324:'Recoleta',   1325:'Recoleta',   1326:'Recoleta',   1327:'Recoleta',
    // Flores / Floresta
    1400:'Flores',     1401:'Flores',     1402:'Flores',     1403:'Flores',
    1404:'Flores',     1405:'Flores',     1406:'Flores',     1407:'Flores',
    1408:'Flores',     1409:'Flores',
    1410:'Floresta',   1411:'Floresta',   1412:'Floresta',   1413:'Floresta',  1414:'Floresta',
    // Villa del Parque / Devoto
    1415:'Villa del Parque',1416:'Villa del Parque',1417:'Villa del Parque',
    1418:'Devoto',     1419:'Devoto',
    // Palermo / Villa Crespo / Belgrano
    1420:'Palermo',    1421:'Palermo',    1422:'Palermo',    1423:'Palermo',
    1424:'Palermo',    1425:'Palermo',    1426:'Palermo',
    1427:'Belgrano',   1428:'Belgrano',
    // Belgrano / Núñez / Colegiales — faixa de transição
    1429:['Belgrano','Núñez'],
    1430:'Colegiales', 1431:'Colegiales', 1432:'Colegiales',
    1440:'Saavedra',   1441:'Saavedra',   1442:'Saavedra',   1443:'Saavedra',
    1444:'Villa Urquiza',1445:'Villa Urquiza',1446:'Villa Urquiza',1447:'Villa Urquiza',
    1448:'Villa Pueyrredón',1449:'Villa Pueyrredón',
    1470:'Villa Soldati',1471:'Villa Soldati',
  };


  // ─── LOOKUP DE CEP: Arquitetura Multi-Localidade ────────────────────────────
  // Fluxo:
  //   1. Nominatim (limit=5) → detecta se o CP cobre múltiplas localidades
  //   2. Se múltiplas → isMultipleZone=true, mostra dropdown ao usuário
  //   3. Se única → preenche automaticamente
  //   4. Tabela CABA local → enriquece o bairro (Nominatim não tem suburb na CABA)
  //   5. Tabela GBA/Interior → fallback mínimo quando APIs falham
  // ─────────────────────────────────────────────────────────────────────────────
  const handlePostalCodeLookup = async () => {
    const cleanZip = formData.codigoPostal.trim().toUpperCase();
    if (!cleanZip) {
      showAlert('Código Postal', 'Por favor, ingrese un código postal.', 'error');
      return;
    }

    const isValidZip = /^(?:[A-HJ-NP-Z]?\d{4}[A-Z]{3}|\d{4})$/i.test(cleanZip);
    if (!isValidZip) {
      showAlert('Código Postal Inválido', 'El formato debe ser numérico de 4 dígitos (Ej: 1081) o CPA alfanumérico (Ej: C1043DFG).', 'error');
      return;
    }

    setIsCalculatingShipping(true);
    setZipSearched(true);
    setSelectedShipping(null);
    setAvailableBarrios([]);
    setIsMultipleZone(false);

    let numericCode = cleanZip;
    const cpaMatch = cleanZip.match(/^[A-Z](\d{4})[A-Z]{3}$/i);
    if (cpaMatch) numericCode = cpaMatch[1];
    const numInt = parseInt(numericCode, 10);

    // ─── TABELA GBA/INTERIOR — faixas corrigidas ───────────────────────────────

    // ERRO ANTERIOR: 1500–1899 todo para Avellaneda (ERRADO).
    // Avellaneda é apenas faixa 1870–1879. A região 1600–1699 é San Martín.
    const GBA_INTERIOR_TABLE = [
      { min:1500, max:1569, city:'Morón',                   province:'Buenos Aires' },
      { min:1570, max:1599, city:'Merlo',                   province:'Buenos Aires' },
      { min:1600, max:1617, city:'Vicente López',            province:'Buenos Aires' },
      { min:1618, max:1663, city:'General San Martín',       province:'Buenos Aires' },
      { min:1664, max:1699, city:'Tres de Febrero',         province:'Buenos Aires' },
      { min:1700, max:1749, city:'Morón',                   province:'Buenos Aires' },
      { min:1750, max:1769, city:'Ituzaingó',               province:'Buenos Aires' },
      { min:1770, max:1799, city:'La Matanza',              province:'Buenos Aires' },
      { min:1800, max:1849, city:'Tigre',                   province:'Buenos Aires' },
      { min:1850, max:1869, city:'San Isidro',              province:'Buenos Aires' },
      { min:1870, max:1879, city:'Avellaneda',              province:'Buenos Aires' },
      { min:1880, max:1889, city:'Quilmes',                 province:'Buenos Aires' },
      { min:1890, max:1899, city:'Berazategui',             province:'Buenos Aires' },
      { min:1900, max:1999, city:'La Plata',                province:'Buenos Aires' },
      { min:2000, max:2199, city:'Rosario',                 province:'Santa Fe'     },
      { min:2200, max:2399, city:'Rafaela',                 province:'Santa Fe'     },
      { min:2400, max:2499, city:'Santiago del Estero',     province:'Santiago del Estero' },
      { min:2600, max:2799, city:'Santa Rosa',              province:'La Pampa'     },
      { min:2900, max:2999, city:'Bahía Blanca',            province:'Buenos Aires' },
      { min:3000, max:3299, city:'Santa Fe',                province:'Santa Fe'     },
      { min:3300, max:3499, city:'Paraná',                  province:'Entre Ríos'   },
      { min:3500, max:3599, city:'Resistencia',             province:'Chaco'        },
      { min:3600, max:3699, city:'Formosa',                 province:'Formosa'      },
      { min:3700, max:3799, city:'Posadas',                 province:'Misiones'     },
      { min:4000, max:4199, city:'San Miguel de Tucumán',   province:'Tucumán'      },
      { min:4200, max:4299, city:'Santiago del Estero',     province:'Santiago del Estero' },
      { min:4400, max:4499, city:'Salta',                   province:'Salta'        },
      { min:4600, max:4699, city:'San Salvador de Jujuy',   province:'Jujuy'        },
      { min:4700, max:4799, city:'Catamarca',               province:'Catamarca'    },
      { min:5000, max:5299, city:'Córdoba',                 province:'Córdoba'      },
      { min:5400, max:5499, city:'San Juan',                province:'San Juan'     },
      { min:5500, max:5699, city:'Mendoza',                 province:'Mendoza'      },
      { min:5700, max:5799, city:'San Luis',                province:'San Luis'     },
      { min:6000, max:6099, city:'Mar del Plata',           province:'Buenos Aires' },
      { min:6100, max:6499, city:'Azul',                    province:'Buenos Aires' },
      { min:6500, max:6599, city:'Santa Rosa',              province:'La Pampa'     },
      { min:7000, max:7099, city:'Tandil',                  province:'Buenos Aires' },
      { min:7100, max:7499, city:'Bahía Blanca',            province:'Buenos Aires' },
      { min:7500, max:7599, city:'Necochea',                province:'Buenos Aires' },
      { min:8000, max:8199, city:'Neuquén',                 province:'Neuquén'      },
      { min:8200, max:8399, city:'Bariloche',               province:'Río Negro'    },
      { min:8400, max:8599, city:'Viedma',                  province:'Río Negro'    },
      { min:9000, max:9099, city:'Comodoro Rivadavia',      province:'Chubut'       },
      { min:9100, max:9299, city:'Trelew',                  province:'Chubut'       },
      { min:9300, max:9399, city:'Puerto Madryn',           province:'Chubut'       },
      { min:9400, max:9499, city:'Río Gallegos',            province:'Santa Cruz'   },
      { min:9410, max:9499, city:'Ushuaia',                 province:'Tierra del Fuego' },
    ];

    let resolvedCity     = '';
    let resolvedProvince = '';
    let resolvedBairro   = '';

    // ── PASSO 1: Nominatim — Cidade e Província (limit=1 suficiente) ─────────────
    // O bairro será resolvido pela tabela CABA ou pelo Nominatim como fallback.
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${numericCode}&country=AR&format=json&addressdetails=1&limit=1`,
        {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'RaicesHeritageMate/1.0 (raicesoficial.online)' }
        }
      );
      if (res.ok) {
        const data = await res.json();
        const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (result?.address) {
          const addr = result.address;
          resolvedCity     = addr.city || addr.town || addr.municipality || addr.county || '';
          resolvedProvince = addr.state || '';
          // Bairro do Nominatim só se não vier da tabela CABA (prioridade tabela)
          resolvedBairro   = addr.suburb || addr.neighbourhood || addr.quarter || '';
        }
      }
    } catch (err) {
      console.warn('[CP Lookup] Nominatim falhou:', err.message);
    }

    // ── PASSO 2: Zippopotam — fallback para interior ─────────────────────────────
    if (!resolvedCity) {
      try {
        const res = await fetch(`https://api.zippopotam.us/ar/${numericCode}`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const places = data?.places;
          if (places && places.length > 0) {
            resolvedCity     = places[0]['place name'] || '';
            resolvedProvince = normalizeProvince(places[0]['state'] || '');
          }
        }
      } catch (err) {
        console.warn('[CP Lookup] Zippopotam falhou:', err.message);
      }
    }

    // ── PASSO 3: GBA/Interior — fallback numérico corrigido ─────────────────────
    if (!resolvedCity) {
      if (numInt >= 1000 && numInt <= 1499) {
        resolvedCity     = 'Buenos Aires';
        resolvedProvince = 'Ciudad Autónoma de Buenos Aires';
      } else {
        const match = GBA_INTERIOR_TABLE.find(r => numInt >= r.min && numInt <= r.max);
        if (match) { resolvedCity = match.city; resolvedProvince = match.province; }
      }
    }
    resolvedProvince = normalizeProvince(resolvedProvince);

    // ── PASSO 4: CABA_BARRIO_TABLE — autoridade sobre bairro ─────────────────────
    // Tabela tem prioridade sobre Nominatim para CABA.
    // String → CP unívoco, Array → CP multi-zona (campo Barrio vira dropdown).
    const cabaEntry = CABA_BARRIO_TABLE[numInt];
    if (cabaEntry) {
      if (Array.isArray(cabaEntry)) {
        // CP MULTI-ZONA: mostra dropdown no campo Barrio
        setAvailableBarrios(cabaEntry);
        setIsMultipleZone(true);
        resolvedBairro = cabaEntry[0]; // primeira opção como padrão
        console.log(`[CP Lookup] Multi-zona CABA: [${cabaEntry.join(', ')}] para CP ${numericCode}`);
      } else {
        // CP UNÍVOCO: preenche direto
        setAvailableBarrios([]);
        setIsMultipleZone(false);
        resolvedBairro = cabaEntry;
      }
    } else if (resolvedBairro) {
      // Nominatim retornou suburb para CPs fora da tabela CABA
      setAvailableBarrios([]);
      setIsMultipleZone(false);
    } else {
      setAvailableBarrios([]);
      setIsMultipleZone(false);
    }

    // ── PASSO 5: Atualiza formulário ─────────────────────────────────────────────
    setFormData(prev => ({
      ...prev,
      bairro:   resolvedBairro,
      cidade:   resolvedCity,
      provincia: resolvedProvince,
    }));

    // zipSearched=true dispara o useEffect de frete (quando rua+numero forem preenchidos)
    setIsCalculatingShipping(false);
  };


  // Motor de cupons com validação no backend Render/Local e trava de duplicidade

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          couponCode: couponInput, 
          email: formData.email || 'guest@raices.com' 
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon({ code: data.code, rate: data.rate });
        setCouponError('');
        showAlert(t('checkout_coupon_applied'), data.message, 'success');
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || t('checkout_coupon_invalid'));
        showAlert('Error', data.message || t('checkout_coupon_invalid'), 'error');
      }
    } catch (err) {
      console.warn('Erro ao conectar ao backend para cupom, validando localmente:', err);
      // Fallback local se backend offline
      const normalized = couponInput.trim().toUpperCase();
      if (normalized === 'RAICES5') {
        if (appliedCoupon && appliedCoupon.code === 'RAICES5') {
          showAlert('Cupón ya aplicado', 'Este cupón ya está activo en su compra.', 'warning');
          return;
        }
        setAppliedCoupon({ code: 'RAICES5', rate: 0.05 });
        setCouponError('');
        showAlert('Cupón Aplicado', '¡Cupón de bienvenida (5% OFF) aplicado con éxito!', 'success');
      } else {
        setAppliedCoupon(null);
        setCouponError(t('checkout_coupon_invalid'));
        showAlert('Error', t('checkout_coupon_invalid'), 'error');
      }
    }
  };



  const handleApplyMethod = (method) => {
    setPaymentMethod(method);
    setCardToken('');
  };

  // Finalização do Pedido (Envio da transação e receipt)
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!isDeliverySectionValid) {
      showAlert('Campos Incompletos', t('checkout_validation_error'), 'error');
      return;
    }

    setIsSubmitting(true);
    const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // A. Fluxo para Transferência Bancária / QR Code:
    // CICLO DE VIDA COMPLETO: Cria pedido (draft) no backend PRIMEIRO,
    // só abre o WhatsApp após o backend confirmar 201 — garantindo registro no histórico.
    if (paymentMethod === 'transfer' || paymentMethod === 'qr') {
      const orderItems = cart.map(item => `${item.quantity}x ${item.name}`).join('%0A');
      const methodLabel = paymentMethod === 'transfer' ? 'Transferencia (10% OFF)' : 'Mercado Pago QR (10% OFF)';
      const couponLine = appliedCoupon ? `%0A*Cupón:* ${appliedCoupon.code} (-5% OFF)` : '';
      const waMessage = `*NUEVO PEDIDO - RAÍCES*%0A%0A*Cliente:* ${formData.nome}%0A*Email:* ${formData.email}%0A*WhatsApp:* ${formData.telefone}%0A*Dirección:* ${formData.rua} ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''} - Barrio: ${formData.bairro}, ${formData.cidade} - ${formData.provincia} (${formData.codigoPostal})%0A%0A*Items:*%0A${orderItems}%0A%0A*Envío:* ${selectedShipping.name} (${formatPrice(selectedShipping.price)})%0A*Descuento ${methodLabel}:* -${formatPrice(paymentDiscountAmount)}${couponLine}%0A*Total Final:* ${formatPrice(totalFinal)}%0A%0A_Aguardando comprobante de pago para el Alias: RAICES.MATE_`;

      try {
        // ─ BLOCKING: Cria o rascunho de pedido (Draft Order) no backend antes de abrir o WhatsApp
        const draftRes = await fetch(`${BACKEND_URL}/api/payments/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId,
            email: formData.email,
            cart,
            shippingAddress: {
              name:     formData.nome,
              phone:    formData.telefone,
              street:   formData.rua,
              number:   formData.numero,
              floor:    formData.complemento || '',
              locality: formData.bairro,
              city:     formData.cidade,
              zip:      formData.codigoPostal,
              province: formData.provincia
            },
            shippingMethod: selectedShipping.id,
            shippingCost:   selectedShipping.price,
            paymentMethod,
            couponCode: appliedCoupon?.code || null
          }),
          signal: AbortSignal.timeout(15000)
        });

        const draftData = await draftRes.json().catch(() => ({}));

        if (!draftRes.ok && draftRes.status !== 200) {
          // Backend retornou erro real (não timeout) — avisa mas não bloqueia o WhatsApp
          console.warn('[Checkout WA] Backend retornou erro:', draftData.message);
        } else {
          console.log('[Checkout WA] Pedido registrado. ID:', draftData?.order?.orderId || transactionId);
        }
      } catch (err) {
        // Timeout / backend offline — continua para o WhatsApp mas loga o problema
        console.warn('[Checkout WA] Backend indisponível ao criar rascunho:', err.message);
      }

      // Abre WhatsApp (independente do resultado do backend para não bloquear a venda)
      window.open(`https://wa.me/5491100000000?text=${waMessage}`, '_blank');
      setIsSubmitting(false);
      setSuccessOrder(true);
      setTimeout(() => { clearCart(); navigate('/'); }, 4500);
      return;
    }

    // B. Fluxo para Cartão — Processa via backend (Tiendanube / gateway configurado)
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const { number, holder, expiry, cvv } = cardData;
      const cleanNumber = number.replace(/\s+/g, '');
      const methodLabel = paymentMethod === 'credit_card' ? 'Tarjeta de Crédito (5% OFF)' : 'Tarjeta de Débito (10% OFF)';

      // Validação dos campos do cartão
      if (!cleanNumber || cleanNumber.length < 15) {
        showAlert('Tarjeta Inválida', 'Por favor, ingrese un número de tarjeta válido (15-16 dígitos).', 'error');
        setIsSubmitting(false);
        return;
      }
      if (!holder || holder.trim().length < 2) {
        showAlert('Titular Requerido', 'Por favor, ingrese el nombre del titular como aparece en la tarjeta.', 'error');
        setIsSubmitting(false);
        return;
      }
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        showAlert('Vencimiento Inválido', 'Por favor, ingrese la fecha de vencimiento en formato MM/AA.', 'error');
        setIsSubmitting(false);
        return;
      }
      if (!cvv || cvv.length < 3) {
        showAlert('CVV Inválido', 'Por favor, ingrese el código de seguridad (3 o 4 dígitos).', 'error');
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/payments/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId,
            email:    formData.email,
            cart,
            shippingAddress: {
              name:     formData.nome,
              phone:    formData.telefone,
              street:   formData.rua,
              number:   formData.numero,
              floor:    formData.complemento || '',
              locality: formData.bairro,
              city:     formData.cidade,
              zip:      formData.codigoPostal,
              province: formData.provincia
            },
            shippingMethod: selectedShipping.id,
            shippingCost:   selectedShipping.price,
            paymentMethod,
            couponCode:     appliedCoupon?.code || null,
            // Dados do cartão — backend deve encaminhar para o gateway configurado (MP/etc.)
            // NUNCA logar nem armazenar estes dados em texto claro no servidor
            card: {
              number:    cleanNumber,       // apenas para tokenização no backend
              holder:    holder.trim(),
              expiry,
              cvv,
              brand:     cardBrand || 'unknown',
              last4:     cleanNumber.slice(-4),
            }
          }),
          signal: AbortSignal.timeout(30000)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          // ✅ Pedido aprovado pelo backend / gateway
          setIsSubmitting(false);
          setSuccessOrder(true);
          setTimeout(() => {
            clearCart();
            navigate('/');
          }, 4500);
        } else {
          // ❌ Gateway recusou o pagamento — exibe motivo
          setIsSubmitting(false);
          const reason = data.message || data.error || 'El pago fue rechazado. Verifique los datos de la tarjeta o intente con otra.';
          showAlert('Pago No Aprobado', reason, 'error');
        }
      } catch (err) {
        // ⚠️ Backend offline ou timeout — oferta alternativa via WhatsApp
        console.warn('[Checkout] Backend indisponível para cartão:', err.message);
        setIsSubmitting(false);
        const orderItems = cart.map(item => `${item.quantity}x ${item.name}`).join('%0A');
        const maskedCard = `**** **** **** ${cleanNumber.slice(-4)}`;
        const couponLine = appliedCoupon ? `%0A*Cupón:* ${appliedCoupon.code} (-${(appliedCoupon.rate * 100).toFixed(0)}% OFF)` : '';
        const message = `*PEDIDO CON TARJETA - RAÍCES*%0A%0A*Cliente:* ${formData.nome}%0A*Email:* ${formData.email}%0A*Dirección:* ${formData.rua} ${formData.numero}, ${formData.bairro}, ${formData.cidade} (${formData.codigoPostal})%0A%0A*Items:*%0A${orderItems}%0A%0A*Envío:* ${selectedShipping.name} (${formatPrice(selectedShipping.price)})%0A*Método:* ${methodLabel}%0A*Tarjeta:* ${maskedCard} - Titular: ${holder}${couponLine}%0A*Total Final:* ${formatPrice(totalFinal)}%0A%0A⚠️ _El sistema de pago online no está disponible en este momento. Por favor, envíe los datos para procesar manualmente._`;
        if (window.confirm('El sistema de pago online no está disponible. ¿Desea continuar por WhatsApp para que procesemos manualmente?')) {
          window.open(`https://wa.me/5491100000000?text=${message}`, '_blank');
          setSuccessOrder(true);
          setTimeout(() => { clearCart(); navigate('/'); }, 4500);
        }
      }
    }
  };


  if (cart.length === 0 && !successOrder) {
    return (
      <div className="checkout-empty">
        <h2>{t('checkout_empty')}</h2>
        <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '1.5rem' }}>
          {t('checkout_empty_btn')}
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-transfer-container">
      {successOrder && (
        <div className="success-screen-overlay">
          <div className="success-icon-badge">✓</div>
          <h2>{t('checkout_success_title')}</h2>
          <p style={{ maxWidth: '400px', fontSize: '1.05rem', color: '#666', marginTop: '1rem' }}>
            {t('checkout_success_message')}
          </p>
          <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem', width: '100%', maxWidth: '350px' }}>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              <strong>Código de Operación:</strong> {`TX-${Date.now().toString().slice(-6)}`}
            </p>
          </div>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate('/')}>
        {t('checkout_back')}
      </button>

      <div className="checkout-grid">
        {/* Left Side: Delivery and Payment Info */}
        <div className="checkout-form">
          <h2>{t('checkout_sec_delivery')}</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>{t('checkout_fullname')} *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('checkout_email')} *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>{t('checkout_phone')} *</label>
                <input type="text" name="telefone" placeholder="+54 9 11 ..." value={formData.telefone} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              {/* Código Postal — autocomplete com sugestões de localidades */}
              <div className="form-group" style={{ position: 'relative' }} data-cp-autocomplete>
                <label>
                  {t('checkout_postal_code')} *
                  {isLoadingCp && (
                    <span style={{ fontSize: '0.72rem', color: '#4A7C59', fontWeight: 400, marginLeft: '0.5rem' }}>
                      🔍 buscando localidades...
                    </span>
                  )}
                </label>
                <div className="postal-search-wrapper">
                  <input
                    type="text"
                    name="codigoPostal"
                    placeholder="Ej: 1074 o 1081"
                    value={formData.codigoPostal}
                    onChange={handleCpInput}
                    onBlur={() => setTimeout(() => setShowCpDropdown(false), 200)}
                    autoComplete="off"
                    maxLength={4}
                    required
                  />
                  <button type="button" className="postal-search-btn" onClick={handlePostalCodeLookup}>
                    Buscar
                  </button>
                </div>
                {/* Dropdown de localidades */}
                {showCpDropdown && cpSuggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #E8C99A', borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.13)', zIndex: 999, margin: 0,
                    padding: '0.25rem 0', listStyle: 'none', maxHeight: '220px', overflowY: 'auto'
                  }}>
                    {cpSuggestions.map((sug, idx) => (
                      <li
                        key={idx}
                        onMouseDown={(ev) => { ev.preventDefault(); handleCpSuggestionSelect(sug); }}
                        style={{
                          padding: '0.65rem 1rem', cursor: 'pointer',
                          borderBottom: idx < cpSuggestions.length - 1 ? '1px solid #F5ECD5' : 'none',
                          display: 'flex', flexDirection: 'column', gap: '2px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF8F0'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong style={{ color: '#3D2B1F', fontSize: '0.95rem' }}>
                          {sug.suburb ? `${sug.suburb} — ${sug.city}` : sug.city}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#8B6B4A' }}>
                          {sug.province} · CP {sug.postcode.replace(/[^\d]/g, '').slice(0, 4)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ciudad: sempre input — preenchido automaticamente pelo CP */}
              <div className="form-group">
                <label>{t('checkout_city')} *</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} required />
              </div>
            </div>

            {/* Banner informativo para CP multi-zona CABA */}
            {isMultipleZone && (
              <div style={{
                background: '#FFF8F0', border: '1px solid #E8C99A', borderRadius: '8px',
                padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#7A5230',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <span>
                  <strong>Su CP cubre varios barrios.</strong> Seleccione el barrio correcto en el campo <em>Barrio / Zona</em> — esto garantiza el cálculo de flete preciso.
                </span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>{t('checkout_province')} *</label>
                <input type="text" name="provincia" value={formData.provincia} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              {/* Calle / Avenida — autocomplete com sugestões baseadas na rua + número */}
              <div className="form-group" style={{ position: 'relative' }} data-address-autocomplete>
                <label>
                  Calle / Avenida *
                  {isLoadingAddress && (
                    <span style={{ fontSize: '0.72rem', color: '#4A7C59', fontWeight: 400, marginLeft: '0.5rem' }}>
                      🔍 buscando dirección...
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="rua"
                  placeholder="Ej: Sarandi  /  Av. Corrientes"
                  value={formData.rua}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                />
                {/* Dropdown de endereços sugeridos */}
                {showAddressDropdown && addressSuggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #E8C99A', borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.13)', zIndex: 999, margin: 0,
                    padding: '0.25rem 0', listStyle: 'none', maxHeight: '220px', overflowY: 'auto'
                  }}>
                    {addressSuggestions.map((sug, idx) => (
                      <li
                        key={idx}
                        onMouseDown={(ev) => { ev.preventDefault(); handleAddressSuggestionSelect(sug); }}
                        style={{
                          padding: '0.65rem 1rem', cursor: 'pointer',
                          borderBottom: idx < addressSuggestions.length - 1 ? '1px solid #F5ECD5' : 'none',
                          display: 'flex', flexDirection: 'column', gap: '2px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF8F0'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong style={{ color: '#3D2B1F', fontSize: '0.95rem' }}>
                          {sug.road} {sug.house_number}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#8B6B4A' }}>
                          {sug.suburb ? `${sug.suburb}, ` : ''}{sug.city} · {sug.province} · CP {sug.postcode}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>
                  Número *
                  <span style={{ fontSize: '0.72rem', color: '#4A7C59', fontWeight: 400, marginLeft: '0.4rem' }}>
                    (calcula flete al completar)
                  </span>
                </label>
                <input type="text" name="numero" placeholder="Ej: 31" value={formData.numero} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Piso / Depto / Complemento (Opcional)</label>
                <input type="text" name="complemento" placeholder="Ej: Piso 3B" value={formData.complemento} onChange={handleInputChange} />
              </div>

              {/* Barrio / Zona: dropdown se CP multi-zona (CABA), input se unívoco ou interior */}
              <div className="form-group">
                <label>
                  Barrio / Zona *
                  {isMultipleZone && (
                    <span style={{ fontSize: '0.72rem', color: '#8B5E3C', fontWeight: 400, marginLeft: '0.4rem' }}>
                      — seleccione su barrio
                    </span>
                  )}
                </label>
                {isMultipleZone ? (
                  <select
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleBairroSelect}
                    required
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
                      border: '2px solid #E8C99A', fontSize: '1rem', background: '#FFFDF9',
                      color: '#3D2B1F', cursor: 'pointer', appearance: 'auto'
                    }}
                  >
                    {availableBarrios.map((barrio, idx) => (
                      <option key={idx} value={barrio}>{barrio}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="bairro"
                    placeholder="Ej: Palermo"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    required
                  />
                )}
              </div>
            </div>


            {/* Opções de Frete (Tiendanube API integration) */}
            {zipSearched && (
              <div style={{ marginTop: '2rem' }}>
                <h3>{t('checkout_shipping_title')}</h3>
                {isCalculatingShipping ? (
                  <p style={{ padding: '1rem', color: '#666' }}>{t('checkout_shipping_loading')}</p>
                ) : (
                  <div className="shipping-choices-container">
                    {shippingOptions.map(option => (
                      <div 
                        key={option.id}
                        className={`shipping-choice-card ${selectedShipping?.id === option.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedShipping(option);
                        }}
                      >
                        <input 
                          type="radio" 
                          name="shipping_method" 
                          checked={selectedShipping?.id === option.id}
                          onChange={() => {}}
                        />
                        <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                          <strong style={{ color: 'var(--color-accent-green)', display: 'block' }}>{option.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{option.time}</span>
                        </div>
                        <strong style={{ color: 'var(--color-highlight-terracotta)' }}>{formatPrice(option.price)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Step 2: Método de Pago (Habilitado apenas com Barreira de Estado Validada) */}
          <div className="state-barrier-container">
            {!isDeliverySectionValid && (
              <div className="state-barrier-overlay">
                <div className="lock-icon-wrapper">🔒</div>
                <p className="barrier-message">
                  {t('checkout_payment_locked')}
                </p>
              </div>
            )}

            <h2>{t('checkout_sec_payment')}</h2>
            <div className="payment-grid-options">
              <div 
                className={`payment-card-option ${paymentMethod === 'transfer' ? 'selected' : ''}`}
                onClick={() => handleApplyMethod('transfer')}
              >
                <strong>Transferencia / Alias</strong>
                <span>10% OFF</span>
              </div>
              
              <div 
                className={`payment-card-option ${paymentMethod === 'qr' ? 'selected' : ''}`}
                onClick={() => handleApplyMethod('qr')}
              >
                <strong>Mercado Pago QR Code</strong>
                <span>10% OFF</span>
              </div>

              <div 
                className={`payment-card-option ${paymentMethod === 'debit_card' ? 'selected' : ''}`}
                onClick={() => handleApplyMethod('debit_card')}
              >
                <strong>Tarjeta de Débito</strong>
                <span>10% OFF</span>
              </div>

              <div 
                className={`payment-card-option ${paymentMethod === 'credit_card' ? 'selected' : ''}`}
                onClick={() => handleApplyMethod('credit_card')}
              >
                <strong>Tarjeta de Crédito</strong>
                <span>5% OFF</span>
              </div>
            </div>

            {/* Custom Payment Flow details based on selection */}
            {paymentMethod === 'transfer' && (
              <div className="bank-info-box">
                <h4 style={{ color: 'var(--color-accent-green)', marginBottom: '0.5rem' }}>Datos de Transferencia</h4>
                <p><strong>Alias:</strong> RAICES.MATE</p>
                <p><strong>CBU:</strong> 0070000000000000000000</p>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                  El descuento de 10% ya está aplicado en el resumen. Por favor, realice la transferencia y envíenos el comprobante al finalizar.
                </p>
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div className="bank-info-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.8rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--color-accent-green)' }}>Código QR de Pago Seguro</strong>
                <p style={{ fontSize: '0.82rem', color: '#555' }}>
                  Escanee el código QR dinámico desde su aplicación de pagos preferida.
                </p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=1e3f20&data=${encodeURIComponent(`https://raicesoficial.online/checkout/pay?amount=${totalFinal}`)}`}
                  alt="Código QR de Pago"
                  style={{ border: '2px solid var(--color-accent-green)', padding: '0.8rem', borderRadius: '12px', backgroundColor: '#fcfcfc', width: '280px', height: '280px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                />
              </div>
            )}

            {/* Formulário de Cartão Seguro com Tokenização de SDK MP */}
            {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
              <div className="card-form-wrapper">
                <h4 style={{ color: 'var(--color-accent-green)', marginBottom: '1rem' }}>
                  Conexión Segura de Pago Directo
                </h4>
                
                <div className="form-group">
                  <label>{t('checkout_card_number')}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      name="number" 
                      maxLength="19"
                      placeholder="4000 1234 5678 9010" 
                      value={cardData.number}
                      onChange={handleCardInputChange}
                    />
                    {cardBrand && (
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--color-highlight-terracotta)', fontSize: '0.85rem' }}>
                        {cardBrand}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('checkout_card_holder')}</label>
                  <input 
                    type="text" 
                    name="holder" 
                    placeholder="JUAN PEREZ" 
                    value={cardData.holder}
                    onChange={handleCardInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('checkout_card_expiry')}</label>
                    <input 
                      type="text" 
                      name="expiry" 
                      placeholder="12/30" 
                      maxLength="5"
                      value={cardData.expiry}
                      onChange={handleCardInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('checkout_card_cvv')}</label>
                    <input 
                      type="password" 
                      name="cvv" 
                      placeholder="123" 
                      maxLength="4"
                      value={cardData.cvv}
                      onChange={handleCardInputChange}
                    />
                  </div>
                </div>

                <p className="card-security-notice" style={{ marginTop: '1rem' }}>
                  <span>🛡️</span> Conexión encriptada SSL de extremo a extremo. Sus datos están completamente protegidos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Resumo de Compra Flutuante */}
        <div className="checkout-summary">
          <h2>{t('checkout_sec_summary')}</h2>
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
              <span>{t('subtotal')}:</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>

            {/* Cupom Boas-Vindas */}
            {appliedCoupon && (
              <div className="total-line discount-line">
                <span>Cupón ({appliedCoupon.code}):</span>
                <span>- {formatPrice(couponDiscountAmount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.5rem 0' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-accent-green)' }}>
                {t('checkout_coupon_label')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Ex: RAICES5"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem' }}
                />
                <button type="button" onClick={handleApplyCoupon} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  {t('checkout_coupon_btn')}
                </button>
              </div>
              {couponError && <span style={{ color: '#d9534f', fontSize: '0.78rem' }}>{couponError}</span>}
            </div>

            {/* Desconto de Modalidade de Pagamento */}
            {paymentMethod && paymentDiscountAmount > 0 && (
              <div className="total-line discount-line">
                <span>Descuento Pago ({paymentMethod === 'credit_card' ? '5%' : '10%'}):</span>
                <span>- {formatPrice(paymentDiscountAmount)}</span>
              </div>
            )}

            <div className="total-line">
              <span>{t('checkout_shipping_cost')}:</span>
              <span>{selectedShipping ? formatPrice(selectedShipping.price) : t('checkout_shipping_loading')}</span>
            </div>

            <div className="total-line final-total">
              <span>{t('checkout_total_pay')}:</span>
              <span>{formatPrice(totalFinal)}</span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-whatsapp-checkout" 
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !isDeliverySectionValid || !paymentMethod}
            style={{ 
              backgroundColor: ['transfer', 'qr'].includes(paymentMethod) ? '#25D366' : 'var(--color-accent-green)',
              color: 'white',
              fontSize: '1rem',
              padding: '1.2rem',
              borderRadius: '8px',
              width: '100%',
              display: 'block'
            }}
          >
            {isSubmitting 
              ? 'Procesando...' 
              : ['transfer', 'qr'].includes(paymentMethod) 
                ? t('checkout_btn_whatsapp') 
                : t('checkout_btn_mp')}
          </button>
          
          <p className="checkout-disclaimer">
            {t('checkout_terms_disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
