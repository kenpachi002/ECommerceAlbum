import React, { useState } from "react";
import { Users, Package, DollarSign, AlertCircle, ChevronDown, ChevronUp, Search, Edit2, Check, X } from "lucide-react";

export function OrdersTab({ orders, onStatusChange }) {
  const [expanded, setExpanded] = useState(null);
  const [dueDates, setDueDates] = useState({});
  const [savingDueDate, setSavingDueDate] = useState(null);
  const [savedDueDate, setSavedDueDate] = useState(null);

  const dueDateValue = (order) => dueDates[order.id] ?? (order.deliveryDueAt ? new Date(order.deliveryDueAt).toISOString().slice(0, 10) : "");

  const saveDueDate = async (order) => {
    setSavingDueDate(order.id);
    setSavedDueDate(null);
    try {
      await onStatusChange(order.id, order.status, dueDateValue(order) || null);
      setSavedDueDate(order.id);
    } finally {
      setSavingDueDate(null);
    }
  };

  return (
    <div className="admin-orders">
      <div className="admin-toolbar"><span className="admin-count">{orders.length} orders</span></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="admin-order-row">
                  <td>{order.orderNumber}</td>
                  <td>{order.email}</td>
                  <td>
                    <select className={`admin-status-select admin-status-select--${order.status}`} value={order.status} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onStatusChange(order.id, e.target.value); }}>
                      <option value="pending">Pending</option><option value="paid">Paid</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>${(order.total ?? 0).toFixed(2)}</td>
                  <td className="admin-date">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>{expanded === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                </tr>
                {expanded === order.id && (
                  <tr><td colSpan={6} className="admin-order-items">
                    <div className="admin-order-items__controls">
                      <label className="admin-due-date-field">Delivery due
                        <input
                          type="date"
                          value={dueDateValue(order)}
                          onChange={(event) => { setDueDates((current) => ({ ...current, [order.id]: event.target.value })); setSavedDueDate(null); }}
                        />
                      </label>
                      <button className="admin-save-date" type="button" onClick={() => saveDueDate(order)} disabled={savingDueDate === order.id}>
                        {savingDueDate === order.id ? "Saving..." : savedDueDate === order.id ? "Saved" : "Save date"}
                      </button>
                    </div>
                    {order.items?.map((item, i) => (<span key={i} className="admin-order-chip">{item.albumTitle} × {item.quantity}</span>))}
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProductsTab({ products, onStockChange }) {
  const [search, setSearch] = useState("");
  const [editingStock, setEditingStock] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const filtered = products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.artist.toLowerCase().includes(search.toLowerCase()));
  const startEdit = (product) => { setEditingStock(product.variantId); setStockInput(String(product.stockQuantity)); };
  const saveStock = (variantId) => { const qty = parseInt(stockInput, 10); if (!isNaN(qty) && qty >= 0) onStockChange(variantId, qty); setEditingStock(null); };
  return (
    <div className="admin-products">
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={15} /><input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <span className="admin-count">{filtered.length} items</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Format</th><th>Price</th><th>Stock</th></tr></thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.variantId}>
                <td>
                  <div className="admin-product-cell"><span className="admin-product__title">{product.title}</span><span className="admin-product__artist">{product.artist}</span></div>
                </td>
                <td><span className="badge badge--format">{product.format}</span></td>
                <td>${(product.priceCents / 100).toFixed(2)}</td>
                <td>
                  {editingStock === product.variantId ? (
                    <div className="admin-stock-edit">
                      <input type="number" min="0" value={stockInput} onChange={(e) => setStockInput(e.target.value)} autoFocus />
                      <button className="admin-icon-btn" onClick={() => saveStock(product.variantId)}><Check size={14} /></button>
                      <button className="admin-icon-btn" onClick={() => setEditingStock(null)}><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="admin-stock"><span className={product.stockQuantity <= 3 ? "admin-stock--low" : ""}>{product.stockQuantity}</span><button className="admin-icon-btn" onClick={() => startEdit(product)}><Edit2 size={13} /></button></div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatsTab({ stats }) {
  if (!stats) return null;
  const cards = [
    { label: "Total Users", value: stats.totalUsers ?? 0, icon: Users, color: "violet" },
    { label: "Total Orders", value: stats.totalOrders ?? 0, icon: Package, color: "teal" },
    { label: "Revenue", value: `$${(stats.revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "gold" },
    { label: "Low Stock Items", value: stats.lowStock ?? 0, icon: AlertCircle, color: "rose" },
  ];
  return (
    <div className="admin-stats">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`admin-stat-card admin-stat-card--${card.color}`}>
            <div className="admin-stat-card__icon"><Icon size={20} /></div>
            <div className="admin-stat-card__body">
              <span className="admin-stat-card__value">{card.value}</span>
              <span className="admin-stat-card__label">{card.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function UsersTab({ users, onRoleChange, onBalanceChange }) {
  const [search, setSearch] = useState("");
  const [editingBalance, setEditingBalance] = useState(null);
  const [balanceInput, setBalanceInput] = useState("");
  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || "").toLowerCase().includes(search.toLowerCase())
  );
  const startEdit = (user) => { setEditingBalance(user.id); setBalanceInput((user.balanceCents / 100).toFixed(2)); };
  const saveBalance = (userId) => {
    const cents = Math.round(parseFloat(balanceInput) * 100);
    if (!isNaN(cents) && cents >= 0) onBalanceChange(userId, cents);
    setEditingBalance(null);
  };
  return (
    <div className="admin-users">
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={15} /><input type="text" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <span className="admin-count">{filtered.length} users</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>User</th><th>Role</th><th>Balance</th><th>Joined</th></tr></thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user__avatar">{(user.displayName || user.email).charAt(0).toUpperCase()}</span>
                    <div><span className="admin-user__name">{user.displayName || "—"}</span><span className="admin-user__email">{user.email}</span></div>
                  </div>
                </td>
                <td><select className={`admin-role-select admin-role-select--${user.role}`} value={user.role} onChange={(e) => onRoleChange(user.id, e.target.value)}><option value="customer">Customer</option><option value="admin">Admin</option></select></td>
                <td>
                  {editingBalance === user.id ? (
                    <div className="admin-balance-edit">
                      <input type="number" step="0.01" min="0" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} autoFocus />
                      <button className="admin-icon-btn" onClick={() => saveBalance(user.id)}><Check size={14} /></button>
                      <button className="admin-icon-btn" onClick={() => setEditingBalance(null)}><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="admin-balance"><span>${(user.balanceCents / 100).toFixed(2)}</span><button className="admin-icon-btn" onClick={() => startEdit(user)}><Edit2 size={13} /></button></div>
                  )}
                </td>
                <td className="admin-date">{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
