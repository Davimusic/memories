import { useState, useEffect } from "react";
import BackgroundGeneric from "@/components/complex/backgroundGeneric";
import '../estilos/general/general.css'
import '../app/globals.css'

export default function EmailSender() {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [senderEmail, setSenderEmail] = useState("");
  const [status, setStatus] = useState({ message: "", isError: false });

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setSenderEmail(storedEmail);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSenderChange = (e) => {
    setSenderEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ message: "Sending...", isError: false });

    const payload = {
      email: "davipianof@gmail.com",
      sender: senderEmail || "Unknown",
      subject: formData.subject,
      message: formData.message,
    };

    try {
      const res = await fetch("/api/brevo/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setStatus({
        message: "Email sent successfully! We will be in touch with you soon!",
        isError: false,
      });
      setFormData({ subject: "", message: "" });
    } catch (err) {
      console.error("Submission error:", err);
      setStatus({
        message: `Error: ${err.message}`,
        isError: true,
      });
    }
  };

  return (
    <BackgroundGeneric showImageSlider={false}>
        <div className="fullscreen-floating">
        <div className="email-sender-container">
            <h2 style={{textAlign: 'center'}} className="title-lg color1">Contact Form</h2>
            <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>
                Your Email:
                <input
                    type="email"
                    name="sender"
                    value={senderEmail}
                    onChange={handleSenderChange}
                    required
                    placeholder="example@gmail.com"
                />
                </label>
            </div>
            
            <div className="form-group">
                <label>
                Subject:
                <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Message subject"
                />
                </label>
            </div>
            
            <div className="form-group">
                <label>
                Message:
                <textarea
                    className="text-area"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Write your message here..."
                />
                </label>
            </div>
            
            <button type="submit" disabled={status.message === "Sending..."}>
                {status.message === "Sending..." ? "Sending..." : "Send Email"}
            </button>
            </form>

            {status.message && (
            <div className={`status-message ${status.isError ? "error" : "success"}`}>
                {status.message}
            </div>
            )}
        </div>

        <style jsx>{`
            .email-sender-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 95%;
            max-width: 500px;
            padding: 2rem;
            margin: 0;
            border-radius: 0.7em;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            background: var(--backgroundColor5);
            }

            .form-group {
            margin-bottom: 1.5rem;
            }

            label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: var(--color1);
            }

            input,
            textarea {
            width: 100%;
            padding: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: border-color 0.3s ease;
            }

            input:focus,
            textarea:focus {
            outline: none;
            border-color: var(--backgroundColor1);
            }

            button {
            width: 100%;
            padding: 1rem;
            background: var(--backgroundColor1);
            color: var(--color3);
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s ease;
            }

            button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            }

            .status-message {
            margin-top: 1.5rem;
            padding: 1rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            }

            .error {
            background: #ffe3e6;
            color: #dc3545;
            }

            .success {
            background: #e6fffa;
            color: #28a745;
            }

            @media (max-width: 768px) {
            .email-sender-container {
                padding: 1.5rem;
                border-radius: 0;
            }
            
            h2 {
                font-size: 1.5rem;
                margin-bottom: 1.5rem;
            }

            input,
            textarea {
                font-size: 0.9rem;
                padding: 0.7rem;
            }

            button {
                padding: 0.8rem;
                font-size: 0.9rem;
            }
            }

            @media (max-width: 480px) {
            .email-sender-container {
                width: 100%;
                height: 100%;
                padding: 1rem;
            }

            .form-group {
                margin-bottom: 1rem;
            }
            }
        `}</style>
        </div>
    </BackgroundGeneric>
  );
}
