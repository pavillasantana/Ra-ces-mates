import nodemailer from 'nodemailer';

// Helper de criação do Transporter de Email
async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Se existirem credenciais no .env, utiliza
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port == 465, // true para 465, false para outros
      auth: { user, pass }
    });
  }

  // Caso contrário, cria uma conta de teste Ethereal instantânea para desenvolvimento sem bloqueios
  console.log('✉️ SMTP não configurado. Gerando credenciais temporárias do Ethereal Mail...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.warn('⚠️ Falha ao criar conta Ethereal. Criando transporter simulado localmente.', error.message);
    return {
      sendMail: async (options) => {
        console.log('\n==================================================');
        console.log('🔮 [SIMULADOR DE EMAIL RAÍCES]');
        console.log(`Para: ${options.to}`);
        console.log(`Assunto: ${options.subject}`);
        console.log(`Mensagem: ${options.text}`);
        console.log('==================================================\n');
        return { messageId: 'simulated-id' };
      }
    };
  }
}

export async function send2FATokenEmail(email, userName, token) {
  try {
    const transporter = await createTransporter();
    
    // HTML Template premium combinando com a identidade visual da Raíces (terracotta, verde-floresta)
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0dfdb; border-radius: 8px; overflow: hidden; background-color: #fcfaf6;">
        <div style="background-color: #18281a; padding: 2rem; text-align: center;">
          <h1 style="color: #fcfaf6; margin: 0; font-size: 24px; letter-spacing: 4px; font-weight: 300;">RAÍCES</h1>
          <p style="color: #c9b195; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Heritage Artesanal</p>
        </div>
        <div style="padding: 2.5rem; color: #18281a; line-height: 1.6;">
          <h2 style="font-size: 20px; font-weight: 600; color: #18281a; margin-top: 0;">Olá, ${userName}!</h2>
          <p style="font-size: 15px; color: #4a4a4a;">
            Para garantir a segurança da sua conta, um código de verificação em duas etapas (2FA) foi gerado. Use o código abaixo para concluir sua autenticação:
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

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Raíces Heritage" <no-reply@raicesmates.com.ar>',
      to: email,
      subject: `${token} é o seu código de verificação Raíces`,
      text: `Olá ${userName}, o seu código de verificação Raíces de 6 dígitos é: ${token}. Ele expira em 5 minutos.`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Se for Ethereal, loga a URL de visualização do inbox temporário
    if (info.messageId && transporter.options?.host === 'smtp.ethereal.email') {
      import('nodemailer').then((nm) => {
        const previewUrl = nm.default.getTestMessageUrl(info);
        console.log('\n==================================================');
        console.log('✉️ [ETHEREAL MAIL OUTBOX]');
        console.log(`Para: ${email}`);
        console.log(`2FA Token: ${token}`);
        console.log(`Visualizar E-mail Real Completo: ${previewUrl}`);
        console.log('==================================================\n');
      });
    } else {
      console.log(`\n==================================================`);
      console.log(`🔔 [2FA SECURITY DISPATCH]`);
      console.log(`Destinatário: ${email}`);
      console.log(`Código de Verificação: ${token}`);
      console.log(`==================================================\n`);
    }

    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail de 2FA:', error);
    throw error;
  }
}
