import React from "react";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { RecordArt } from "../catalog/RecordArt";

export function CartDrawer({ open, onClose, items, total, onIncrease, onDecrease, onRemove, onClearAll }) {
  const FREE_SHIPPING_THRESHOLD = 50;
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className={`cart-drawer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="cart-drawer__backdrop" aria-label="Close cart" onClick={onClose} />

      <aside className="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Shopping cart">
        {/* Header */}
        <div className="cart-drawer__header">
          <div>
            <p className="cart-drawer__title">Your crate</p>
            {itemCount > 0 && (
              <span className="cart-drawer__count">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {items.length > 0 && (
              <button className="button button--ghost button--clear" onClick={onClearAll} aria-label="Clear all items">
                Clear all
              </button>
            )}
            <button className="icon-button" onClick={onClose} aria-label="Close cart">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <ShoppingBag size={40} className="cart-drawer__empty-icon" />
              <p>Your crate is empty.<br />Add a record to get started.</p>
              <button className="button button--outline" onClick={onClose}>
                Browse catalog
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item__art">
                  <RecordArt palette={item.palette} spinning={false} />
                </div>
                <div className="cart-item__details">
                  <p className="cart-item__title">{item.title}</p>
                  <p className="cart-item__artist">{item.artist}</p>
                  {item.format && (
                    <span className="cart-item__format">{item.format}</span>
                  )}
                  <div className="cart-item__controls">
                    <button
                      className="quantity-button"
                      onClick={() => onDecrease(item.id)}
                      aria-label={`Decrease quantity of ${item.title}`}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="cart-item__qty">{item.qty}</span>
                    <button
                      className="quantity-button"
                      onClick={() => onIncrease(item.id)}
                      aria-label={`Increase quantity of ${item.title}`}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      className="icon-button cart-item__remove"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="cart-item__price">${(item.price * item.qty).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            {toFreeShipping > 0 ? (
              <p className="cart-drawer__shipping-note">
                Add ${toFreeShipping.toFixed(2)} more for free shipping
              </p>
            ) : (
              <p className="cart-drawer__shipping-note">✓ You qualify for free shipping</p>
            )}
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <div className="cart-drawer__actions">
              <Link
                to="/checkout"
                className="button button--checkout"
                onClick={onClose}
              >
                Proceed to checkout
              </Link>
            </div>
            <p style={{ textAlign: "center", color: "var(--color-subtle)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", margin: 0 }}>
              Demo mode · no payment processing
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
