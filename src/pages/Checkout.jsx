import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from '../hooks/useTranslation';
import { useModal } from '../components/ModalProvider';
import '../components/CheckoutTransfer.css';
import { trackEvent } from '../utils/analytics';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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

// ─── TABELA INTERNA: CP CABA → BAIRRO(S) ─────────────────────────────────────
const CABA_BARRIO_TABLE = {
  1000:['Microcentro','San Nicolás'], 1001:'San Nicolás', 1002:'San Nicolás',
  1003:'Monserrat',  1004:'Monserrat',  1005:'Monserrat',
  1006:'San Nicolás', 1007:'San Nicolás', 1008:'San Nicolás',
  1009:'Retiro',     1010:'Retiro',     1011:'Retiro',     1012:'Retiro',
  1013:'San Telmo',  1014:'San Telmo',  1015:'San Telmo',  1016:'San Telmo',
  1017:'Constitución',1018:'Constitución',
  1019:['San Nicolás','Recoleta','Palermo'],
  1020:'Puerto Madero',1021:'Puerto Madero',1022:'Puerto Madero',
  1023:'Monserrat',  1024:'Monserrat',  1025:'Monserrat',  1026:'Monserrat',
  1027:'Monserrat',  1028:'Monserrat',  1029:'Monserrat',
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
  1100:'La Boca',    1101:'La Boca',    1102:'La Boca',    1103:'La Boca',
  1104:'La Boca',
  1150:'Barracas',   1151:'Barracas',   1152:'Barracas',   1153:'Barracas',
  1154:'Barracas',   1155:'Barracas',   1156:'Barracas',
  1200:'Caballito',  1201:'Caballito',  1202:'Caballito',  1203:'Caballito',
  1204:'Caballito',  1205:'Caballito',  1206:'Caballito',
  1207:'Villa Crespo',1208:'Villa Crespo',1209:'Villa Crespo',
  1210:'Villa Crespo',1211:'Villa Crespo',
  1212:'Almagro',    1213:'Almagro',    1214:'Almagro',    1215:'Almagro',
  1300:['Palermo','Recoleta'],
  1301:'Palermo',    1302:'Palermo',    1303:'Palermo',    1304:'Palermo',
  1305:'Palermo',    1306:'Palermo',    1307:'Palermo',    1308:'Palermo',
  1309:'Palermo',    1310:'Palermo',
  1320:'Recoleta',   1321:'Recoleta',   1322:'Recoleta',   1323:'Recoleta',
  1324:'Recoleta',   1325:'Recoleta',   1326:'Recoleta',   1327:'Recoleta',
  1400:'Flores',     1401:'Flores',     1402:'Flores',     1403:'Flores',
  1404:'Flores',     1405:'Flores',     1406:'Flores',     1407:'Flores',
  1408:'Flores',     1409:'Flores',
  1410:'Floresta',   1411:'Floresta',   1412:'Floresta',   1413:'Floresta',  1414:'Floresta',
  1415:'Villa del Parque',1416:'Villa del Parque',1417:'Villa del Parque',
  1418:'Devoto',     1419:'Devoto',
  1420:'Palermo',    1421:'Palermo',    1422:'Palermo',    1423:'Palermo',
  1424:'Palermo',    1425:'Palermo',    1426:'Palermo',
  1427:'Belgrano',   1428:'Belgrano',
  1429:['Belgrano','Núñez'],
  1430:'Colegiales', 1431:'Colegiales', 1432:'Colegiales',
  1440:'Saavedra',   1441:'Saavedra',   1442:'Saavedra',   1443:'Saavedra',
  1444:'Villa Urquiza',1445:'Villa Urquiza',1446:'Villa Urquiza',1447:'Villa Urquiza',
  1448:'Villa Pueyrredón',1449:'Villa Pueyrredón',
  1470:'Villa Soldati',1471:'Villa Soldati',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { t, formatPrice, lang } = useTranslation();
  const { showAlert } = useModal();

  useEffect(() => {
    if (cart.length > 0) {
      trackEvent('begin_checkout', {
        value: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        currency: 'ARS',
        items: cart.map(item => ({
          item_id: String(item.id),
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
  }, [cart]);

  const triggerPurchaseEvent = (transactionId) => {
    const totalFinalCalculated = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    trackEvent('purchase', {
      transaction_id: transactionId || `TX-${Date.now().toString().slice(-6)}`,
      value: totalFinalCalculated,
      currency: 'ARS',
      items: cart.map(item => ({
        item_id: String(item.id),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  };

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

  // 2b. Multi-bairro
  const [availableBarrios, setAvailableBarrios] = useState([]);
  const [isMultipleZone, setIsMultipleZone] = useState(false);

  // 2c. Autocomplete do Código Postal
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

  // 5. Estados do Cartão Seguro
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  const [cardBrand, setCardBrand] = useState('');
  const [cardToken, setCardToken] = useState('');

  // 6. Barreira de Estado
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

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const couponDiscountAmount = appliedCoupon ? cartSubtotal * appliedCoupon.rate : 0;
  
  const getModalidadeDiscountRate = () => {
    if (paymentMethod === 'credit_card') return 0.05; // 5% crédito
    if (['transfer', 'qr', 'debit_card'].includes(paymentMethod)) return 0.10; // 10% à vista/débito/qr
    return 0;
  };
  
  const modalidadeDiscountRate = getModalidadeDiscountRate();
  const paymentDiscountAmount = cartSubtotal * modalidadeDiscountRate;
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const totalFinal = cartSubtotal - couponDiscountAmount - paymentDiscountAmount + shippingCost;

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

  const handleBairroSelect = (e) => {
    setFormData(prev => ({ ...prev, bairro: e.target.value }));
  };

  const handlePostalCodeLookup = async () => {
    const cleanZip = formData.codigoPostal.trim().toUpperCase();
    if (!cleanZip) {
      showAlert(t('checkout_postal_code'), t('checkout_zip_alert_empty'), 'error');
      return;
    }

    const isValidZip = /^(?:[A-HJ-NP-Z]?\d{4}[A-Z]{3}|\d{4})$/i.test(cleanZip);
    if (!isValidZip) {
      showAlert(t('checkout_card_invalid_title'), t('checkout_zip_alert_invalid'), 'error');
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

    const cabaEntry = CABA_BARRIO_TABLE[numInt];
    if (cabaEntry) {
      const isMulti = Array.isArray(cabaEntry);
      const autoBarrio = isMulti ? cabaEntry[0] : cabaEntry;

      setFormData(prev => ({
        ...prev,
        codigoPostal: numericCode,
        bairro: autoBarrio,
        cidade: 'Ciudad Autónoma de Buenos Aires',
        provincia: 'Ciudad Autónoma de Buenos Aires'
      }));

      if (isMulti) {
        setAvailableBarrios(cabaEntry);
        setIsMultipleZone(true);
      }
      setIsCalculatingShipping(false);
      return;
    }

    try {
      const zipRes = await fetch(`https://api.zippopotam.us/ar/${numericCode}`);
      if (zipRes.ok) {
        const zipData = await zipRes.json();
        const place = zipData.places?.[0];
        if (place) {
          const rawState = place.state || '';
          const resolvedState = normalizeProvince(rawState);
          setFormData(prev => ({
            ...prev,
            codigoPostal: numericCode,
            bairro: place['place name'] || '',
            cidade: place['place name'] || '',
            provincia: resolvedState
          }));
          setIsCalculatingShipping(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[Zippopotam] Falhou, usando fallback Nominatim:', err.message);
    }

    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${numericCode}&countrycodes=AR&format=json&addressdetails=1&limit=1`,
        { headers: { 'User-Agent': 'RaicesHeritageMate/1.0 (raicesoficial.online)' } }
      );
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData[0]?.address;
        if (addr) {
          const rawState = addr.state || '';
          const resolvedState = normalizeProvince(rawState);
          setFormData(prev => ({
            ...prev,
            codigoPostal: numericCode,
            bairro: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
            cidade: addr.city || addr.town || addr.municipality || '',
            provincia: resolvedState
          }));
        }
      }
    } catch (err) {
      console.error('[Nominatim Fallback] Falhou:', err.message);
    }

    setIsCalculatingShipping(false);
  };

  // ─── AUTOCOMPLETE DO CÓDIGO POSTAL ────────────────────────────────────────────
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
  }, []);

  const handleCpSuggestionSelect = useCallback((sug) => {
    const cpClean = sug.postcode.replace(/[^\d]/g, '').slice(0, 4);
    const numCp   = parseInt(cpClean, 10);

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
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('[data-cp-autocomplete]')) setShowCpDropdown(false);
      if (!e.target.closest('[data-address-autocomplete]')) setShowAddressDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ─── AUTOCOMPLETE POR RUA ───────────────────────────────────────────────────
  useEffect(() => {
    const { rua, numero } = formData;

    if (selectedFromSuggestionsRef.current) {
      selectedFromSuggestionsRef.current = false;
      return;
    }

    if (rua.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(async () => {
      setIsLoadingAddress(true);
      try {
        const queryText = numero.trim() ? `${rua.trim()} ${numero.trim()}` : rua.trim();
        const query = encodeURIComponent(`${queryText}, Argentina`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=8`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'RaicesHeritageMate/1.0 (raicesoficial.online)' },
          signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) throw new Error('err');
        const data = await res.json();

        const sugs = data.reduce((acc, item) => {
          const addr = item.address || {};
          
          let road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || '';
          if (!road && (item.class === 'highway' || item.type === 'residential')) {
            road = item.name || '';
          }
          if (!road) {
            road = addr.town || addr.village || addr.hamlet || item.name || '';
          }

          const house_number = addr.house_number || numero.trim() || '';
          const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
          const city = addr.city || addr.town || addr.municipality || addr.county || '';
          const province = addr.state || '';
          const postcode = addr.postcode || '';

          if (!road) return acc;

          const streetStr = house_number ? `${road} ${house_number}` : road;
          const locationParts = [];
          if (suburb) locationParts.push(suburb);
          if (city && city !== road) locationParts.push(city);
          if (province) locationParts.push(province);
          
          const display = `${streetStr}, ${locationParts.join(', ')}${postcode ? ` · CP ${postcode}` : ''}`;

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

        const uniqueSugs = [];
        const seen = new Set();
        for (const sug of sugs) {
          if (!seen.has(sug.display)) {
            seen.add(sug.display);
            uniqueSugs.push(sug);
          }
        }

        setAddressSuggestions(uniqueSugs);
        setShowAddressDropdown(uniqueSugs.length > 0);
      } catch (err) {
        console.warn('[Address Autocomplete] Falhou:', err.message);
      } finally {
        setIsLoadingAddress(false);
      }
    }, 800);

    return () => clearTimeout(addressDebounceRef.current);
  }, [formData.rua, formData.numero]);

  const handleAddressSuggestionSelect = useCallback((sug) => {
    selectedFromSuggestionsRef.current = true;
    const cpClean = sug.postcode ? sug.postcode.replace(/[^\d]/g, '').slice(0, 4) : '';
    const numOp = cpClean ? parseInt(cpClean, 10) : NaN;

    const cabaEntry  = !isNaN(numOp) ? CABA_BARRIO_TABLE[numOp] : undefined;
    const isMulti    = Array.isArray(cabaEntry);
    const autoBarrio = isMulti
      ? cabaEntry[0]
      : (typeof cabaEntry === 'string' ? cabaEntry : sug.suburb || sug.city || '');

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

    if (cpClean.length >= 4) {
      setZipSearched(true);
    } else {
      setZipSearched(false);
    }

    setAddressSuggestions([]);
    setShowAddressDropdown(false);

    setTimeout(() => {
      const numInput = document.querySelector('input[name="numero"]');
      if (numInput && !sug.house_number) {
        numInput.focus();
      }
    }, 50);
  }, []);

  // ─── useEffect REATIVO: Calcula frete quando endereço está completo ───────────────
  useEffect(() => {
    const { codigoPostal, rua, numero, bairro, cidade, provincia } = formData;
    const isAddressComplete =
      codigoPostal.trim().length >= 4 &&
      rua.trim().length >= 2 &&
      numero.trim().length >= 1 &&
      bairro.trim().length >= 2;

    if (!isAddressComplete || !zipSearched) return;

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
          }
        }
      } catch (err) {
        console.warn('[Frete] Backend indisponível:', err.message);
      }

      if (finalRates.length === 0) finalRates = FALLBACK_RATES;
      setShippingOptions(finalRates);
      setSelectedShipping(finalRates[0]);
      setIsCalculatingShipping(false);
    };

    const timer = setTimeout(fetchShippingRates, 800);
    return () => clearTimeout(timer);
  }, [formData.rua, formData.numero, formData.bairro, formData.codigoPostal, zipSearched]);

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
        setCouponError(data.message || t('checkout_coupon_error'));
        showAlert('Error', data.message || t('checkout_coupon_error'), 'error');
      }
    } catch (err) {
      console.warn('Erro ao conectar ao backend para cupom, validando localmente:', err);
      const normalized = couponInput.trim().toUpperCase();
      if (normalized === 'RAICES5') {
        if (appliedCoupon && appliedCoupon.code === 'RAICES5') {
          showAlert(t('alert_title_warning'), t('checkout_coupon_invalid'), 'warning');
          return;
        }
        setAppliedCoupon({ code: 'RAICES5', rate: 0.05 });
        setCouponError('');
        showAlert(t('checkout_coupon_applied'), t('checkout_coupon_applied_msg'), 'success');
      } else {
        setAppliedCoupon(null);
        setCouponError(t('checkout_coupon_error'));
        showAlert('Error', t('checkout_coupon_error'), 'error');
      }
    }
  };

  const handleApplyMethod = (method) => {
    setPaymentMethod(method);
    setCardToken('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!isDeliverySectionValid) {
      showAlert(t('checkout_validation_title'), t('checkout_validation_error'), 'error');
      return;
    }

    setIsSubmitting(true);
    const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (paymentMethod === 'transfer' || paymentMethod === 'qr') {
      const orderItems = cart.map(item => `${item.quantity}x ${t(item.name)}`).join('%0A');
      const methodLabel = paymentMethod === 'transfer' ? 'Transferencia (10% OFF)' : 'Mercado Pago QR (10% OFF)';
      const couponLine = appliedCoupon ? `%0A*Cupón:* ${appliedCoupon.code} (-5% OFF)` : '';
      const waMessage = `*NUEVO PEDIDO - RAÍCES*%0A%0A*Cliente:* ${formData.nome}%0A*Email:* ${formData.email}%0A*WhatsApp:* ${formData.telefone}%0A*Dirección:* ${formData.rua} ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''} - Barrio: ${formData.bairro}, ${formData.cidade} - ${formData.provincia} (${formData.codigoPostal})%0A%0A*Items:*%0A${orderItems}%0A%0A*Envío:* ${selectedShipping.name} (${formatPrice(selectedShipping.price)})%0A*Descuento ${methodLabel}:* -${formatPrice(paymentDiscountAmount)}${couponLine}%0A*Total Final:* ${formatPrice(totalFinal)}%0A%0A_Aguardando comprobante de pago para el Alias: RAICES.MATE_`;

      try {
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
          console.warn('[Checkout WA] Backend retornou erro:', draftData.message);
        }
      } catch (err) {
        console.warn('[Checkout WA] Backend indisponível ao criar rascunho:', err.message);
      }

      window.open(`https://wa.me/5491176419463?text=${waMessage}`, '_blank');
      setIsSubmitting(false);
      triggerPurchaseEvent();
      setSuccessOrder(true);
      setTimeout(() => { clearCart(); navigate('/'); }, 4500);
      return;
    }

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const { number, holder, expiry, cvv } = cardData;
      const cleanNumber = number.replace(/\s+/g, '');
      const methodLabel = paymentMethod === 'credit_card' ? 'Tarjeta de Crédito (5% OFF)' : 'Tarjeta de Débito (10% OFF)';

      if (!cleanNumber || cleanNumber.length < 15) {
        showAlert(t('checkout_card_invalid_title'), t('checkout_card_invalid_desc'), 'error');
        setIsSubmitting(false);
        return;
      }
      if (!holder || holder.trim().length < 2) {
        showAlert(t('checkout_card_holder_title'), t('checkout_card_holder_desc'), 'error');
        setIsSubmitting(false);
        return;
      }
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        showAlert(t('checkout_card_expiry_title'), t('checkout_card_expiry_desc'), 'error');
        setIsSubmitting(false);
        return;
      }
      if (!cvv || cvv.length < 3) {
        showAlert(t('checkout_card_cvv_title'), t('checkout_card_cvv_desc'), 'error');
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
            card: {
              number:    cleanNumber,
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
          setIsSubmitting(false);
          triggerPurchaseEvent(data.transaction_id || null);
          setSuccessOrder(true);
          setTimeout(() => {
            clearCart();
            navigate('/');
          }, 4500);
        } else {
          setIsSubmitting(false);
          const reason = data.message || data.error || t('checkout_payment_not_approved_desc');
          showAlert(t('checkout_payment_not_approved'), reason, 'error');
        }
      } catch (err) {
        console.warn('[Checkout] Backend indisponível para cartão:', err.message);
        setIsSubmitting(false);
        const orderItems = cart.map(item => `${item.quantity}x ${t(item.name)}`).join('%0A');
        const maskedCard = `**** **** **** ${cleanNumber.slice(-4)}`;
        const couponLine = appliedCoupon ? `%0A*Cupón:* ${appliedCoupon.code} (-${(appliedCoupon.rate * 100).toFixed(0)}% OFF)` : '';
        const message = `*PEDIDO CON TARJETA - RAÍCES*%0A%0A*Cliente:* ${formData.nome}%0A*Email:* ${formData.email}%0A*Dirección:* ${formData.rua} ${formData.numero}, ${formData.bairro}, ${formData.cidade} (${formData.codigoPostal})%0A%0A*Items:*%0A${orderItems}%0A%0A*Envío:* ${selectedShipping.name} (${formatPrice(selectedShipping.price)})%0A*Método:* ${methodLabel}%0A*Tarjeta:* ${maskedCard} - Titular: ${holder}${couponLine}%0A*Total Final:* ${formatPrice(totalFinal)}%0A%0A⚠️ _El sistema de pago online no está disponible en este momento. Por favor, envíe los datos para procesar manualmente._`;
        if (window.confirm(t('checkout_offline_payment_confirm'))) {
          window.open(`https://wa.me/5491176419463?text=${message}`, '_blank');
          triggerPurchaseEvent();
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
      <h1 className="checkout-page-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--color-primary-green)' }}>
        {t('checkout_title') || 'Finalizar Compra'}
      </h1>
      {successOrder && (
        <div className="success-screen-overlay">
          <div className="success-icon-badge">✓</div>
          <h2>{t('checkout_success_title')}</h2>
          <p style={{ maxWidth: '400px', fontSize: '1.05rem', color: '#666', marginTop: '1rem' }}>
            {t('checkout_success_message')}
          </p>
          <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem', width: '100%', maxWidth: '350px' }}>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              <strong>{t('checkout_order_code')}:</strong> {`TX-${Date.now().toString().slice(-6)}`}
            </p>
          </div>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate('/')}>
        {t('checkout_back')}
      </button>

      <div className="checkout-grid">
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
              <div className="form-group" style={{ position: 'relative' }} data-cp-autocomplete>
                <label>
                  {t('checkout_postal_code')} *
                  {isLoadingCp && (
                    <span style={{ fontSize: '0.72rem', color: '#4A7C59', fontWeight: 400, marginLeft: '0.5rem' }}>
                      🔍 buscando...
                    </span>
                  )}
                </label>
                <div className="postal-search-wrapper">
                  <input
                    type="text"
                    name="codigoPostal"
                    placeholder={t('checkout_postal_code_placeholder')}
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
                {showCpDropdown && cpSuggestions?.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #E8C99A', borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.13)', zIndex: 999, margin: 0,
                    padding: '0.25rem 0', listStyle: 'none', maxHeight: '220px', overflowY: 'auto'
                  }}>
                    {cpSuggestions.map((sug, idx) => {
                      if (!sug) return null;
                      return (
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
                            {sug.suburb ? `${sug.suburb} — ${sug.city || ''}` : (sug.city || '')}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#8B6B4A' }}>
                            {sug.province || ''}{sug.postcode ? ` · CP ${sug.postcode.replace(/[^\d]/g, '').slice(0, 4)}` : ''}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>{t('checkout_city')} *</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} required />
              </div>
            </div>

            {isMultipleZone && (
              <div style={{
                background: '#FFF8F0', border: '1px solid #E8C99A', borderRadius: '8px',
                padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#7A5230',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <span>
                  <strong>{t('checkout_district_hint_title')}</strong> {t('checkout_district_hint_desc')}
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
              <div className="form-group" style={{ position: 'relative' }} data-address-autocomplete>
                <label>
                  {t('checkout_street')} *
                  {isLoadingAddress && (
                    <span style={{ fontSize: '0.72rem', color: '#4A7C59', fontWeight: 400, marginLeft: '0.5rem' }}>
                      🔍...
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
                {showAddressDropdown && addressSuggestions?.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #E8C99A', borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.13)', zIndex: 999, margin: 0,
                    padding: '0.25rem 0', listStyle: 'none', maxHeight: '220px', overflowY: 'auto'
                  }}>
                    {addressSuggestions.map((sug, idx) => {
                      if (!sug) return null;
                      return (
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
                            {sug.road || ''}{sug.house_number ? ` ${sug.house_number}` : ''}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#8B6B4A' }}>
                            {sug.suburb ? `${sug.suburb}, ` : ''}{sug.city || ''} · {sug.province || ''}{sug.postcode ? ` · CP ${sug.postcode}` : ''}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>
                  {t('checkout_number')} *
                  <span style={{ fontSize: '0.72rem', color: '#4A7C59', fontWeight: 400, marginLeft: '0.4rem' }}>
                    {t('checkout_number_help')}
                  </span>
                </label>
                <input type="text" name="numero" placeholder="Ej: 31" value={formData.numero} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('checkout_complement')}</label>
                <input type="text" name="complemento" placeholder="Ej: Piso 3B" value={formData.complemento} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>
                  {t('checkout_district')} *
                  {isMultipleZone && (
                    <span style={{ fontSize: '0.72rem', color: '#8B5E3C', fontWeight: 400, marginLeft: '0.4rem' }}>
                      {t('checkout_district_help')}
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

            {paymentMethod === 'transfer' && (
              <div className="bank-info-box">
                <h4 style={{ color: 'var(--color-accent-green)', marginBottom: '0.5rem' }}>{t('checkout_payment_transfer_title')}</h4>
                <p><strong>Alias:</strong> RAICES.MATE</p>
                <p><strong>CBU:</strong> 0070000000000000000000</p>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                  {t('checkout_payment_transfer_desc')}
                </p>
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div className="bank-info-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.8rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--color-accent-green)' }}>{t('checkout_payment_qr_title')}</strong>
                <p style={{ fontSize: '0.82rem', color: '#555' }}>
                  {t('checkout_payment_qr_desc')}
                </p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=1e3f20&data=${encodeURIComponent(`https://raicesoficial.online/checkout/pay?amount=${totalFinal}`)}`}
                  alt="Código QR de Pago"
                  style={{ border: '2px solid var(--color-accent-green)', padding: '0.8rem', borderRadius: '12px', backgroundColor: '#fcfcfc', width: '280px', height: '280px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                />
              </div>
            )}

            {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
              <div className="card-form-wrapper">
                <h4 style={{ color: 'var(--color-accent-green)', marginBottom: '1rem' }}>
                  {t('checkout_payment_card_title')}
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
                  <span>🛡️</span> {t('checkout_payment_card_security')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="checkout-summary">
          <h2>{t('checkout_sec_summary')}</h2>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id} className="summary-item">
                <img src={item.image} alt={t(item.name)} />
                <div className="summary-item-info">
                  <h4>{t(item.name)}</h4>
                  <p>{t('quantity_short')} {item.quantity}</p>
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
                  placeholder="Ej: RAICES5"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem' }}
                />
                <button type="button" onClick={handleApplyCoupon} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  {t('checkout_coupon_btn')}
                </button>
              </div>
              {couponError && <span style={{ color: '#d9534f', fontSize: '0.78rem' }}>{couponError}</span>}
            </div>

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
              ? t('checkout_processing') 
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
