import React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { PRODUCTS } from "../data/mockProducts";
import { ProductCard } from "../components/catalog/ProductCard";
import { EmptyState } from "../components/ui/EmptyState";

export default function WishlistPage({ wishlist, onAdd }) {
  const wishedProducts = PRODUCTS.filter((p) => wishlist.has(p.id));

  return (
    <div className="container wishlist-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--sp-8)" }}>
        <h1 style={{ margin: 0 }}>
          <Heart size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: 10, color: "var(--aurora-rose)" }} />
          Wishlist
        </h1>
        {wishedProducts.length > 0 && (
          <span style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            {wishedProducts.length} {wishedProducts.length === 1 ? "pressing" : "pressings"} saved
          </span>
        )}
      </div>

      {wishedProducts.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Hit the heart icon on any record to save it here."
          action={{ label: "Browse the catalog", href: "/" }}
        />
      ) : (
        <div className="product-grid">
          {wishedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              wishlist={wishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
