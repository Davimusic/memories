// pages/api/brevo/sendEmail.js
import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';
import EmailTemplate from '@/components/complex/emailTemplate';


export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Obtenemos los parámetros enviados en el body
    const { email, subject, message } = req.body;

    // Renderizamos el componente a una cadena HTML
    const htmlContent = ReactDOMServer.renderToStaticMarkup(
      <EmailTemplate subject={subject} message={message} />
    );

    // Configuración del transporter para Brevo
    let transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // true para puerto 465, false para STARTTLS en 587
      auth: {
        user: "8b5cff001@smtp-brevo.com", // Tu login SMTP de Brevo
        pass: "zjJ5Mtf7HnsWTdUr"         // Tu contraseña maestra SMTP
      },
      tls: {
        rejectUnauthorized: false // Solo recomendable en desarrollo
      }
    });

    try {
      // Envío del email utilizando el template renderizado
      let info = await transporter.sendMail({
        from: 'daviMusicWeb <davipianof@gmail.com>', // Debe ser un email verificado en Brevo
        to: email,
        subject: subject,
        text: message,    // Texto simple como fallback
        html: htmlContent // HTML generado a partir del componente
      });

      console.log("Message sent:", info.messageId);
      return res.status(200).json({ success: true, info });
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.response || null 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  }
}
