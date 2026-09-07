import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Route, Routes, Link, Navigate, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CartDrawer } from "../components/cart/CartDrawer";
import { useCart } from "../features/cart/useCart";
import { useWishlist } from "../features/wishlist/useWishlist";
import CatalogPage from "../pages/CatalogPage";
import ProductPage from "../pages/ProductPage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import WishlistPage from "../pages/WishlistPage";
import ArtistPage from "../pages/ArtistPage";
import AuthPage from "../pages/AuthPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrdersPage from "../pages/OrdersPage";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import AdminPage from "../pages/AdminPage";
import ProfilePage from "../pages/ProfilePage";
import WalletPage from "../pages/WalletPage";
import { apiClient } from "../lib/apiClient";
import "../styles/globals.css";
import "../styles/components.css";

// ── Route Guards ──────────────────────────────────────────────────────────────

/** Redirects to /login if not authenticated. Shows nothing while auth is loading. */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null; // wait for auth check before redirecting
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/** Redirects already-logged-in users away from login/register pages. */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

/** Only allows admin users. Redirects to home if not admin. */
function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }));
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);
  return null;
}

function StoreShell() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [format, setFormat] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState(null);

  const cart = useCart();
  const wishlist = useWishlist();

  const addToCart = useCallback((product) => {
    cart.addItem(product);
    setCartOpen(true);
  }, [cart]);

  const handleCheckout = useCallback(async (customerData) => {
    try {
      const order = await apiClient.createOrder({
        customer: { email: customerData.email },
        shippingAddress: customerData.shippingAddress,
        paymentMethod: customerData.paymentMethod,
        items: cart.items.map(item => ({ variantId: item.variantId, quantity: item.qty })),
      });
      // Clear cart
      [...cart.items].forEach(item => cart.remove(item.id));
      setCartOpen(false);
      setCheckoutOrder(order);
      return order;
    } catch (err) {
      throw err;
    }
  }, [cart]);

  return (
    <div className="store">
      {/* Aurora animated background */}
      <div className="aurora-bg" aria-hidden="true">
        <span className="aurora-blob" />
      </div>

      <Header
        cartCount={cart.count}
        wishlistCount={wishlist.ids.length}
        onCartOpen={() => setCartOpen(true)}
        search={search}
        onSearchChange={setSearch}
      />

      <main id="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <CatalogPage
                  search={search}
                  genre={genre}
                  format={format}
                  onGenreChange={setGenre}
                  onFormatChange={setFormat}
                  onAdd={addToCart}
                  wishlist={wishlist}
                />
              }
            />
            <Route path="/products/:productId" element={<ProductPage onAdd={addToCart} wishlist={wishlist} />} />

            {/* Protected: must be logged in */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage cart={cart} onCheckout={handleCheckout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <ProtectedRoute>
                  <OrderConfirmationPage order={checkoutOrder} />
                </ProtectedRoute>
              }
            />

            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} onAdd={addToCart} />} />
            <Route path="/artists/:artistId" element={<ArtistPage onAdd={addToCart} wishlist={wishlist} />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Guest only: redirect to / if already logged in */}
            <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/reset-password" element={<AuthPage />} />

            {/* Admin only */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* Profile — logged in users */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Wallet — logged in users */}
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </main>

      <Footer />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        total={cart.total}
        onIncrease={cart.increase}
        onDecrease={cart.decrease}
        onRemove={cart.remove}
        onClearAll={() => [...cart.items].forEach(i => cart.remove(i.id))}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <StoreShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
