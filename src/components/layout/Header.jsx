import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, Menu, X } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

export function Header({ cartCount, wishlistCount, onCartOpen, search, onSearchChange }) {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard shortcut "/" to open search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape") { setSearchOpen(false); setNavOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const closeSearch = () => { setSearchOpen(false); onSearchChange(""); };
  const toggleNav = () => setNavOpen((o) => !o);

  return (
    <>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`} role="banner">
        <div className="container site-header__inner">
          {/* Brand */}
          <div className="header-brand">
            <button className="icon-button mobile-menu-btn" onClick={toggleNav} aria-label="Toggle navigation" aria-expanded={navOpen}>
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link className="brand" to="/" onClick={() => setNavOpen(false)}>
              Groove <span className="brand-amp">&</span> Co.
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="nav-links-desktop" aria-label="Main navigation">
            <a href="/#catalog" className="nav-link">Catalog</a>
            <a href="/#catalog" className="nav-link">New Arrivals</a>
            <Link to="/wishlist" className="nav-link">
              Wishlist
              {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
            </Link>
            {/* My Orders — only when logged in, sits naturally beside Wishlist */}
            {user && (
              <Link to="/orders" className="nav-link">My Orders</Link>
            )}
          </nav>

          {/* Actions */}
          <div className="header-actions">
            {user ? (
              <button className="nav-link header-logout-btn" onClick={() => { logout(); navigate("/"); }}>
                Log out
              </button>
            ) : (
              <Link to="/login" className="nav-link auth-link">Log in</Link>
            )}
            <button
              className={`icon-button search-trigger${searchOpen ? " is-active" : ""}`}
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search (press / to open)"
              title="Search (press /)"
            >
              <Search size={19} />
            </button>
            <Link to="/wishlist" className="icon-button wishlist-btn" aria-label={`Wishlist (${wishlistCount} items)`}>
              <Heart size={19} />
              {wishlistCount > 0 && <span className="header-badge">{wishlistCount}</span>}
            </Link>
            <button className="icon-button cart-btn" onClick={onCartOpen} aria-label={`Open cart (${cartCount} items)`}>
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="header-badge cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="search-bar container" role="search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search records, artists, genres…"
              aria-label="Search the catalog"
            />
            {search && (
              <span className="search-hint">{/* result count shown in catalog */}</span>
            )}
            <button className="icon-button" onClick={closeSearch} aria-label="Close search">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Mobile Nav Drawer */}
        {navOpen && (
          <nav className="mobile-nav glass" aria-label="Mobile navigation">
            <a href="/#catalog" className="mobile-nav__link" onClick={() => setNavOpen(false)}>Catalog</a>
            <a href="/#catalog" className="mobile-nav__link" onClick={() => setNavOpen(false)}>New Arrivals</a>
            <Link to="/wishlist" className="mobile-nav__link" onClick={() => setNavOpen(false)}>
              Wishlist
              {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
            </Link>
            {user && (
              <Link to="/orders" className="mobile-nav__link" onClick={() => setNavOpen(false)}>My Orders</Link>
            )}
            <div className="filter-divider" style={{ margin: "var(--sp-2) 0", background: "var(--color-hairline)" }} />
            {user ? (
              <button
                className="mobile-nav__link header-logout-btn"
                style={{ textAlign: "left", width: "100%" }}
                onClick={() => { logout(); setNavOpen(false); navigate("/"); }}
              >
                Log out
              </button>
            ) : (
              <Link to="/login" className="mobile-nav__link" onClick={() => setNavOpen(false)}>Log in</Link>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
