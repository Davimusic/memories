import { useState } from "react";
import '../estilos/general/information.css'
import Layout from "@/components/complex/articles/layout";

export default function EmailSender() {
  const [formData, setFormData] = useState({
    replyToEmail: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ message: "", isError: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ message: "Sending...", isError: false });

    try {
      const res = await fetch("/api/brevo/sendEmailFromClient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "davipianof@gmail.com",
          replyTo: formData.replyToEmail,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setStatus({
        message: "Email sent successfully! Check the spam folder if not visible.",
        isError: false,
      });
      setFormData({ replyToEmail: "", subject: "", message: "" });
    } catch (err) {
      console.error("Submission error:", err);
      setStatus({
        message: `Error: ${err.message}`,
        isError: true,
      });
    }
  };

  return (
    <Layout>
      <div className="feedback-form">
        <h2 className="feedback-title">Send Email</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Your Email (for reply):
              <input
                type="email"
                name="replyToEmail"
                value={formData.replyToEmail}
                onChange={handleChange}
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
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Write your message here..."
              />
            </label>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={status.message === "Sending..."}
          >
            {status.message === "Sending..." ? "Sending..." : "Send Email"}
          </button>
        </form>

        {status.message && (
          <div className={`feedback-${status.isError ? "error" : "success"}`}>
            {status.message}
          </div>
        )}
      </div>
    </Layout>
  );
}