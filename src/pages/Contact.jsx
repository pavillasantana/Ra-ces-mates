export default function Contact() {
  return (
    <div style={{ padding: '5rem 5%', minHeight: '80vh', backgroundColor: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-accent-green)' }}>Fale Conosco</h2>
      <p style={{ marginBottom: '3rem', color: '#666', textAlign: 'center', maxWidth: '600px' }}>Tem alguma dúvida sobre nossas coleções ou sobre o processo de cura do mate? Entre em contato e nossa equipe terá o prazer em ajudar.</p>
      
      <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)', width: '100%', maxWidth: '600px' }}>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Nome</label>
            <input type="text" required style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>E-mail</label>
            <input type="email" required style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Mensagem</label>
            <textarea rows="5" required style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}></textarea>
          </div>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Enviar Mensagem</button>
        </form>
      </div>
    </div>
  );
}
