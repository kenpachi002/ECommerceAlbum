import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, Truck, ShieldCheck, Package, CheckCircle, Loader2, Wallet } from "lucide-react";
import { RecordArt } from "../components/catalog/RecordArt";
import { useAuth } from "../features/auth/AuthContext";
import { apiClient } from "../lib/apiClient";

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
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [paymentPhase, setPaymentPhase] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const progressRef = useRef(null);

    // Fetch wallet balance on mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await apiClient.getWallet();
        setWalletBalance(data.balance || 0);
      } catch { /* ignore */ }
    };
    fetchWallet();
  }, []);

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

  // Payment progress animation — returns a promise that resolves after animation completes
  const runPaymentAnimation = () => {
    return new Promise((resolve) => {
      setPaymentProgress(0);
      setPaymentPhase("Connecting...");
      const phases = [
        { pct: 12, label: "Connecting..." },
        { pct: 30, label: "Validating..." },
        { pct: 50, label: "Processing..." },
        { pct: 70, label: "Confirming..." },
        { pct: 88, label: "Finalizing..." },
        { pct: 100, label: "Complete!" },
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < phases.length) {
          setPaymentProgress(phases[i].pct);
          setPaymentPhase(phases[i].label);
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => resolve(), 200);
        }
      }, 450);
    });
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
    // Step 2: Submit order — run animation and API call together, wait for both
    setSubmitting(true);
    setError(null);
    try {
      const [order] = await Promise.all([
        onCheckout({
          email: form.email,
          shippingAddress: {
            firstName: form.firstName,
            lastName: form.lastName,
            address: form.address,
            city: form.city,
            postcode: form.postcode,
            country: form.country,
          },
          paymentMethod,
        }),
        runPaymentAnimation(),
      ]);
      setTimeout(() => {
        navigate("/order-confirmation", { state: { order } });
      }, 300);
    } catch (err) {
      setPaymentProgress(0);
      setPaymentPhase("");
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

              {/* Payment method selector */}
              <div className="checkout-payment-methods">
                <button type="button" className={`checkout-payment-btn${paymentMethod === "card" ? " is-active" : ""}`} onClick={() => setPaymentMethod("card")}>
                  <CreditCard size={16} /> Card
                </button>
                <button type="button" className={`checkout-payment-btn${paymentMethod === "wallet" ? " is-active" : ""}`} onClick={() => setPaymentMethod("wallet")} disabled={walletBalance < total * 100}>
                  <Wallet size={16} /> Wallet
                  {walletBalance > 0 && <span className="checkout-payment-btn__balance">${(walletBalance / 100).toFixed(2)}</span>}
                </button>
              </div>
              {paymentMethod === "wallet" && walletBalance < total * 100 && (
                <div className="checkout-v2__error">Insufficient wallet balance. <Link to="/wallet">Add funds</Link></div>
              )}

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
              <button type="submit" className="checkout-v2__submit checkout-v2__submit--pay" disabled={submitting || (paymentMethod === "wallet" && walletBalance < total * 100)}>
                {submitting ? (
                  <span className="checkout-pay-loading">
                    <span className="checkout-pay-loading__bar" style={{ width: `${paymentProgress}%` }} />
                    <span className="checkout-pay-loading__text">
                      <Loader2 size={15} className="spin" />
                      {paymentPhase}
                    </span>
                    <span className="checkout-pay-loading__pct">{paymentProgress}%</span>
                  </span>
                ) : (
                  <><ShieldCheck size={16} /> <span>{paymentMethod === "wallet" ? "Pay with Wallet" : "Complete Purchase"} · ${total.toFixed(2)}</span></>
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
