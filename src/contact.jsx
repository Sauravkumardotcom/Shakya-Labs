import { useState } from "react";
import "./App.css";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/sendMail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      // Ensure we can parse the response as JSON
      if (!res.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Server did not return JSON response');
      }

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setStatus("✅ Message sent successfully! We'll get back to you soon.");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus(`❌ ${data?.message || "Failed to send message. Please try again."}`);
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      setStatus("❌ Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Contact Form</h2>

        <input
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          placeholder="Your Message"
          value={form.message}
          onChange={handleChange}
          rows="4"
        />

        <button disabled={loading}>
          {loading ? "Sending..." : "Submit"}
        </button>

        {status && <p className="status">{status}</p>}
      </form>
    </div>
  );
}