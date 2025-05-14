// components/EmailTemplate.js
import React from 'react';
//import MemoryLogo from './memoryLogo';

const EmailTemplate = ({ subject, message }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>{subject}</title>
        <style>
          {`
            body { margin: 0; padding: 0; background-color: #f4f4f4; }
            .email-container {
              margin: 20px auto;
              border-collapse: collapse;
              background-color: #ffffff;
              border: 1px solid #cccccc;
              width: 600px;
            }
            .header { padding: 20px; text-align: center; }
            .content { padding: 20px 30px; font-family: Arial, sans-serif; color: #333333; }
            .footer {
              padding: 20px 30px;
              background-color: #ee4c50;
              text-align: center;
              font-family: Arial, sans-serif;
              color: #ffffff;
              font-size: 14px;
            }
          `}
        </style>
      </head>
      <body>
        <table className="email-container">
          <tr>
            
          </tr>
          <tr>
            <td className="content">
              <h2>{subject}</h2>
              <p>{message}</p>
            </td>
          </tr>
          <tr>
            <td className="footer">
              © 2025 daviMusicWeb. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export default EmailTemplate;

