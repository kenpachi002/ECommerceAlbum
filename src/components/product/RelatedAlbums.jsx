import React from "react";
import { Link } from "react-router-dom";
import { PRODUCTS } from "../../data/mockProducts";
import { ProductCard } from "../catalog/ProductCard";

export function RelatedAlbums({ currentProductId, genre, artist, onAdd, wishlist }) {
  const related = PRODUCTS.filter(
    (p) =>
      p.id !== currentProductId &&
      (p.genre === genre || p.artist === artist)
  ).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="related-section">
      <div className="section-heading">
        <h2>More like this</h2>
        <Link className="button button--ghost" to="/">Browse all</Link>
      </div>
      <div className="related-grid">
        {related.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAdd}
            wishlist={wishlist}
          />
        ))}
      </div>
    </section>
  );
}
