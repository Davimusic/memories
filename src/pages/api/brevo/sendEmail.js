// se usa
import nodemailer from 'nodemailer';
import 'dotenv/config';

export async function sendEmail({ email, subject, message }) {
  // Validación de parámetros
  if (!email || !subject || !message) {
    console.error('Missing required email parameters:', { email, subject, message });
    return { success: false, error: 'Missing required parameters: email, subject, or message' };
  }

  // Obtención de credenciales SMTP
  const smtpUser = process.env.SMTP_BREVO_USER || '8b5cff001@smtp-brevo.com';
  const smtpPass = process.env.NEXT_PUBLIC_SMTP_BREVO;

  if (!smtpUser || !smtpPass) {
    console.error('SMTP credentials missing', {
      smtpUser: smtpUser ? '***set***' : 'undefined',
      smtpPass: smtpPass ? '***set***' : 'undefined',
    });
    return { success: false, error: 'SMTP credentials missing: SMTP_BREVO_USER or SMTP_BREVO not set' };
  }

  

  // Plantilla HTML con estilos del proyecto
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet">
  <style>
    @media (max-width: 576px) {
      .container { padding: 15px !important; }
      .title-md { font-size: 20px !important; }
      .content { font-size: 14px !important; }
      .logo-img { width: 60px !important; height: 60px !important; }
    }
  </style>
</head>
<body style="
  margin: 0;
  padding: 20px;
  background-color:rgb(255, 255, 255);
  font-family: 'Montserrat', Arial, sans-serif;
  color: white;
">
  <div class="container" style="
    max-width: 600px;
    margin: 0 auto;
    background: rgba(55, 65, 81, 0.95);
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  ">
    
    
    <div class="header" style="text-align: center; margin-bottom: 24px;">
      <h2 class="title-md" style="
        font-size: 24px;
        color: white;
        margin: 0;
        padding: 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      ">${subject}</h2>
    </div>
    
    <div class="content" style="
      font-size: 16px;
      color: white;
      line-height: 1.6;
      margin-bottom: 24px;
    ">${message}</div>
    
    <div class="footer" style="
      text-align: center;
      font-size: 14px;
      color: #9ca3af;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    ">
      <span style="color: #60a5fa; font-weight: bold;">GOOD MEMORIES</span>
      <p style="margin-top: 10px; font-size: 12px;">© ${new Date().getFullYear()} Todos los derechos reservados</p>
    </div>
  </div>
</body>
</html>
  `;

  // Configuración del transportador
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Envío del correo
    const info = await transporter.sendMail({
      from: 'Good Memories <davipianof@gmail.com>',
      to: email,
      subject: subject,
      text: message,
      html: htmlContent
    });

    console.log('Email sent:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}















































/*import nodemailer from 'nodemailer';
import 'dotenv/config';

export async function sendEmail({ email, subject, message }) {
  // Validate input parameters
  if (!email || !subject || !message) {
    console.error('Missing required email parameters:', { email, subject, message });
    return { success: false, error: 'Missing required parameters: email, subject, or message' };
  }

  // Validate SMTP credentials
  const smtpUser = process.env.SMTP_BREVO_USER || '8b5cff001@smtp-brevo.com';
  const smtpPass = process.env.NEXT_PUBLIC_SMTP_BREVO;

  if (!smtpUser || !smtpPass) {
    console.error('SMTP credentials missing', {
      smtpUser: smtpUser ? '***set***' : 'undefined',
      smtpPass: smtpPass ? '***set***' : 'undefined',
    });
    return { success: false, error: 'SMTP credentials missing: SMTP_BREVO_USER or SMTP_BREVO not set' };
  }

  // Log credentials for debugging (obfuscated)
  console.log('Attempting to send email with SMTP credentials:', {
    smtpUser: smtpUser.slice(0, 4) + '***',
    smtpPass: smtpPass.slice(0, 4) + '***',
  });

  // HTML template styled with project CSS
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Montserrat', sans-serif; color: var(--text-primary, #1f2937); background-color: var(--bg-primary, #f9fafb); line-height: 1.5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: var(--card-bg, rgba(255, 255, 255, 0.95)); border-radius: 0.75rem; padding: 2rem; box-shadow: var(--shadow, 0 4px 12px rgba(0, 0, 0, 0.1)); }
          .header { text-align: center; margin-bottom: 1.5rem; }
          .title-md { font-size: 1.75rem; color: var(--text-primary, #1f2937); text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.219); }
          .content { font-size: 1rem; color: var(--text-secondary, #4b5563); margin-bottom: 1.5rem; }
          .footer { font-size: 0.875rem; color: var(--text-muted, #6b7280); text-align: center; }
          .accent { color: var(--accent, #3b82f6); }
          @media (prefers-color-scheme: dark) {
            body { background-color: var(--bg-primary, #1f2937); color: var(--text-primary, #f9fafb); }
            .container { background: var(--card-bg, rgba(55, 65, 81, 0.95)); box-shadow: var(--shadow, 0 4px 12px rgba(0, 0, 0, 0.3)); }
            .title-md { color: var(--text-primary, #f9fafb); }
            .content { color: var(--text-secondary, #d1d5db); }
            .footer { color: var(--text-muted, #9ca3af); }
            .accent { color: var(--accent, #60a5fa); }
          }
          @media (max-width: 576px) {
            .container { padding: 1rem; }
            .title-md { font-size: clamp(1rem, 3.5vw, 1.25rem); }
            .content { font-size: clamp(0.75rem, 2vw, 1rem); }
            .footer { font-size: clamp(0.625rem, 1.75vw, 0.875rem); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="title-md">${subject}</h2>
          </div>
          <div class="content">${message}</div>
          <div class="footer">
            <br>
            <span class="accent">GOOD MEMORIES</span>
          </div>
        </div>
      </body>
    </html>
  `;

  // Configure Nodemailer transporter for Brevo
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false, // For development, align with working endpoint
    },
  });

  try {
    // Send the email
    const info = await transporter.sendMail({
      from: 'Good Memories <davipianof@gmail.com>',
      to: email,
      subject,
      text: message, // Plain text fallback
      html: htmlContent, // Styled HTML
    });

    console.log('Email sent:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}*/





























