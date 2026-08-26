import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, displayName: form.displayName });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const pw = form.password;
    if (!pw) return null;
    if (pw.length < 8) return "weak";
    if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return "strong";
    return "medium";
  })();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <Link to="/" className="auth-card__logo">Groove <span>&</span> Co.</Link>
        </div>
        <h1>Create account</h1>
        <p className="auth-card__sub">Join to save your wishlist and order history</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="reg-name">
              <User size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Display name <span style={{ color: "var(--color-subtle)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input id="reg-name" type="text" value={form.displayName} onChange={set("displayName")} placeholder="Your name" autoComplete="name" />
          </div>

          <div className="form-field">
            <label htmlFor="reg-email">
              <Mail size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Email
            </label>
            <input id="reg-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required autoComplete="email" />
          </div>

          <div className="form-field">
            <label htmlFor="reg-password">
              <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Password
            </label>
            <div className="input-with-icon">
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {strength && (
              <div className={`password-strength password-strength--${strength}`}>
                <div className="password-strength__bar" />
                <span>{strength === "weak" ? "Too short" : strength === "medium" ? "Good" : "Strong"}</span>
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="reg-confirm">
              <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type={showPw ? "text" : "password"}
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
