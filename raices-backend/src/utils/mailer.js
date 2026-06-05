import { Resend } from 'resend';

// Inicializa o cliente Resend com a API Key do ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

export async function send2FATokenEmail(email, userName, token) {
  // Se não há API Key configurada, loga o código no console (modo de desenvolvimento)
  if (!process.env.RESEND_API_KEY) {
    console.log('\n==================================================');
    console.log('⚠️  RESEND_API_KEY não configurada. Modo simulado.');
    console.log(`📧 Destinatário: ${email}`);
    console.log(`🔑 Código 2FA: ${token}`);
    console.log('==================================================\n');
    return { id: 'simulated-id' };
  }

  // HTML template premium com identidade visual da Raíces
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0dfdb; border-radius: 8px; overflow: hidden; background-color: #fcfaf6;">
      <div style="background-color: #18281a; padding: 2rem; text-align: center;">
        <h1 style="color: #fcfaf6; margin: 0; font-size: 24px; letter-spacing: 4px; font-weight: 300;">RAÍCES</h1>
        <p style="color: #c9b195; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Heritage Artesanal</p>
      </div>
      <div style="padding: 2.5rem; color: #18281a; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #18281a; margin-top: 0;">Olá, ${userName}!</h2>
        <p style="font-size: 15px; color: #4a4a4a;">
          Para garantir a segurança da sua conta, use o código abaixo para concluir sua autenticação:
        </p>
        <div style="margin: 2rem 0; text-align: center;">
          <div style="display: inline-block; background-color: #fff; border: 2px dashed #18281a; padding: 1rem 3rem; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #9c6c50; border-radius: 6px;">
            ${token}
          </div>
          <p style="font-size: 12px; color: #888; margin-top: 0.5rem;">Válido por 5 minutos.</p>
        </div>
        <p style="font-size: 14px; color: #666;">
          Se você não realizou esta solicitação, recomendamos alterar sua senha imediatamente.
        </p>
      </div>
      <div style="background-color: #f4f1eb; padding: 1.5rem; text-align: center; border-top: 1px solid #e0dfdb; font-size: 11px; color: #666;">
        <p style="margin: 0;">Raíces Mates Premium • Buenos Aires, Argentina</p>
        <p style="margin: 5px 0 0 0;">Este é um e-mail automático. Por favor, não responda.</p>
      </div>
    </div>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM || 'Raíces Heritage <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `${token} é o seu código de verificação Raíces`,
      text: `Olá ${userName}, o seu código de verificação Raíces é: ${token}. Ele expira em 5 minutos.`,
      html: htmlContent,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log('\n==================================================');
    console.log('🔔 [2FA SECURITY DISPATCH via Resend]');
    console.log(`Destinatário: ${email}`);
    console.log(`Código de Verificação: ${token}`);
    console.log(`Email ID: ${data.id}`);
    console.log('==================================================\n');

    return data;
  } catch (error) {
    console.error('Erro ao enviar e-mail de 2FA:', error);
    throw error;
  }
}
