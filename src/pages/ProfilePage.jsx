import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Save, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { apiClient } from "../lib/apiClient";

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
          await apiClient.updateProfile({ displayName, email });
    setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="profile-page">
      <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to catalog</Link>
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="profile-page__title">{user?.displayName || "Your Profile"}</h1>
          <p className="profile-page__email">{user?.email}</p>
          {user?.role === "admin" && <span className="profile-page__role">Admin</span>}
        </div>
      </div>

      <div className="profile-tabs">
        {tabs.map((t) => { const Icon = t.icon; return (
          <button key={t.id} className={`profile-tab${tab === t.id ? " is-active" : ""}`} onClick={() => setTab(t.id)}>
            <Icon size={15} /> {t.label}
          </button>
        ); })}
      </div>

      {success && <div className="profile__success"><CheckCircle size={16} /> {success}</div>}
      {error && <div className="profile__error"><AlertCircle size={16} /> {error}</div>}

      {tab === "profile" && (
        <form className="profile-form" onSubmit={handleProfileSave}>
          <div className="profile-field">
            <label>Display Name</label>
            <div className="profile-field__input"><User size={16} /><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" /></div>
          </div>
          <div className="profile-field">
            <label>Email</label>
            <div className="profile-field__input"><Mail size={16} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" /></div>
          </div>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Saving…" : <><Save size={15} /> Save Changes</>}
          </button>
        </form>
      )}

      {tab === "security" && (
        <form className="profile-form" onSubmit={handlePasswordChange}>
          <div className="profile-field">
            <label>Current Password</label>
            <div className="profile-field__input"><Lock size={16} /><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" /></div>
          </div>
          <div className="profile-field">
            <label>New Password</label>
            <div className="profile-field__input"><Lock size={16} /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" /></div>
          </div>
          <div className="profile-field">
            <label>Confirm New Password</label>
            <div className="profile-field__input"><Lock size={16} /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" /></div>
          </div>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Changing…" : <><Lock size={15} /> Change Password</>}
          </button>
        </form>
      )}
    </div>
  );
}
