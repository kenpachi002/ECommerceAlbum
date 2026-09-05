import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, Truck, ShieldCheck, Package, CheckCircle, Loader2 } from "lucide-react";
import { RecordArt } from "../components/catalog/RecordArt";
import { useAuth } from "../features/auth/AuthContext";

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "IE", name: "Ireland" },
  { code: "OTHER", name: "Other" },
];

export default function CheckoutPage({ cart, onCheckout }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1 = shipping, 2 = payment
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postcode: "",
    country: "IN",
    // Payment fields (demo — no real processing yet)
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
    cardName: "",
  });

  const set = (field) => (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setError(null); };

  const subtotal = cart.total;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  // Format card number with spaces
  const handleCardNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
    setForm((f) => ({ ...f, cardNumber: formatted }));
  };

  // Format expiry as MM/YY
  const handleExpiry = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
    setForm((f) => ({ ...f, cardExpiry: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      // Validate shipping
      if (!form.email || !form.firstName || !form.lastName || !form.address || !form.city || !form.postcode) {
        setError("Please fill in all shipping fields."); return;
      }
      setStep(2);
      return;
    }
    // Step 2: Submit order
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
      <div className="checkout-v2-empty">
        <Package size={56} strokeWidth={1} />
        <h1>Your crate is empty</h1>
        <p>Add some records before checking out.</p>
        <Link className="button button--primary" to="/">Browse catalog</Link>
      </div>
    );
  }

  return (
    <div className="checkout-v2">
      {/* Left: Form */}
      <div className="checkout-v2__form-side">
        <Link className="checkout-v2__back" to="/">
          <ArrowLeft size={15} /> Back to catalog
        </Link>

        <h1 className="checkout-v2__title">Checkout</h1>

        {/* Step Indicator */}
        <div className="checkout-steps">
          <div className={`checkout-step ${step >= 1 ? "checkout-step--active" : ""}`}>
            <div className="checkout-step__dot">{step > 1 ? <CheckCircle size={16} /> : "1"}</div>
            <span>Shipping</span>
          </div>
          <div className="checkout-step__line" />
          <div className={`checkout-step ${step >= 2 ? "checkout-step--active" : ""}`}>
            <div className="checkout-step__dot">2</div>
            <span>Payment</span>
          </div>
        </div>

        <div className="checkout-v2__notice">
          <ShieldCheck size={16} />
          <span><strong>Secure checkout</strong> — Your payment details are encrypted and your order will be confirmed immediately.</span>
        </div>

        {error && <div className="checkout-v2__error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Step 1: Shipping ──────────────────── */}
          {step === 1 && (
            <div className="checkout-v2__section" key="shipping">
              <div className="checkout-v2__section-header">
                <MapPin size={18} />
                <h2>Shipping Details</h2>
              </div>
              <div className="form-field">
                <label htmlFor="ch-email">Email address</label>
                <input id="ch-email" type="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="ch-first">First name</label>
                  <input id="ch-first" type="text" value={form.firstName} onChange={set("firstName")}
                    placeholder="Your first name" required autoComplete="given-name" />
                </div>
                <div className="form-field">
                  <label htmlFor="ch-last">Last name</label>
                  <input id="ch-last" type="text" value={form.lastName} onChange={set("lastName")}
                    placeholder="Your last name" required autoComplete="family-name" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="ch-address">Street address</label>
                <input id="ch-address" type="text" value={form.address} onChange={set("address")}
                  placeholder="Your street address" required autoComplete="street-address" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="ch-city">City</label>
                  <input id="ch-city" type="text" value={form.city} onChange={set("city")}
                    placeholder="Your city" required autoComplete="address-level2" />
                </div>
                <div className="form-field">
                  <label htmlFor="ch-zip">Postcode</label>
                  <input id="ch-zip" type="text" value={form.postcode} onChange={set("postcode")}
                    placeholder="Your postcode" required autoComplete="postal-code" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="ch-country">Country</label>
                <select id="ch-country" value={form.country} onChange={set("country")} autoComplete="country">
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="checkout-v2__submit">
                <span>Continue to Payment</span> <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
            </div>
          )}

          {/* ── Step 2: Payment ───────────────────── */}
          {step === 2 && (
            <div className="checkout-v2__section" key="payment">
              <button type="button" className="checkout-v2__back-step" onClick={() => setStep(1)}>
                <ArrowLeft size={14} /> Edit shipping
              </button>
              <div className="checkout-v2__section-header">
                <CreditCard size={18} />
                <h2>Payment Details</h2>
              </div>
              <div className="checkout-v2__card-preview">
                <div className="card-chip" />
                <div className="card-number">{form.cardNumber || "•••• •••• •••• ••••"}</div>
                <div className="card-bottom">
                  <div><span className="card-label">HOLDER</span><br />{form.cardName || "YOUR NAME"}</div>
                  <div><span className="card-label">EXPIRES</span><br />{form.cardExpiry || "MM/YY"}</div>
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="ch-card-name">Cardholder name</label>
                <input id="ch-card-name" type="text" value={form.cardName} onChange={set("cardName")}
                  placeholder="Your full name" autoComplete="cc-name" />
              </div>
              <div className="form-field">
                <label htmlFor="ch-card-num">Card number</label>
                <input id="ch-card-num" type="text" value={form.cardNumber} onChange={handleCardNumber}
                  placeholder="•••• •••• •••• ••••" autoComplete="cc-number" inputMode="numeric" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="ch-card-exp">Expiry</label>
                  <input id="ch-card-exp" type="text" value={form.cardExpiry} onChange={handleExpiry}
                    placeholder="MM/YY" autoComplete="cc-exp" inputMode="numeric" />
                </div>
                <div className="form-field">
                  <label htmlFor="ch-card-cvc">CVC</label>
                  <input id="ch-card-cvc" type="text" value={form.cardCVC}
                    onChange={(e) => setForm((f) => ({ ...f, cardCVC: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="123" autoComplete="cc-csc" inputMode="numeric" />
                </div>
              </div>
              <button type="submit" className="checkout-v2__submit checkout-v2__submit--pay" disabled={submitting}>
                {submitting ? (
                  <span className="checkout-pay-loading">
                    <span className="checkout-pay-loading__bar" />
                    <span className="checkout-pay-loading__text">
                      <Loader2 size={15} className="spin" />
                      Confirming order…
                    </span>
                  </span>
                ) : (
                  <><ShieldCheck size={16} /> <span>Complete Purchase · ${total.toFixed(2)}</span></>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Right: Order Summary */}
      <aside className="checkout-v2__summary">
        <div className="checkout-v2__summary-inner">
          <h2>Order Summary</h2>
          <div className="checkout-v2__items">
            {cart.items.map((item) => (
              <div className="checkout-v2__item" key={item.id}>
                <div className="checkout-v2__item-art">
                  {item.artworkUrl ? (
                    <img src={item.artworkUrl} alt={item.title} />
                  ) : (
                    <RecordArt palette={item.palette} spinning={false} />
                  )}
                  <span className="checkout-v2__item-qty">{item.qty}</span>
                </div>
                <div className="checkout-v2__item-info">
                  <p className="checkout-v2__item-title">{item.title}</p>
                  <p className="checkout-v2__item-meta">{item.artist} · {item.format}</p>
                </div>
                <span className="checkout-v2__item-price">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-v2__divider" />

          <div className="checkout-v2__line">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="checkout-v2__line">
            <span><Truck size={14} /> Shipping</span>
            <strong>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</strong>
          </div>
          {shipping === 0 && (
            <div className="checkout-v2__free-ship">
              <CheckCircle size={13} /> Free shipping on orders over $50
            </div>
          )}
          <div className="checkout-v2__divider" />
          <div className="checkout-v2__total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
