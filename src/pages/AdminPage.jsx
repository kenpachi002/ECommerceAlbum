import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users, Package, DollarSign, Disc3,
  ChevronDown, ChevronUp, Search, Edit2, Check, X,
  AlertCircle, Loader2, Shield, BarChart3,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { StatsTab, UsersTab, OrdersTab, ProductsTab } from "./AdminTabs";
import { apiClient } from "../lib/apiClient";

function AdminPage() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [inventoryComparison, setInventoryComparison] = useState(null);
  const [comparingInventory, setComparingInventory] = useState(false);
  const [syncingInventory, setSyncingInventory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, o, p, db] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.listUsers(),
        apiClient.listOrders(),
        apiClient.listProducts(),
        apiClient.getDatabaseStatus(),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setOrders(o.orders || []);
      setProducts(p.products || []);
      setDatabaseStatus(db);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const refreshStatus = async () => {
      try {
        setDatabaseStatus(await apiClient.getDatabaseStatus());
      } catch (err) {
        setError(err.message);
      }
    };
    const interval = setInterval(refreshStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCompareInventory = async () => {
    setComparingInventory(true);
    try {
      setInventoryComparison(await apiClient.compareLocalInventory());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setComparingInventory(false);
    }
  };

  const handleSyncInventory = async () => {
    const changes = inventoryComparison?.changes || [];
    if (!changes.length) return;
    const confirmed = window.confirm(
      `Update hosted stock for ${changes.length} matching variants using local values? Local-only and hosted-only variants will not be added or removed.`
    );
    if (!confirmed) return;

    setSyncingInventory(true);
    try {
      const result = await apiClient.syncLocalInventory(changes);
      setInventoryComparison(null);
      setError(null);
      await fetchData();
      window.alert(`Updated hosted stock for ${result.updated} variants.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingInventory(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiClient.updateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch { setError("Failed to update role"); }
  };

  const handleBalanceChange = async (userId, balanceCents) => {
    try {
      await apiClient.updateUser(userId, { balanceCents });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, balanceCents } : u));
    } catch { setError("Failed to update balance"); }
  };

  const handleOrderStatus = async (orderId, status, deliveryDueAt) => {
    try {
      const updated = await apiClient.updateOrderStatus(orderId, status, deliveryDueAt);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status, deliveryDueAt: updated.delivery_due_at } : o));
      return updated;
    } catch (error) { setError(error.message || "Failed to update order"); throw error; }
  };

  const handleStockChange = async (variantId, stock) => {
    try {
      await apiClient.updateProductStock(variantId, stock);
      setProducts((prev) => prev.map((p) => p.variantId === variantId ? { ...p, stockQuantity: stock } : p));
    } catch { setError("Failed to update stock"); }
  };

  const tabs = [
    { id: "stats", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "orders", label: "Orders", icon: Package },
    { id: "products", label: "Inventory", icon: Disc3 },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div className="admin-page__title-group">
          <Shield size={24} className="admin-page__shield" />
          <div>
            <h1 className="admin-page__title">Admin Dashboard</h1>
            <p className="admin-page__sub">Manage users, orders, and inventory</p>
          </div>
        </div>
        <Link className="admin-page__back" to="/">← Back to store</Link>
      </div>
      {databaseStatus?.source === "local" && (
        <div className="admin-db-banner admin-db-banner--local" role="status">
          <AlertCircle size={18} />
          <div>
            <strong>Using local PostgreSQL</strong>
            <span>Supabase is unavailable. Local changes, accounts, and orders are not automatically sent to the hosted database.</span>
          </div>
        </div>
      )}
      {databaseStatus?.source === "hosted" && (
        <div className="admin-db-banner admin-db-banner--hosted" role="status">
          <Shield size={18} />
          <div>
            <strong>Using hosted PostgreSQL</strong>
            <span>Admin changes are saved to the database used by the deployed store.</span>
          </div>
        </div>
      )}
      {databaseStatus?.source === "unavailable" && (
        <div className="admin-db-banner admin-db-banner--unavailable" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>No database connection</strong>
            <span>Neither the hosted database nor the configured local fallback is reachable.</span>
          </div>
        </div>
      )}
      {error && (
        <div className="admin-page__error">
          <AlertCircle size={18} /> {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      <div className="admin-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={`admin-tab${tab === t.id ? " is-active" : ""}`} onClick={() => setTab(t.id)}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="admin-page__loading"><Loader2 size={36} className="spin" /><p>Loading dashboard…</p></div>
      ) : (
        <div className="admin-content">
          {tab === "stats" && <StatsTab stats={stats} />}
          {tab === "users" && <UsersTab users={users} onRoleChange={handleRoleChange} onBalanceChange={handleBalanceChange} />}
          {tab === "orders" && <OrdersTab orders={orders} onStatusChange={handleOrderStatus} />}
          {tab === "products" && (
            <ProductsTab
              products={products}
              onStockChange={handleStockChange}
              databaseStatus={databaseStatus}
              inventoryComparison={inventoryComparison}
              comparingInventory={comparingInventory}
              syncingInventory={syncingInventory}
              onCompareInventory={handleCompareInventory}
              onSyncInventory={handleSyncInventory}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
