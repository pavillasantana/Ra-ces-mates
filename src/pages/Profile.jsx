import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, user, updateUser, changePassword } = useAuthStore();

  const [formName, setFormName] = useState(user?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');
  const [formDocType, setFormDocType] = useState(user?.docType || 'DNI');
  const [formDocNumber, setFormDocNumber] = useState(user?.docNumber || '');
  const [marketingOptIn, setMarketingOptIn] = useState(Boolean(user?.marketingOptIn));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSalvar = () => {
    updateUser({
      name: formName,
      email: formEmail,
      phone: formPhone,
      docType: formDocType,
      docNumber: formDocNumber,
      marketingOptIn
    });

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword || newPassword.length < 6) {
        alert('Para trocar senha, preencha senha atual e nova senha (mínimo 6 caracteres).');
        return;
      }
      const result = changePassword({ currentPassword, newPassword });
      if (!result.ok) {
        alert(result.message);
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
    }

    alert('Alterações salvas!');
  };
  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar de Conta */}
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem' }}>Olá, {user?.name?.split(' ')[0] || 'Cliente'}.</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to="/perfil/pedidos">Meus Pedidos</Link></li>
          <li><Link to="/perfil/enderecos">Endereços</Link></li>
          <li><Link to="/perfil/pagamentos">Pagamentos</Link></li>
          <li><Link to="/perfil/favoritos">Favoritos</Link></li>
          <li><Link to="/perfil" style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>Dados Pessoais</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sair da Conta
            </button>
          </li>
        </ul>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h2 style={{ marginBottom: '2rem' }}>Configurações de Perfil</h2>
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', maxWidth: '700px' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>Nome Completo</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600' }}>Tipo de Doc.</label>
                <select value={formDocType} onChange={(e) => setFormDocType(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', height: '45px' }}>
                  <option value="DNI">DNI</option>
                  <option value="Estrangeiro">Estrangeiro</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600' }}>Número do Documento</label>
                <input type="text" value={formDocNumber} onChange={(e) => setFormDocNumber(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>E-mail</label>
              <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>Telefone / WhatsApp</label>
              <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input id="marketingOptIn" type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} />
              <label htmlFor="marketingOptIn">Quero receber promoções e novidades por e-mail</label>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <strong>Trocar senha</strong>
              <input type="password" placeholder="Senha atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <button className="btn" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} type="button" onClick={handleSalvar}>Salvar Alterações</button>
          </form>
        </div>
      </div>
    </div>
  );
}
