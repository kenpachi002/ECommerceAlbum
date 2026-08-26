import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage({ order }) {
  const location = useLocation();
  const confirmedOrder = order || location.state?.order;

  return (
    <div className="container confirmation-page">
      <div className="confirmation-icon">
        <CheckCircle size={36} />
      </div>

      <h1>Order placed</h1>

      <p style={{ color: "var(--color-muted)", maxWidth: 380, lineHeight: 1.65 }}>
        Thank you. Your order has been received. In a real store you'd get a confirmation email — this is a demo, so you won't.
      </p>

      {confirmedOrder && (
        <div className="confirmation-order-num">
          Order number: <strong>#{confirmedOrder.orderId || confirmedOrder.id || "GRC-DEMO"}</strong>
        </div>
      )}

      <p style={{ color: "var(--color-subtle)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", marginTop: 8 }}>
        Demo mode — no payment processed · records not shipped
      </p>

      <Link className="button button--primary" to="/" style={{ marginTop: 8 }}>
        Back to catalog <ArrowRight size={15} />
      </Link>
    </div>
  );
}
