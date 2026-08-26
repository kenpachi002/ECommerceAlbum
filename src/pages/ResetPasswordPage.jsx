import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1>Invalid link</h1>
          <p className="auth-card__sub" style={{ marginBottom: "var(--sp-6)" }}>
            The password reset link is missing or invalid. Please request a new one.
          </p>
          <Link to="/forgot-password" className="button button--primary" style={{ width: "100%", justifyContent: "center" }}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    try {
      await resetPassword({ token, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
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

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "var(--aurora-teal)", margin: "0 auto var(--sp-6)" }} />
          <h1>Password updated!</h1>
          <p className="auth-card__sub">You have been securely signed in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Set new password</h1>
        <p className="auth-card__sub">Enter your new secure password below.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="reset-password">
              <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              New password
            </label>
            <div className="input-with-icon">
              <input
                id="reset-password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                minLength={8}
                autoFocus
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
            <label htmlFor="reset-confirm">
              <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Confirm new password
            </label>
            <input
              id="reset-confirm"
              type={showPw ? "text" : "password"}
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="button button--primary auth-submit" disabled={loading}>
            {loading ? "Updating password…" : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
