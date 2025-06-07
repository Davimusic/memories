// utils/sendEmail.js
import nodemailer from 'nodemailer';

export async function sendEmail({ email, subject, message }) {
  // HTML template styled with project CSS
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Montserrat', sans-serif;
            color: var(--text-primary, #1f2937);
            background-color: var(--bg-primary, #f9fafb);
            line-height: 1.5;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: var(--card-bg, rgba(255, 255, 255, 0.95));
            border-radius: 0.75rem;
            padding: 2rem;
            box-shadow: var(--shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
          }
          .header {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .title-md {
            font-size: 1.75rem;
            color: var(--text-primary, #1f2937);
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.219);
          }
          .content {
            font-size: 1rem;
            color: var(--text-secondary, #4b5563);
            margin-bottom: 1.5rem;
          }
          .footer {
            font-size: 0.875rem;
            color: var(--text-muted, #6b7280);
            text-align: center;
          }
          .accent {
            color: var(--accent, #3b82f6);
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: var(--bg-primary, #1f2937);
              color: var(--text-primary, #f9fafb);
            }
            .container {
              background: var(--card-bg, rgba(55, 65, 81, 0.95));
              box-shadow: var(--shadow, 0 4px 12px rgba(0, 0, 0, 0.3));
            }
            .title-md {
              color: var(--text-primary, #f9fafb);
            }
            .content {
              color: var(--text-secondary, #d1d5db);
            }
            .footer {
              color: var(--text-muted, #9ca3af);
            }
            .accent {
              color: var(--accent, #60a5fa);
            }
          }
          @media (max-width: 576px) {
            .container {
              padding: 1rem;
            }
            .title-md {
              font-size: clamp(1rem, 3.5vw, 1.25rem);
            }
            .content {
              font-size: clamp(0.75rem, 2vw, 1rem);
            }
            .footer {
              font-size: clamp(0.625rem, 1.75vw, 0.875rem);
            }
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
      user: '8b5cff001@smtp-brevo.com', // Static for now, consider env variable
      pass: process.env.SMTP_BREVO 
    },
  });

  try {
    // Send the email
    const info = await transporter.sendMail({
      from: 'daviMusicWeb <davipianof@gmail.com>',
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
}