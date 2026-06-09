import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useModal } from '../components/ModalProvider';
import { useTranslation } from '../hooks/useTranslation';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const { showAlert } = useModal();
  const { t, lang } = useTranslation();
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    docType: 'DNI',
    docNumber: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const success = await register(formData);
    
    if (success) {
      const alertTitle = lang === 'pt' ? 'Sucesso!' : '¡Éxito!';
      const alertMsg = lang === 'pt' ? 'Conta criada com sucesso! Faça login.' : '¡Cuenta creada con éxito! Iniciá sesión.';
      showAlert(alertTitle, alertMsg, 'success');
      navigate(lang === 'pt' ? '/pt/login' : '/login');
    }
  };

  const title = lang === 'pt' ? 'Criar Conta' : 'Crear Cuenta';
  const labelName = lang === 'pt' ? 'Nome Completo' : 'Nombre Completo';
  const labelDocType = lang === 'pt' ? 'Tipo Doc.' : 'Tipo Doc.';
  const labelDocNumber = lang === 'pt' ? 'Nº Documento' : 'Nº Documento';
  const placeholderDoc = lang === 'pt' ? 'Ex: 40123456' : 'Ej: 40123456';
  const labelPhone = lang === 'pt' ? 'Telefone / WhatsApp' : 'Teléfono / WhatsApp';
  const labelPassword = lang === 'pt' ? 'Senha' : 'Contraseña';
  const buttonText = loading 
    ? (lang === 'pt' ? 'Registrando...' : 'Registrando...')
    : (lang === 'pt' ? 'Registrar-se' : 'Registrarse');
  const footerText = lang === 'pt' ? 'Já tem uma conta?' : '¿Ya tenés una cuenta?';
  const footerLinkText = lang === 'pt' ? 'Iniciar Sessão' : 'Iniciar Sesión';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', fontFamily: "'Playfair Display', serif", color: 'var(--color-primary-green)' }}>{title}</h1>
        
        {error && <div style={{ backgroundColor: '#fdecea', color: '#d9534f', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelName}</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{labelDocType}</label>
              <select name="docType" value={formData.docType} onChange={handleChange} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', height: '45px' }}>
                <option value="DNI">DNI</option>
                <option value="Estrangeiro">{lang === 'pt' ? 'Estrangeiro' : 'Extranjero'}</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{labelDocNumber}</label>
              <input type="text" name="docNumber" required placeholder={placeholderDoc} value={formData.docNumber} onChange={handleChange} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>E-mail</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelPhone}</label>
            <input type="tel" name="phone" required placeholder="+54 9 11 ..." value={formData.phone} onChange={handleChange} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelPassword}</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
            {buttonText}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {footerText} <Link to={lang === 'pt' ? '/pt/login' : '/login'} style={{ color: 'var(--color-accent-green)', fontWeight: 'bold' }}>{footerLinkText}</Link>
        </p>
      </div>
    </div>
  );
}
