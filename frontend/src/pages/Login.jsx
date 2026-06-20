import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";

const DEMO = [
  { label: "Admin", email: "admin@cityclinic.com", password: "admin123" },
  { label: "Doctor", email: "doctor@cityclinic.com", password: "doctor123" },
  { label: "Receptionist", email: "reception@cityclinic.com", password: "reception123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@cityclinic.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-brand">
          <span className="brand-mark"><Activity size={22} /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-.02em" }}>CityClinic</div>
            <div className="caption">Care Platform</div>
          </div>
        </div>

        <h1 className="h-page" style={{ marginTop: 22 }}>Welcome back</h1>
        <p className="text-2" style={{ margin: "4px 0 20px", fontSize: ".9rem" }}>
          Sign in to your account to continue.
        </p>

        <form onSubmit={submit}>
          {error && <div className="form-banner">{error}</div>}
          <div className="field">
            <label>Email</label>
            <div className="input-icon">
              <Mail size={16} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.com" required />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-icon">
              <Lock size={16} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <Button variant="primary" type="submit" loading={loading} className="login-submit">
            Sign in <ArrowRight size={16} />
          </Button>
        </form>

        <div className="login-demo">
          <div className="caption" style={{ marginBottom: 8 }}>Demo accounts — click to fill</div>
          <div className="demo-row">
            {DEMO.map((d) => (
              <button
                key={d.label}
                type="button"
                className="demo-chip"
                onClick={() => { setEmail(d.email); setPassword(d.password); }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
