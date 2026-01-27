import { useState } from "react";
import "./App.css";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx4WyAj7-AVtysNpMKEC2y_jhQP8Ek6JW4uMGrVwD_-O3oJLUdAEYctvFhi7n8Nt2Jm/exec";

export default function App() {
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
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.status === "success") {
        setStatus("✅ Data saved successfully!");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("❌ Failed to save data");
      }
    } catch (err) {
      setStatus("❌ Network error");
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