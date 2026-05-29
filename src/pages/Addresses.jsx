import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';

const PROVINCES = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán"
];

const getZipByProvince = (provName) => {
  const mapping = {
    "Ciudad Autónoma de Buenos Aires": "1000",
    "Buenos Aires": "1900",
    "Catamarca": "4700",
    "Chaco": "3500",
    "Chubut": "9100",
    "Córdoba": "5000",
    "Corrientes": "3400",
    "Entre Ríos": "3100",
    "Formosa": "3600",
    "Jujuy": "4600",
    "La Pampa": "6300",
    "La Rioja": "5300",
    "Mendoza": "5500",
    "Misiones": "3300",
    "Neuquén": "8300",
    "Río Negro": "8400",
    "Salta": "4400",
    "San Juan": "5400",
    "San Luis": "5700",
    "Santa Cruz": "9400",
    "Santa Fe": "3000",
    "Santiago del Estero": "4200",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur": "9410",
    "Tucumán": "4000"
  };
  return mapping[provName] || "1000";
};

export default function Addresses() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [addresses, setAddresses] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('raices-addresses') || '[]');
    if (saved.length === 0) {
      return [{
        id: 1,
        nickname: 'Casa',
        street: 'Av. Corrientes',
        number: '1234',
        floor: 'Piso 5A',
        zip: '1043',
        city: 'CABA',
        province: 'Ciudad Autónoma de Buenos Aires'
      }];
    }
    return saved;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  const [newAddrData, setNewAddrData] = useState({
    nickname: '',
    street: '',
    number: '',
    floor: '',
    zip: '',
    city: '',
    province: 'Ciudad Autónoma de Buenos Aires'
  });

  useEffect(() => {
    localStorage.setItem('raices-addresses', JSON.stringify(addresses));
  }, [addresses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddrData(prev => ({ ...prev, [name]: value }));

    // Se o usuário digitar um CEP completo (4 dígitos), realiza a busca instantânea de Cidade e Província sem sobrescrever a rua
    if (name === 'zip' && value.length === 4) {
      triggerPostalCodeLookup(value);
    }
  };

  // Preenchimento instantâneo inteligente baseado no CEP digitado (Apenas Cidade e Província)
  const triggerPostalCodeLookup = (cpValue) => {
    const clean = cpValue.trim().toUpperCase();
    let code = clean;
    const cpaMatch = clean.match(/^[A-Z](\d{4})[A-Z]{3}$/);
    if (cpaMatch) {
      code = cpaMatch[1];
    } else {
      const numericMatch = clean.match(/^\d{4}$/);
      if (numericMatch) code = numericMatch[0];
    }

    const num = parseInt(code, 10);
    if (!isNaN(num)) {
      let city = '';
      let province = 'Ciudad Autónoma de Buenos Aires';

      if (num >= 1000 && num <= 1499) {
        city = 'CABA';
        province = 'Ciudad Autónoma de Buenos Aires';
      } else if (num >= 1500 && num <= 1899) {
        city = 'Avellaneda';
        province = 'Buenos Aires';
      } else if (num >= 1900 && num <= 2999) {
        city = 'La Plata';
        province = 'Buenos Aires';
      } else if (num >= 3000 && num <= 3299) {
        city = 'Santa Fe';
        province = 'Santa Fe';
      } else if (num >= 3300 && num <= 3399) {
        city = 'Puerto Iguazú';
        province = 'Misiones';
      } else if (num >= 3400 && num <= 3499) {
        city = 'Corrientes';
        province = 'Corrientes';
      } else if (num >= 3500 && num <= 3599) {
        city = 'Resistencia';
        province = 'Chaco';
      } else if (num >= 3600 && num <= 3699) {
        city = 'Formosa';
        province = 'Formosa';
      } else if (num >= 4000 && num <= 4199) {
        city = 'San Miguel de Tucumán';
        province = 'Tucumán';
      } else if (num >= 4200 && num <= 4399) {
        city = 'Santiago del Estero';
        province = 'Santiago del Estero';
      } else if (num >= 4400 && num <= 4599) {
        city = 'Salta';
        province = 'Salta';
      } else if (num >= 4600 && num <= 4699) {
        city = 'San Salvador de Jujuy';
        province = 'Jujuy';
      } else if (num >= 4700 && num <= 4799) {
        city = 'San Fernando del Valle de Catamarca';
        province = 'Catamarca';
      } else if (num >= 5000 && num <= 5299) {
        city = 'Córdoba';
        province = 'Córdoba';
      } else if (num >= 5300 && num <= 5399) {
        city = 'La Rioja';
        province = 'La Rioja';
      } else if (num >= 5400 && num <= 5499) {
        city = 'San Juan';
        province = 'San Juan';
      } else if (num >= 5500 && num <= 5699) {
        city = 'Mendoza';
        province = 'Mendoza';
      } else if (num >= 5700 && num <= 5799) {
        city = 'San Luis';
        province = 'San Luis';
      } else if (num >= 5800 && num <= 5899) {
        city = 'Río Cuarto';
        province = 'Córdoba';
      } else if (num >= 6000 && num <= 8199) {
        city = 'Bahía Blanca';
        province = 'Buenos Aires';
      } else if (num >= 8300 && num <= 8399) {
        city = 'Neuquén';
        province = 'Neuquén';
      } else if (num >= 8400 && num <= 8599) {
        city = 'San Carlos de Bariloche';
        province = 'Río Negro';
      } else if (num >= 9000 && num <= 9199) {
        city = 'Comodoro Rivadavia';
        province = 'Chubut';
      } else if (num >= 9200 && num <= 9409) {
        city = 'Río Gallegos';
        province = 'Santa Cruz';
      } else if (num >= 9410 && num <= 9499) {
        city = 'Ushuaia';
        province = 'Tierra del Fuego, Antártida e Islas del Atlántico Sur';
      }

      setNewAddrData(prev => ({
        ...prev,
        city: city || prev.city,
        province: province
      }));
    }
  };

  // Integração Georef: Normalização e auto-preenchimento ao digitar rua e número e sair do campo (onBlur)
  const handleAddressBlur = async () => {
    let streetVal = newAddrData.street.trim();
    let numberVal = newAddrData.number.trim();

    // Smart Address Parsing: Se o usuário digitar a rua contendo número (ex: "sarandi 31") e o campo número estiver vazio ou preenchido, extrai corretamente!
    const streetNumberMatch = streetVal.match(/(.+?)\s+(\d+)$/);
    if (streetNumberMatch) {
      const parsedStreet = streetNumberMatch[1].trim();
      const parsedNumber = streetNumberMatch[2].trim();
      
      const lowerStreet = parsedStreet.toLowerCase();
      const isNumberedStreet = lowerStreet.startsWith('calle') || lowerStreet.startsWith('ruta') || lowerStreet.startsWith('avenida ');
      
      if (!isNumberedStreet) {
        streetVal = parsedStreet;
        numberVal = parsedNumber;
        
        setNewAddrData(prev => ({
          ...prev,
          street: parsedStreet,
          number: parsedNumber
        }));
      }
    }

    if (!streetVal) return;

    try {
      const query = numberVal ? `${streetVal} ${numberVal}` : streetVal;
      const georefUrl = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(query)}&provincia=${encodeURIComponent(newAddrData.province)}`;
      const georefRes = await fetch(georefUrl);
      const georefData = await georefRes.json();
      
      if (georefData.direcciones && georefData.direcciones.length > 0) {
        const matched = georefData.direcciones[0];
        const normalStreet = matched.calle.nombre || streetVal;
        const city = matched.departamento?.nombre || matched.localidad_censal?.nombre || newAddrData.city || 'CABA';
        const province = matched.provincia.nombre || newAddrData.province;

        let zip = newAddrData.zip;
        if (!zip) {
          zip = getZipByProvince(province);
        }

        let matchedProvince = newAddrData.province;
        const matchedProv = PROVINCES.find(p => 
          p.toLowerCase().includes(province.toLowerCase()) || 
          province.toLowerCase().includes(p.toLowerCase())
        );
        if (matchedProv) matchedProvince = matchedProv;

        setNewAddrData(prev => ({
          ...prev,
          street: normalStreet,
          number: numberVal || matched.altura.valor || prev.number,
          city: city,
          province: matchedProvince,
          zip: zip || prev.zip
        }));
      } else {
        // Busca secundária apenas pela rua se o número não estiver cadastrado no banco do governo argentino
        const streetGeorefUrl = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(streetVal)}&provincia=${encodeURIComponent(newAddrData.province)}`;
        const streetGeorefRes = await fetch(streetGeorefUrl);
        const streetGeorefData = await streetGeorefRes.json();

        if (streetGeorefData.direcciones && streetGeorefData.direcciones.length > 0) {
          const matched = streetGeorefData.direcciones[0];
          const normalStreet = matched.calle.nombre || streetVal;
          const city = matched.departamento?.nombre || matched.localidad_censal?.nombre || newAddrData.city || 'CABA';
          const province = matched.provincia.nombre || newAddrData.province;

          let matchedProvince = newAddrData.province;
          const matchedProv = PROVINCES.find(p => 
            p.toLowerCase().includes(province.toLowerCase()) || 
            province.toLowerCase().includes(p.toLowerCase())
          );
          if (matchedProv) matchedProvince = matchedProv;

          setNewAddrData(prev => ({
            ...prev,
            street: normalStreet,
            city: city,
            province: matchedProvince
          }));
        }
      }
    } catch (err) {
      console.error('Erro no auto-preenchimento por endereço:', err);
    }
  };

  const handleAddAddrSubmit = async (e) => {
    e.preventDefault();
    if (!newAddrData.street || !newAddrData.number || !newAddrData.city || !newAddrData.province) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    setIsValidating(true);
    setErrorMsg('');

    try {
      const query = `${newAddrData.street} ${newAddrData.number}`;
      const url = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(query)}&provincia=${encodeURIComponent(newAddrData.province)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      let matched = null;
      if (data.direcciones && data.direcciones.length > 0) {
        matched = data.direcciones[0];
      } else {
        // Tolerância Geográfica: se a combinação exata de rua + número falhar, verifica se ao menos a rua existe na província para evitar bloqueios ao cliente
        const streetUrl = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(newAddrData.street)}&provincia=${encodeURIComponent(newAddrData.province)}`;
        const streetRes = await fetch(streetUrl);
        const streetData = await streetRes.json();

        if (streetData.direcciones && streetData.direcciones.length > 0) {
          matched = streetData.direcciones[0];
        }
      }

      if (!matched) {
        setErrorMsg('A rua informada não foi reconhecida ou não existe nesta província.');
        setIsValidating(false);
        return;
      }

      const newAddress = {
        id: Date.now(),
        nickname: newAddrData.nickname || 'Principal',
        street: matched.calle?.nombre || newAddrData.street,
        number: newAddrData.number,
        floor: newAddrData.floor || '',
        zip: newAddrData.zip || '',
        city: newAddrData.city,
        province: matched.provincia?.nombre || newAddrData.province
      };

      setAddresses([...addresses, newAddress]);
      setIsModalOpen(false);
      setNewAddrData({ nickname: '', street: '', number: '', floor: '', zip: '', city: '', province: 'Ciudad Autónoma de Buenos Aires' });
    } catch (err) {
      console.error('Erro na validação da API Georef:', err);
      const newAddress = {
        id: Date.now(),
        nickname: newAddrData.nickname || 'Principal',
        street: newAddrData.street,
        number: newAddrData.number,
        floor: newAddrData.floor || '',
        zip: newAddrData.zip || '',
        city: newAddrData.city,
        province: newAddrData.province
      };
      setAddresses([...addresses, newAddress]);
      setIsModalOpen(false);
      setNewAddrData({ nickname: '', street: '', number: '', floor: '', zip: '', city: '', province: 'Ciudad Autónoma de Buenos Aires' });
    } finally {
      setIsValidating(false);
    }
  };

  const removeAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar de Conta */}
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem' }}>Olá, {user?.name?.split(' ')[0] || 'Cliente'}.</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to="/perfil/pedidos">Meus Pedidos</Link></li>
          <li><Link to="/perfil/enderecos" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Endereços</Link></li>
          <li><Link to="/perfil/pagamentos">Pagamentos</Link></li>
          <li><Link to="/perfil/favoritos">Favoritos</Link></li>
          <li><Link to="/perfil">Dados Pessoais</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sair da Conta
            </button>
          </li>
        </ul>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Meus Endereços</h2>
          <button className="btn" onClick={() => { setErrorMsg(''); setIsModalOpen(true); }}>Adicionar Endereço</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {addresses.map((addr, index) => (
            <div key={addr.id} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', borderLeft: `4px solid ${index === 0 ? 'var(--color-accent-green)' : '#ccc'}`, position: 'relative' }}>
              <span className="badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>{addr.nickname}</span>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{addr.street} {addr.number} {addr.floor && `, ${addr.floor}`}</h4>
              <p style={{ color: '#555', marginBottom: '1rem' }}>{addr.city}, {addr.province} {addr.zip && `- ${addr.zip}`}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => removeAddress(addr.id)} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup de Adicionar Endereço Completo com Validação Georef */}
      {isModalOpen && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Novo Endereço de Entrega</h3>
            </div>
            
            {errorMsg && (
              <div style={{ backgroundColor: '#fdf2f2', border: '1px solid #f5baba', color: '#de3a3a', padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddAddrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Apelido do Endereço</label>
                <input 
                  type="text" 
                  name="nickname" 
                  placeholder="Ex: Minha Casa, Trabalho" 
                  value={newAddrData.nickname} 
                  onChange={handleInputChange} 
                  style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Rua / Avenida</label>
                  <input 
                    type="text" 
                    name="street" 
                    placeholder="Av. Corrientes" 
                    required 
                    value={newAddrData.street} 
                    onChange={handleInputChange} 
                    onBlur={handleAddressBlur}
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Número</label>
                  <input 
                    type="text" 
                    name="number" 
                    placeholder="1234" 
                    required 
                    value={newAddrData.number} 
                    onChange={handleInputChange} 
                    onBlur={handleAddressBlur}
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Piso / Depto (Opcional)</label>
                  <input 
                    type="text" 
                    name="floor" 
                    placeholder="Ex: 5A" 
                    value={newAddrData.floor} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Código Postal / CEP</label>
                  <input 
                    type="text" 
                    name="zip" 
                    placeholder="Ex: 1043" 
                    value={newAddrData.zip} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Cidade</label>
                  <input 
                    type="text" 
                    name="city" 
                    placeholder="CABA" 
                    required 
                    value={newAddrData.city} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Província / Estado</label>
                  <select 
                    name="province" 
                    value={newAddrData.province} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box', height: '43px', backgroundColor: '#fff' }}
                  >
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.8rem 1.5rem', border: '1px solid #ccc', borderRadius: '6px', background: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn" disabled={isValidating} style={{ padding: '0.8rem 1.5rem' }}>
                  {isValidating ? 'Validando...' : 'Salvar Endereço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
