import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { RecordArt } from "../components/catalog/RecordArt";

export default function CheckoutPage({ cart, onCheckout }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postcode: "",
    country: "GB",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const subtotal = cart.total;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await onCheckout({
        email: form.email,
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          postcode: form.postcode,
          country: form.country,
        },
      });
      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container checkout-page" style={{ textAlign: "center", paddingTop: 80 }}>
        <h1>Nothing in your crate</h1>
        <p style={{ color: "var(--color-muted)", marginBottom: 24 }}>Add some records before checking out.</p>
        <Link className="button button--primary" to="/">Browse catalog</Link>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} /> Back to catalog
      </Link>
      <h1>Checkout</h1>

      {/* Demo notice */}
      <div className="demo-notice">
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Demo mode</strong> — This is a college project. No real payment is processed.
          Orders are stored in the local PostgreSQL database only.
        </span>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.25)",
          color: "var(--color-danger)",
          marginBottom: 24,
          fontSize: "var(--text-sm)",
        }}>
          {error}
        </div>
      )}

      <form className="checkout-grid" onSubmit={handleSubmit} noValidate>
        <div className="checkout-form">
          {/* Contact */}
          <div className="form-section">
            <h2>Contact</h2>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Shipping */}
          <div className="form-section">
            <h2>Shipping address</h2>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" type="text" value={form.firstName} onChange={set("firstName")} placeholder="Jane" required autoComplete="given-name" />
              </div>
              <div className="form-field">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" type="text" value={form.lastName} onChange={set("lastName")} placeholder="Smith" required autoComplete="family-name" />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="address">Street address</label>
              <input id="address" type="text" value={form.address} onChange={set("address")} placeholder="42 Vinyl Lane" required autoComplete="street-address" />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="city">City</label>
                <input id="city" type="text" value={form.city} onChange={set("city")} placeholder="London" required autoComplete="address-level2" />
              </div>
              <div className="form-field">
                <label htmlFor="postcode">Postcode</label>
                <input id="postcode" type="text" value={form.postcode} onChange={set("postcode")} placeholder="EC1A 1BB" required autoComplete="postal-code" />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="country">Country</label>
              <select id="country" value={form.country} onChange={set("country")} autoComplete="country">
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="AU">Australia</option>
                <option value="JP">Japan</option>
                <option value="IE">Ireland</option>
                <option value="IN">India</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="button button--primary" style={{ width: "100%", justifyContent: "center", padding: "16px" }} disabled={submitting}>
            {submitting ? "Placing order…" : `Place order · $${total.toFixed(2)}`}
          </button>
        </div>

        {/* Order Summary */}
        <aside className="order-summary">
          <h2>Order summary</h2>
          <div className="order-summary__items">
            {cart.items.map((item) => (
              <div className="order-summary__item" key={item.id}>
                <div className="order-summary__item-art">
                  <RecordArt palette={item.palette} spinning={false} />
                </div>
                <div className="order-summary__item-info">
                  <p className="order-summary__item-title">{item.title}</p>
                  <p className="order-summary__item-sub">{item.artist} · {item.format} · ×{item.qty}</p>
                </div>
                <span className="order-summary__item-price">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-summary__divider" />
          <div className="order-summary__line">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="order-summary__line">
            <span>Shipping</span>
            <strong>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</strong>
          </div>
          <div className="order-summary__total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </aside>
      </form>
    </div>
  );
}
