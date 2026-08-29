import nodemailer from 'nodemailer';

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';

    if (user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass
        }
      });
    }

    // If no credentials are provided, generate an Ethereal test account for dev
    console.log('[EmailService] Nenhuma credencial SMTP fornecida. Criando conta de teste Ethereal...');
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[EmailService] Conta de teste criada: ${testAccount.user}`);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  })();

  return transporterPromise;
}

/**
 * Envia e-mail com código de verificação de 4 dígitos
 * @param {string} to - Destinatário
 * @param {string} code - Código de 4 dígitos
 * @param {string} userName - Nome do usuário (opcional)
 */
export async function sendVerificationCodeEmail(to, code, userName = '') {
  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || '"AccessTrip" <no-reply@accesstrip.com>';

  const subject = `Seu código de verificação AccessTrip: ${code}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2b6cb0; text-align: center;">AccessTrip</h2>
      <p>Olá, <strong>${userName || 'Viajante / Parceiro'}</strong>!</p>
      <p>Obrigado por se cadastrar na <strong>AccessTrip</strong>, a plataforma de turismo acessível.</p>
      <p>Utilize o código de 4 dígitos abaixo para verificar seu endereço de e-mail e liberar seu acesso:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2b6cb0; background: #ebf8ff; padding: 12px 24px; border-radius: 6px; border: 1px dashed #3182ce;">
          ${code}
        </span>
      </div>
      <p style="color: #4a5568; font-size: 14px;">
        Este código é válido por <strong>24 horas</strong>.
      </p>
      <p style="color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Se você não solicitou este cadastro, desconsidere este e-mail.
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: `Seu código de verificação AccessTrip é: ${code}. Válido por 24 horas.`,
    html
  });

  console.log(`[EmailService] E-mail enviado para: ${to} (MessageId: ${info.messageId})`);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[EmailService] 🔗 Prévia do e-mail (Ethereal): ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || null
  };
}
