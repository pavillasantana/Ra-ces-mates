import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import { useModal } from '../components/ModalProvider';
import { useTranslation } from '../hooks/useTranslation';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, user, updateUser, changePassword } = useAuthStore();
  const { showAlert } = useModal();
  const { t, lang } = useTranslation();

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
    navigate(lang === 'pt' ? '/pt/login' : '/login');
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
        const title = lang === 'pt' ? 'Perfil' : 'Perfil';
        const msg = lang === 'pt' 
          ? 'Para alterar a senha, preencha a senha atual e a nova senha (mínimo de 6 caracteres).' 
          : 'Para cambiar la contraseña, completá la contraseña actual y la nueva contraseña (mínimo 6 caracteres).';
        showAlert(title, msg, 'warning');
        return;
      }
      const result = changePassword({ currentPassword, newPassword });
      if (!result.ok) {
        showAlert(lang === 'pt' ? 'Perfil' : 'Perfil', result.message, 'error');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
    }

    const successTitle = lang === 'pt' ? 'Perfil' : 'Perfil';
    const successMsg = lang === 'pt' ? 'Alterações salvas!' : '¡Cambios guardados!';
    showAlert(successTitle, successMsg, 'success');
  };

  const welcomeText = lang === 'pt' ? `Olá, ${user?.name?.split(' ')[0] || 'Cliente'}.` : `Hola, ${user?.name?.split(' ')[0] || 'Cliente'}.`;
  
  const optInText = lang === 'pt' ? 'Quero receber promoções e novidades por e-mail' : 'Quero receber promociones y novedades por e-mail';
  const labelDocType = lang === 'pt' ? 'Tipo de Doc.' : 'Tipo de Doc.';
  const labelDocNumber = lang === 'pt' ? 'Número de Documento' : 'Número de Documento';
  
  const changePasswordTitle = lang === 'pt' ? 'Alterar senha' : 'Cambiar contraseña';
  const saveBtnText = lang === 'pt' ? 'Salvar Alterações' : 'Guardar Cambios';

  const ordersLink = lang === 'pt' ? '/pt/perfil/pedidos' : '/perfil/pedidos';
  const addressesLink = lang === 'pt' ? '/pt/perfil/direcciones' : '/perfil/direcciones';
  const paymentsLink = lang === 'pt' ? '/pt/perfil/pagos' : '/perfil/pagos';
  const favoritesLink = lang === 'pt' ? '/pt/perfil/favoritos' : '/perfil/favoritos';
  const personalDataLink = lang === 'pt' ? '/pt/perfil' : '/perfil';

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar de Cuenta */}
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '2rem', borderRight: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '2rem', fontFamily: "'Playfair Display', serif" }}>{welcomeText}</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><Link to={ordersLink}>{lang === 'pt' ? 'Meus Pedidos' : 'Mis Pedidos'}</Link></li>
          <li><Link to={addressesLink}>{lang === 'pt' ? 'Endereços' : 'Direcciones'}</Link></li>
          <li><Link to={paymentsLink}>{lang === 'pt' ? 'Pagamentos' : 'Pagos'}</Link></li>
          <li><Link to={favoritesLink}>{lang === 'pt' ? 'Favoritos' : 'Favoritos'}</Link></li>
          <li><Link to={personalDataLink} style={{ fontWeight: 'bold', color: 'var(--color-accent-green)' }}>{lang === 'pt' ? 'Dados Pessoais' : 'Datos Personales'}</Link></li>
          <li style={{ marginTop: '2rem' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d9534f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {lang === 'pt' ? 'Sair' : 'Cerrar Sesión'}
            </button>
          </li>
        </ul>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '3rem 5%' }}>
        <h1 style={{ marginBottom: '2rem', fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--color-primary-green)' }}>
          {lang === 'pt' ? 'Configurações do Perfil' : 'Configuración de Perfil'}
        </h1>
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', maxWidth: '700px' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>{lang === 'pt' ? 'Nome Completo' : 'Nombre Completo'}</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600' }}>{labelDocType}</label>
                <select value={formDocType} onChange={(e) => setFormDocType(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', height: '45px' }}>
                  <option value="DNI">DNI</option>
                  <option value="Estrangeiro">{lang === 'pt' ? 'Estrangeiro' : 'Extranjero'}</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600' }}>{labelDocNumber}</label>
                <input type="text" value={formDocNumber} onChange={(e) => setFormDocNumber(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>E-mail</label>
              <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>{lang === 'pt' ? 'Telefone / WhatsApp' : 'Teléfono / WhatsApp'}</label>
              <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input id="marketingOptIn" type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} />
              <label htmlFor="marketingOptIn">{optInText}</label>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <strong>{changePasswordTitle}</strong>
              <input type="password" placeholder={lang === 'pt' ? 'Senha atual' : 'Contraseña actual'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="password" placeholder={lang === 'pt' ? 'Nova senha' : 'Nueva contraseña'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <button className="btn" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} type="button" onClick={handleSalvar}>{saveBtnText}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
