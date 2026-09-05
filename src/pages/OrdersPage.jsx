import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package, ArrowLeft, ChevronDown, ChevronUp,
  Clock, CheckCircle, Truck, XCircle, AlertCircle, Loader2,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

const STATUS_META = {
  pending:    { label: "Pending",    icon: Clock,        color: "var(--color-gold)",   bg: "rgba(227,168,59,0.1)"  },
  paid:       { label: "Paid",       icon: CheckCircle,  color: "var(--aurora-teal)",  bg: "rgba(45,212,191,0.1)"  },
  processing: { label: "Processing", icon: Loader2,      color: "var(--aurora-violet)", bg: "rgba(123,79,219,0.1)" },
  shipped:    { label: "Shipped",    icon: Truck,        color: "var(--aurora-teal)",  bg: "rgba(45,212,191,0.1)"  },
  delivered:  { label: "Delivered",  icon: CheckCircle,  color: "var(--aurora-teal)",  bg: "rgba(45,212,191,0.1)"  },
  cancelled:  { label: "Cancelled",  icon: XCircle,      color: "var(--color-danger)", bg: "rgba(248,113,113,0.1)" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className="orders-status" style={{ color: meta.color, background: meta.bg }}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function OrderCard({ order, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const canCancel = ["pending", "paid"].includes(order.status);
  const addr = order.shipping_address;

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order ${order.order_number}? This will restore stock and cannot be undone.`)) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await onCancel(order.id);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="orders-card">
      {/* Card Header */}
      <div className="orders-card__header" onClick={() => setExpanded((v) => !v)}>
        <div className="orders-card__meta">
          <span className="orders-card__number">{order.order_number}</span>
          <span className="orders-card__date">
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        </div>
        <div className="orders-card__right">
          <StatusBadge status={order.status} />
          <span className="orders-card__total">${order.total.toFixed(2)}</span>
          <button className="orders-card__toggle" aria-label="Expand order">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="orders-card__body">
          {/* Items */}
          <div className="orders-card__items">
            {order.items.map((item) => (
              <div className="orders-card__item" key={item.id}>
                <div className="orders-card__item-info">
                  <p className="orders-card__item-title">{item.albumTitle}</p>
                  <p className="orders-card__item-meta">{item.format} · Qty {item.quantity}</p>
                </div>
                <span className="orders-card__item-price">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="orders-card__divider" />

          {/* Shipping address */}
          {addr && (
            <div className="orders-card__address">
              <p className="orders-card__address-label">Ships to</p>
              <p className="orders-card__address-text">
                {addr.firstName} {addr.lastName}<br />
                {addr.address}, {addr.city} {addr.postcode}<br />
                {addr.country}
              </p>
            </div>
          )}

          {/* Totals */}
          <div className="orders-card__totals">
            <div className="orders-card__total-line">
              <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="orders-card__total-line">
              <span>Shipping</span>
              <span>{order.total - order.subtotal === 0 ? "Free" : `$${(order.total - order.subtotal).toFixed(2)}`}</span>
            </div>
            <div className="orders-card__total-line orders-card__total-line--bold">
              <span>Total</span><span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Cancel */}
          {cancelError && <p className="orders-card__cancel-error">{cancelError}</p>}
          {canCancel && (
            <button
              className="orders-card__cancel-btn"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
              {cancelling ? "Cancelling…" : "Cancel order"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/my", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load orders");
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = useCallback(async (orderId) => {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Cancellation failed");
    // Update local state optimistically
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
    );
  }, [getToken]);

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-page__header">
        <Link className="orders-page__back" to="/">
          <ArrowLeft size={15} /> Back to catalog
        </Link>
        <h1 className="orders-page__title">My Orders</h1>
        <p className="orders-page__sub">Your complete order history and billing records.</p>
      </div>

      {/* States */}
      {loading && (
        <div className="orders-page__loading">
          <Loader2 size={36} className="spin" />
          <p>Loading your orders…</p>
        </div>
      )}

      {!loading && error && (
        <div className="orders-page__error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-page__empty">
          <Package size={56} strokeWidth={1} />
          <h2>No orders yet</h2>
          <p>When you place your first order, it'll appear here.</p>
          <Link className="button button--primary" to="/">Browse catalog</Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-page__list">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
