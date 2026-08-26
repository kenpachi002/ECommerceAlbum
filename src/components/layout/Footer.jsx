import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, Mail, ArrowRight } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container footer-grid">
        {/* Brand + Newsletter */}
        <div className="footer-brand-col">
          <div className="footer-logo">
            <Disc3 size={22} className="footer-logo__icon" />
            <span className="brand">Groove <span className="brand-amp">&</span> Co.</span>
          </div>
          <p className="footer-tagline">
            Pressed. Not streamed.<br />
            Reissued LPs chosen by ear, not by algorithm.
          </p>

          <div className="footer-newsletter">
            <p className="footer-section-heading">Join the mailing list</p>
            <p className="footer-newsletter__sub">One email a month. New reissues, restock notices, nothing else.</p>
            {submitted ? (
              <p className="footer-newsletter__thanks">✓ You're on the list.</p>
            ) : (
              <form className="newsletter-form" onSubmit={handleSubmit}>
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <div className="newsletter-form__inner">
                  <Mail size={15} className="newsletter-form__icon" />
                  <input
                    id="footer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button type="submit" className="button button--primary">
                  Sign up <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Shop links */}
        <div className="footer-links-col">
          <p className="footer-section-heading">Shop</p>
          <ul>
            <li><a href="/#catalog">All Records</a></li>
            <li><a href="/#catalog">New Arrivals</a></li>
            <li><a href="/#catalog">Bestsellers</a></li>
            <li><a href="/#catalog">Staff Picks</a></li>
            <li><Link to="/wishlist">Your Wishlist</Link></li>
          </ul>
        </div>

        {/* Label links */}
        <div className="footer-links-col">
          <p className="footer-section-heading">Label</p>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Pressing Partners</a></li>
            <li><a href="#">Submission Guidelines</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Info */}
        <div className="footer-links-col">
          <p className="footer-section-heading">Info</p>
          <ul>
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">Grading System</a></li>
            <li><a href="#">Frequently Asked</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <p className="copyright">
          © {new Date().getFullYear()} Groove &amp; Co. — Catalog no. GRC-001
        </p>
        <p className="copyright">
          All pressings selected by ear. Prices exclude shipping.
        </p>
      </div>
    </footer>
  );
}
