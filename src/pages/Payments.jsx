import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const detectBrand = (number) => {
  const clean = number.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (clean.startsWith('4')) return 'Visa';
  if (clean.startsWith('5')) return 'Mastercard';
  if (clean.startsWith('3')) return 'American Express';
  if (clean.startsWith('6')) return 'Discover';
  return 'Outra';
};

const formatCardNumber = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length > 0) {
    return parts.join(' ');
  } else {
    return v;
  }
};

const formatExpiry = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
  }
  return v;
};

export default function Payments() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [newCardData, setNewCardData] = useState({
    number: '',
    holder: '',
    exp: '',
    cvv: '',
    nickname: ''
  });

  const userKey = user?.id || user?.email || 'guest';

  useEffect(() => {
    const fetchCards = async () => {
      if (!userKey) return;
      try {
        setLoadingCards(true);
        const response = await fetch(`${API_BASE_URL}/api/payments/methods/${encodeURIComponent(userKey)}`);
        if (!response.ok) throw new Error('Falha ao carregar cartões');
        const data = await response.json();
        setCards(data.methods || []);
      } catch {
        setCards([]);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchCards();
  }, [userKey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'exp') {
      formattedValue = formatExpiry(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/[^0-9]/gi, '').slice(0, 4);
    }

    setNewCardData({ ...newCardData, [name]: formattedValue });
  };

  const handleAddCardSubmit = async (e) => {
    e.preventDefault();
    if (!newCardData.number || !newCardData.holder || !newCardData.exp || !newCardData.cvv) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    try {
      const tokenizeResponse = await fetch(`${API_BASE_URL}/api/payments/tokenize-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: newCardData.number,
          holder: newCardData.holder,
          exp: newCardData.exp,
          cvv: newCardData.cvv
        })
      });

      if (!tokenizeResponse.ok) throw new Error('Falha ao tokenizar cartão');
      const tokenized = await tokenizeResponse.json();

      const saveResponse = await fetch(`${API_BASE_URL}/api/payments/methods/${encodeURIComponent(userKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenized.token,
          brand: tokenized.brand,
          last4: tokenized.last4,
          holder: tokenized.holder,
          exp: tokenized.exp,
          nickname: newCardData.nickname || 'Principal'
        })
      });

      if (!saveResponse.ok) throw new Error('Falha ao salvar cartão tokenizado');
      const saved = await saveResponse.json();
      setCards(saved.methods || []);
      setIsModalOpen(false);
      setNewCardData({ number: '', holder: '', exp: '', cvv: '', nickname: '' });
    } catch {
      alert('Não foi possível salvar o cartão. Tente novamente.');
    }
  };

  const removeCard = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/methods/${encodeURIComponent(userKey)}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao remover cartão');
      const data = await response.json();
      setCards(data.methods || []);
    } catch {
      alert('Não foi possível remover o cartão.');
    }
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
          <li><Link to="/perfil/enderecos">Endereços</Link></li>
          <li><Link to="/perfil/pagamentos" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Pagamentos</Link></li>
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
          <h2>Métodos de Pagamento</h2>
          <button className="btn" onClick={() => setIsModalOpen(true)}>Adicionar Cartão</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {loadingCards ? <p>Carregando cartões...</p> : cards.length === 0 ? <p>Nenhum cartão adicionado.</p> : cards.map((card, index) => (
            <div key={card.id} style={{ backgroundColor: '#fff', padding: '1.8rem', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)', borderLeft: `5px solid ${index === 0 ? 'var(--color-accent-green)' : '#ccc'}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.2rem', color: '#333' }}>{card.brand}</strong>
                <span className="badge" style={{ backgroundColor: index === 0 ? 'var(--color-accent-green)' : '#999', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {card.nickname}
                </span>
              </div>
              <p style={{ color: '#444', fontSize: '1.1rem', marginBottom: '0.5rem', letterSpacing: '2px', fontFamily: 'monospace' }}>
                **** **** **** {card.last4}
              </p>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.3rem' }}><strong>Titular:</strong> {card.holder}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Validade: {card.exp}</span>
                <button onClick={() => removeCard(card.id)} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup de Adicionar Cartão com Auto Identificação de Bandeira */}
      {isModalOpen && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Novo Cartão de Crédito</h3>
            
            <form onSubmit={handleAddCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Número do Cartão</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    name="number" 
                    maxLength="19" 
                    placeholder="0000 0000 0000 0000" 
                    required 
                    value={newCardData.number} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '1px' }} 
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--color-accent-green)', fontSize: '0.85rem', backgroundColor: '#eefcf4', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {detectBrand(newCardData.number)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Nome do Titular (Como impresso no cartão)</label>
                <input 
                  type="text" 
                  name="holder" 
                  placeholder="MARCOS SILVA" 
                  required 
                  value={newCardData.holder} 
                  onChange={handleInputChange} 
                  style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Validade (MM/AA)</label>
                  <input 
                    type="text" 
                    name="exp" 
                    maxLength="5" 
                    placeholder="12/28" 
                    required 
                    value={newCardData.exp} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Cód. Identificação (CVV)</label>
                  <input 
                    type="text" 
                    name="cvv" 
                    maxLength="4" 
                    placeholder="123" 
                    required 
                    value={newCardData.cvv} 
                    onChange={handleInputChange} 
                    style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Apelido do Cartão (Opcional)</label>
                <input 
                  type="text" 
                  name="nickname" 
                  placeholder="Ex: Meu Cartão Principal" 
                  value={newCardData.nickname} 
                  onChange={handleInputChange} 
                  style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.8rem 1.5rem', border: '1px solid #ccc', borderRadius: '6px', background: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn" style={{ padding: '0.8rem 1.5rem' }}>Salvar Cartão</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
