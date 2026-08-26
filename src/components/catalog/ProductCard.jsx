import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { RecordArt } from "./RecordArt";

export function ProductCard({ product, onAdd, wishlist }) {
  const [hover, setHover] = useState(false);
  const wished = wishlist?.has(product.id);

  return (
    <article
      className={`product-card${hover ? " is-hovered" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Ribbon badges */}
      <div className="product-card__ribbons">
        {product.isNew && <span className="ribbon ribbon--new">New</span>}
        {product.isBestseller && <span className="ribbon ribbon--hot">Bestseller</span>}
        {product.isPreorder && <span className="ribbon ribbon--pre">Pre-order</span>}
      </div>

      {/* Wishlist button */}
      {wishlist && (
        <button
          className={`card-wishlist-btn${wished ? " is-saved" : ""}`}
          onClick={(e) => { e.preventDefault(); wishlist.toggle(product.id); }}
          aria-label={wished ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
        >
          <Heart size={15} fill={wished ? "currentColor" : "none"} />
        </button>
      )}

      {/* Artwork */}
      <Link to={`/products/${product.id}`} className="product-card__art-link" tabIndex={-1} aria-hidden="true">
        <div className="product-card__art">
          <RecordArt palette={product.palette} spinning={hover} artworkUrl={product.artworkUrl} />
        </div>
      </Link>

      {/* Info */}
      <div className="product-card__body">
        <div className="product-card__meta-row">
          <span className="badge badge--genre">{product.genre}</span>
          <span className="badge badge--format">{product.format}</span>
          <span className="product-card__year">{product.year}</span>
        </div>

        <Link className="product-card__title" to={`/products/${product.id}`}>
          {product.title}
        </Link>
        <p className="product-card__artist">{product.artist}</p>

        <div className="product-card__footer">
          <p className="product-card__price">${product.price}</p>
          <button
            className={`card-add-btn${hover ? " is-visible" : ""}`}
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingBag size={13} />
            Add to crate
          </button>
        </div>
      </div>
    </article>
  );
}
