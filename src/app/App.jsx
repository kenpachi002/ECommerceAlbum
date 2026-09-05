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
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
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
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { email: customerData.email },
          shippingAddress: customerData.shippingAddress,
          items: cart.items.map(item => ({ variantId: item.variantId, quantity: item.qty })),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Order failed");
      }
      const order = await response.json();
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

            {/* Guest only: redirect to / if already logged in */}
            <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/reset-password" element={<AuthPage />} />

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
        <StoreShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
