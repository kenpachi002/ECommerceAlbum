import React, { useState, useEffect } from "react";
import { Heart, Play, ArrowLeft, Maximize2, Share2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_TRACKLIST, TRACKLISTS } from "../data/tracklists";
import { PRODUCTS } from "../data/mockProducts";
import { RecordArt } from "../components/catalog/RecordArt";
import { ArtworkZoom } from "../components/product/ArtworkZoom";
import { RelatedAlbums } from "../components/product/RelatedAlbums";
import { SkeletonGrid } from "../components/ui/SkeletonCard";

const FORMAT_PRICES = { Vinyl: 0, CD: -4, Cassette: -2, Digital: -10 };

const deterministicPrice = (seed, min, max) => {
  const hash = Math.abs((seed * 2654435761) >>> 0);
  return min + (hash % (max - min + 1));
};

export default function ProductPage({ onAdd, wishlist }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);

  // Fetch from API, fall back to mock data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);

    fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setSelectedFormat(data.variants?.[0]?.format || "Vinyl");
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          if (productId.startsWith("IT-")) {
            const itunesId = parseInt(productId.replace("IT-", ""), 10);
            fetch(`https://itunes.apple.com/lookup?id=${itunesId}&entity=album`)
              .then(res => res.json())
              .then(data => {
                if (!cancelled) {
                  if (data.results && data.results.length > 0) {
                    const r = data.results[0];
                    const artworkUrl = r.artworkUrl100?.replace("100x100bb", "600x600bb") || null;
                    const year = r.releaseDate ? new Date(r.releaseDate).getFullYear() : null;
                    const priceCents = deterministicPrice(itunesId, 2200, 4200);
                    const mockProduct = {
                      id: productId,
                      title: r.collectionName,
                      artist: r.artistName,
                      genre: r.primaryGenreName || "Other",
                      format: "Vinyl",
                      year,
                      price: priceCents / 100,
                      palette: Math.abs(itunesId) % 12,
                      artworkUrl,
                      itunes_id: itunesId,
                      description: `${r.collectionName} by ${r.artistName}. ${r.primaryGenreName || "Music"}, ${year}.`,
                      variants: [{ format: "Vinyl", price: priceCents / 100, inStock: true, variantId: `${productId}-v1` }]
                    };
                    setProduct(mockProduct);
                    setSelectedFormat("Vinyl");
                  }
                  setLoading(false);
                }
              })
              .catch(() => {
                if (!cancelled) setLoading(false);
              });
            return;
          }

          // Fallback: find in mock data and synthesize variants
          const mock = PRODUCTS.find((p) => p.id === productId);
          if (mock) {
            const mockVariants = [
              { format: mock.format, price: mock.price, inStock: true, variantId: `${mock.id}-v1` },
            ];
            setProduct({ ...mock, variants: mockVariants });
            setSelectedFormat(mock.format);
          }
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [productId]);

  // Scroll to top on product change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [productId]);

  if (loading) {
    return (
      <section className="container product-page">
        <div style={{ marginBottom: "24px" }}>
          <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4 }} />
        </div>
        <div className="product-detail">
          <div className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[200, 320, 100, 80, 140].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: w, height: i === 1 ? 56 : 20, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container product-page">
        <h1 style={{ marginBottom: 24 }}>Pressing not found</h1>
        <Link className="button button--primary" to="/">← Back to catalog</Link>
      </section>
    );
  }

  const tracks = TRACKLISTS[product.id] || DEFAULT_TRACKLIST;
  const wished = wishlist.has(product.id);
  const selectedVariant = product.variants?.find((v) => v.format === selectedFormat) || product.variants?.[0];
  const displayPrice = selectedVariant?.price ?? product.price;
  const selectedProduct = {
    ...product,
    format: selectedVariant?.format ?? product.format,
    price: displayPrice,
    variantId: selectedVariant?.variantId,
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${product.title} — Groove & Co.`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isPreorder = product.isPreorder;
  const inStock = selectedVariant?.inStock ?? true;

  return (
    <section className="container product-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      <div className="product-detail">
        {/* Artwork column */}
        <div className="product-detail__art-wrapper">
          <div className="product-detail__art">
            <RecordArt palette={product.palette} spinning />
            <button className="artwork-zoom-btn" onClick={() => setZoomOpen(true)} aria-label="Zoom artwork">
              <Maximize2 size={13} /> Zoom
            </button>
          </div>
        </div>

        {/* Copy column */}
        <div className="product-detail__copy">
          {/* Top line: catalog number + wishlist/share */}
          <div className="product-detail__topline">
            <div className="product-detail__eyebrow">
              <span className="product-detail__catalog">{product.catalogNum || product.id} — {product.year}</span>
              <span className="product-detail__label-tag">
                Label: <span>{product.label || "Groove Recordings"}</span>
                {product.country && ` · ${product.country}`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="wishlist-button"
                onClick={() => wishlist.toggle(product.id)}
                aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                title={wished ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart size={18} fill={wished ? "currentColor" : "none"} />
              </button>
              <button
                className="wishlist-button"
                onClick={handleShare}
                aria-label="Share this album"
                title="Share"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <h1>{product.title}</h1>

          <div className="product-detail__artist-row">
            <Link
              className="product-detail__artist"
              to={`/artists/${product.artist?.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {product.artist}
            </Link>
            <span className="badge badge--genre">{product.genre}</span>
          </div>

          <p className="product-detail__description">
            {product.description ||
              "A carefully selected reissue from the Groove & Co. archive, pressed for listeners who still want the room to vibrate."}
          </p>

          {/* Format selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="format-section">
              <span className="format-section__label">Edition</span>
              <div className="format-picker">
                {product.variants.map((v) => {
                  const diff = v.price - (product.variants[0]?.price ?? v.price);
                  return (
                    <button
                      key={v.format}
                      className={`format-btn${v.format === selectedFormat ? " is-active" : ""}`}
                      onClick={() => setSelectedFormat(v.format)}
                    >
                      {v.format}
                      <small>
                        ${v.price}
                        {diff !== 0 && ` (${diff > 0 ? "+" : ""}${diff})`}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock indicator */}
          <div>
            {isPreorder ? (
              <span className="stock-badge stock-badge--pre">
                <span className="stock-dot" /> Pre-order
              </span>
            ) : inStock ? (
              <span className="stock-badge stock-badge--in">
                <span className="stock-dot" /> In stock
              </span>
            ) : (
              <span className="stock-badge stock-badge--out">
                <span className="stock-dot" /> Sold out
              </span>
            )}
          </div>

          {/* Purchase row */}
          <div className="product-detail__purchase">
            <div>
              <p className="product-detail__price">${displayPrice}</p>
              <p className="product-detail__price-sub">excl. shipping</p>
            </div>
            <button
              className="button button--primary"
              onClick={() => onAdd(selectedProduct)}
              disabled={!inStock && !isPreorder}
              style={{ flex: 1 }}
            >
              {isPreorder ? "Pre-order" : inStock ? "Add to crate" : "Sold out"}
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <section className="tracklist-section">
        <div className="section-heading">
          <h2>Tracklist</h2>
          <span>{tracks.length} tracks · preview clips coming soon</span>
        </div>
        {tracks.map((track, index) => (
          <div className="track-row" key={`${track.title}-${index}`}>
            <span className="track-row__num">{String(index + 1).padStart(2, "0")}</span>
            <button className="track-play" disabled aria-label={`Preview ${track.title} (not available)`} title="Audio preview coming soon">
              <Play size={10} />
            </button>
            <strong>{track.title}</strong>
            <time>{track.duration}</time>
          </div>
        ))}
      </section>

      {/* Related Albums */}
      <RelatedAlbums
        currentProductId={product.id}
        genre={product.genre}
        artist={product.artist}
        onAdd={onAdd}
        wishlist={wishlist}
      />

      {/* Artwork Zoom Lightbox */}
      {zoomOpen && (
        <ArtworkZoom palette={product.palette} onClose={() => setZoomOpen(false)} />
      )}
    </section>
  );
}
