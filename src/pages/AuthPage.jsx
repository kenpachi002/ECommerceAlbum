import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CheckCircle, Fingerprint, KeyRound, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { RecordArt } from "../components/catalog/RecordArt";

export default function AuthPage() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || "/";

  // Determine initial tab from URL
  const pathTab = location.pathname === "/register" ? "join"
    : location.pathname === "/forgot-password" ? "forgot"
    : location.pathname === "/reset-password" ? "reset"
    : "signin";
  const [mode, setMode] = useState(pathTab);

  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "", displayName: "",
    resetToken: searchParams.get("token") || "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(null); };

  const strength = (() => {
    const pw = form.password;
    if (!pw) return null;
    if (pw.length < 8) return "weak";
    if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return "strong";
    return "medium";
  })();

  const switchMode = (m) => { setMode(m); setError(null); setSuccess(null); };

  // ── Handlers ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await login({ email: form.email, password: form.password }); navigate(from, { replace: true }); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleRegister = async (e) => {
    e.preventDefault(); setError(null);
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try { await register({ email: form.email, password: form.password, displayName: form.displayName }); navigate("/"); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleForgot = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await forgotPassword(form.email); setSuccess("If this email exists, a reset link has been sent."); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleReset = async (e) => {
    e.preventDefault(); setError(null);
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try { await resetPassword({ token: form.resetToken, password: form.password }); setSuccess("Password updated! Redirecting…"); setTimeout(() => navigate("/"), 1500); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="stitch-auth">
      {/* Background ambient orbs */}
      <div className="stitch-auth__ambient" aria-hidden="true">
        <div className="stitch-auth__orb stitch-auth__orb--violet" />
        <div className="stitch-auth__orb stitch-auth__orb--gold" />
      </div>

      <div className="stitch-auth__container">
        {/* ── Left: Vinyl Sleeve Showcase ──────────────────────── */}
        <div className="stitch-auth__sleeve">
          {/* SVG Vinyl Grooves */}
          <div className="stitch-auth__grooves" aria-hidden="true">
            <svg viewBox="0 0 500 500" fill="none">
              <circle cx="250" cy="250" r="80" stroke="currentColor" strokeWidth="0.75" className="text-violet" />
              <circle cx="250" cy="250" r="120" stroke="currentColor" strokeWidth="0.5" className="text-muted" />
              <circle cx="250" cy="250" r="160" stroke="currentColor" strokeWidth="0.75" className="text-violet" />
              <circle cx="250" cy="250" r="200" stroke="currentColor" strokeWidth="0.5" className="text-muted" />
              <circle cx="250" cy="250" r="240" stroke="currentColor" strokeWidth="0.5" className="text-gold" />
              <circle cx="250" cy="250" r="280" stroke="currentColor" strokeWidth="0.75" className="text-muted" />
            </svg>
          </div>

          {/* System version tag */}
          <div className="stitch-auth__tag">
            <span className="stitch-auth__pulse" />
            <span>ARCHIVE SYSTEM v4.2</span>
          </div>

          {/* Vinyl + Sleeve art */}
          <div className="stitch-auth__vinyl-art" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <RecordArt palette={7} spinning={true} size="280px" />
          </div>

          {/* Bottom tagline */}
          <div className="stitch-auth__tagline">
            <h2>"Pressed. <em>Not streamed.</em>"</h2>
            <p>Exclusive access to rare pressings, uncompressed first-generation masters, and verified archival crates.</p>
          </div>
        </div>

        {/* ── Right: Auth Form ─────────────────────────────────── */}
        <div className="stitch-auth__form-side">
          {/* Header */}
          <div className="stitch-auth__header">
            <div className="stitch-auth__header-top">
              <div className="stitch-auth__vault-badge">
                <Lock size={13} />
                <span>Groove & Co. / Vault Access</span>
              </div>
              <div className="stitch-auth__status">
                <span>Status:</span>
                <span className="stitch-auth__status-online"><span className="stitch-auth__status-dot" /> Online</span>
              </div>
            </div>
            <h1 className="stitch-auth__heading">
              {mode === "signin" && "Enter the Sanctuary."}
              {mode === "join" && "Claim Your Archive."}
              {mode === "forgot" && "Recover Your Key."}
              {mode === "reset" && "Set New Passphrase."}
            </h1>
            <p className="stitch-auth__sub">
              {mode === "signin" && "Connect your audiophile account to inspect catalog pressings and rare live master tapes."}
              {mode === "join" && "Create your Groove & Co. membership for curated vault access."}
              {mode === "forgot" && "We'll send a recovery link via email to reset your passphrase."}
              {mode === "reset" && "Choose a new secure passphrase for your vault."}
            </p>
          </div>

          {/* Mode Switcher */}
          {(mode === "signin" || mode === "join") && (
            <div className="stitch-auth__switcher">
              <button className={`stitch-auth__switch-btn ${mode === "signin" ? "stitch-auth__switch-btn--active" : ""}`}
                onClick={() => switchMode("signin")}>Sign In</button>
              <button className={`stitch-auth__switch-btn ${mode === "join" ? "stitch-auth__switch-btn--active" : ""}`}
                onClick={() => switchMode("join")}>Join Archive</button>
            </div>
          )}

          {/* Toasts */}
          {error && <div className="stitch-auth__toast stitch-auth__toast--error">{error}</div>}
          {success && <div className="stitch-auth__toast stitch-auth__toast--success"><CheckCircle size={15} /> {success}</div>}

          {/* ── SIGN IN ──────────────────────── */}
          {mode === "signin" && (
            <form onSubmit={handleLogin} noValidate className="stitch-auth__fields" key="signin">
              <div className="stitch-field">
                <div className="stitch-field__header">
                  <label htmlFor="auth-email">Email address or Audiophile ID</label>
                </div>
                <div className="stitch-field__input-wrap">
                  <Fingerprint size={18} className="stitch-field__icon" />
                  <input id="auth-email" type="email" value={form.email} onChange={set("email")}
                    placeholder="coltrane@grooveandco.com" required autoComplete="email" autoFocus />
                </div>
              </div>
              <div className="stitch-field">
                <div className="stitch-field__header">
                  <label htmlFor="auth-pw">Vault Passphrase</label>
                  <button type="button" className="stitch-field__link stitch-field__link--gold" onClick={() => switchMode("forgot")}>Forgotten Key?</button>
                </div>
                <div className="stitch-field__input-wrap">
                  <KeyRound size={18} className="stitch-field__icon" />
                  <input id="auth-pw" type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                    placeholder="••••••••••••••••" required autoComplete="current-password" />
                  <button type="button" className="stitch-field__eye" onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? "Hide" : "Show"}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="stitch-auth__cta" disabled={loading}>
                {loading ? <span className="stitch-spinner" /> : <><span>Continue with Password</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ── JOIN ─────────────────────────── */}
          {mode === "join" && (
            <form onSubmit={handleRegister} noValidate className="stitch-auth__fields" key="join">
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="join-name">Display Name <span className="stitch-field__opt">(optional)</span></label></div>
                <div className="stitch-field__input-wrap">
                  <User size={18} className="stitch-field__icon" />
                  <input id="join-name" type="text" value={form.displayName} onChange={set("displayName")} placeholder="Your handle" autoComplete="name" />
                </div>
              </div>
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="join-email">Email address</label></div>
                <div className="stitch-field__input-wrap">
                  <Mail size={18} className="stitch-field__icon" />
                  <input id="join-email" type="email" value={form.email} onChange={set("email")} placeholder="coltrane@grooveandco.com" required autoComplete="email" />
                </div>
              </div>
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="join-pw">Create Passphrase</label></div>
                <div className="stitch-field__input-wrap">
                  <KeyRound size={18} className="stitch-field__icon" />
                  <input id="join-pw" type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min. 8 characters" required autoComplete="new-password" minLength={8} />
                  <button type="button" className="stitch-field__eye" onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {strength && (
                  <div className={`password-strength password-strength--${strength}`}>
                    <div className="password-strength__bar" />
                    <span>{strength === "weak" ? "Too short" : strength === "medium" ? "Good" : "Strong"}</span>
                  </div>
                )}
              </div>
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="join-confirm">Confirm Passphrase</label></div>
                <div className="stitch-field__input-wrap">
                  <Lock size={18} className="stitch-field__icon" />
                  <input id="join-confirm" type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat passphrase" required autoComplete="new-password" />
                </div>
              </div>
              <button type="submit" className="stitch-auth__cta" disabled={loading}>
                {loading ? <span className="stitch-spinner" /> : <><span>Claim Archival Membership</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ── FORGOT ───────────────────────── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgot} noValidate className="stitch-auth__fields" key="forgot">
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="forgot-email">Email address</label></div>
                <div className="stitch-field__input-wrap">
                  <Mail size={18} className="stitch-field__icon" />
                  <input id="forgot-email" type="email" value={form.email} onChange={set("email")} placeholder="coltrane@grooveandco.com" required autoComplete="email" autoFocus />
                </div>
              </div>
              <button type="submit" className="stitch-auth__cta" disabled={loading || !form.email}>
                {loading ? <span className="stitch-spinner" /> : <><span>Send Recovery Link</span> <ArrowRight size={16} /></>}
              </button>
              <button type="button" className="stitch-auth__back-link" onClick={() => switchMode("signin")}>← Back to Sign In</button>
            </form>
          )}

          {/* ── RESET ────────────────────────── */}
          {mode === "reset" && (
            <form onSubmit={handleReset} noValidate className="stitch-auth__fields" key="reset">
              {!form.resetToken && (
                <div className="stitch-field">
                  <div className="stitch-field__header"><label htmlFor="reset-token">Reset Token</label></div>
                  <div className="stitch-field__input-wrap">
                    <KeyRound size={18} className="stitch-field__icon" />
                    <input id="reset-token" type="text" value={form.resetToken} onChange={set("resetToken")} placeholder="Paste your token" required />
                  </div>
                </div>
              )}
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="reset-pw">New Passphrase</label></div>
                <div className="stitch-field__input-wrap">
                  <Lock size={18} className="stitch-field__icon" />
                  <input id="reset-pw" type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min. 8 characters" required minLength={8} />
                  <button type="button" className="stitch-field__eye" onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div className="stitch-field">
                <div className="stitch-field__header"><label htmlFor="reset-confirm">Confirm Passphrase</label></div>
                <div className="stitch-field__input-wrap">
                  <Lock size={18} className="stitch-field__icon" />
                  <input id="reset-confirm" type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat passphrase" required />
                </div>
              </div>
              <button type="submit" className="stitch-auth__cta" disabled={loading}>
                {loading ? <span className="stitch-spinner" /> : <><span>Update Passphrase</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="stitch-auth__footer">
            <p>By authenticating, you agree to Groove & Co. <a href="#">Terms of Sound</a> and <a href="#">Archival Guidelines</a>.</p>
            <div className="stitch-auth__footer-badge"><span className="stitch-auth__footer-dot" /> FLAC 192/24 READY</div>
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="stitch-auth__ticker">
        <span className="stitch-auth__ticker-label">Recently Added to Master Vault:</span>
        <span className="stitch-auth__ticker-title">John Coltrane — A Love Supreme [Gatefold 2024 Remaster]</span>
        <span className="stitch-auth__ticker-meta">CAT# GC-9821 · EDITION 420/500</span>
      </div>
    </div>
  );
}
