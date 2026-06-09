import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'contacto@raicesmate.com';

export default function Contact() {
  const { t, lang } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contacto web - ${name}`);
    const body = encodeURIComponent(`Nombre: ${name}\nE-mail: ${email}\n\nMensaje:\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const title = lang === 'pt' ? 'Contato' : 'Contactanos';
  const subtitle = lang === 'pt' 
    ? 'Tem alguma dúvida sobre nossas coleções ou sobre o processo de curar a cuia? Entre em contato e nossa equipe terá o prazer de ajudar.'
    : '¿Tenés alguna duda sobre nuestras colecciones o sobre el proceso de curado del mate? Contactanos y nuestro equipo tendrá el placer de ayudarte.';
  
  const labelName = lang === 'pt' ? 'Nome Completo' : 'Nombre Completo';
  const labelEmail = 'E-mail';
  const labelMessage = lang === 'pt' ? 'Mensagem' : 'Mensaje';
  const submitText = lang === 'pt' ? 'Enviar Mensagem' : 'Enviar Mensaje';

  return (
    <div style={{ padding: '5rem 5%', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-accent-green)', fontFamily: "'Playfair Display', serif" }}>{title}</h1>
      <p style={{ marginBottom: '3rem', color: '#666', textAlign: 'center', maxWidth: '600px' }}>{subtitle}</p>
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelName}</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelEmail}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>{labelMessage}</label>
            <textarea rows="5" required value={message} onChange={(e) => setMessage(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>{submitText}</button>
        </form>
      </div>
    </div>
  );
}
