import { useState } from "react";

export default function EmailSender() {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ message: "", isError: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ message: "Enviando...", isError: false });
    
    try {
      const res = await fetch("/api/brevo/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el email");
      }
      
      setStatus({ 
        message: "¡Email enviado correctamente! Revisa la bandeja de spam si no lo ves.", 
        isError: false 
      });
      setFormData({ email: "", subject: "", message: "" });
      
    } catch (err) {
      console.error("Submission error:", err);
      setStatus({ 
        message: `Error: ${err.message}`, 
        isError: true 
      });
    }
  };

  return (
    <div className="email-sender-container">
      <h2>Enviar Email</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Destinatario:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ejemplo@gmail.com"
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>
            Asunto:
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Asunto del mensaje"
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>
            Mensaje:
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Escribe tu mensaje aquí..."
            />
          </label>
        </div>
        
        <button type="submit" disabled={status.message === "Enviando..."}>
          {status.message === "Enviando..." ? "Enviando..." : "Enviar Email"}
        </button>
      </form>
      
      {status.message && (
        <div className={`status-message ${status.isError ? "error" : "success"}`}>
          {status.message}
        </div>
      )}
      
      <style jsx>{`
        .email-sender-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        input, textarea {
          width: 100%;
          padding: 8px;
          margin-top: 5px;
        }
        button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 15px;
          cursor: pointer;
        }
        button:disabled {
          background: #ccc;
        }
        .status-message {
          margin-top: 15px;
          padding: 10px;
          border-radius: 4px;
        }
        .error {
          background: #ffebee;
          color: #d32f2f;
        }
        .success {
          background: #e8f5e9;
          color: #2e7d32;
        }
      `}</style>
    </div>
  );
}