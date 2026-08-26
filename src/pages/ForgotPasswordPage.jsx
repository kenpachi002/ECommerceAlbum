import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "var(--aurora-teal)", margin: "0 auto var(--sp-6)" }} />
          <h1>Check your email</h1>
          <p className="auth-card__sub" style={{ marginBottom: "var(--sp-8)" }}>
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
          </p>
          <Link to="/login" className="button button--secondary" style={{ width: "100%", justifyContent: "center" }}>
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="back-link" style={{ marginBottom: "var(--sp-6)" }}>
          <ArrowLeft size={15} /> Back to login
        </Link>
        
        <h1>Reset password</h1>
        <p className="auth-card__sub">Enter your email address and we'll send you a link to reset your password.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="forgot-email">
              <Mail size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={loading || !email}>
            {loading ? "Sending link…" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
