import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { ARTISTS } from "../data/artists";
import { PRODUCTS } from "../data/mockProducts";
import { RecordArt } from "../components/catalog/RecordArt";
import { ProductCard } from "../components/catalog/ProductCard";
import { EmptyState } from "../components/ui/EmptyState";

export default function ArtistPage({ onAdd, wishlist }) {
  const { artistId } = useParams();

  // Find artist by ID slug
  const artist = Object.values(ARTISTS).find((a) => a.id === artistId);
  const albums = artist
    ? PRODUCTS.filter((p) => artist.albums.includes(p.id))
    : [];

  if (!artist) {
    return (
      <div className="container artist-page" style={{ paddingTop: 80, textAlign: "center" }}>
        <h1>Artist not found</h1>
        <Link className="button button--primary" to="/" style={{ marginTop: 24, display: "inline-flex" }}>
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container artist-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      {/* Artist header */}
      <div className="artist-header">
        {/* Avatar = stylised record art */}
        <div className="artist-avatar">
          <RecordArt palette={artist.palette} spinning />
        </div>

        <div className="artist-info">
          <h1>{artist.name}</h1>
          <div className="artist-meta">
            <div className="artist-meta-item">
              <span><MapPin size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Origin</span>
              <strong>{artist.origin}</strong>
            </div>
            <div className="artist-meta-item">
              <span><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Active</span>
              <strong>{artist.active}</strong>
            </div>
            <div className="artist-meta-item">
              <span>Pressings</span>
              <strong>{albums.length}</strong>
            </div>
          </div>
          <p className="artist-bio">{artist.bio}</p>
        </div>
      </div>

      {/* Discography */}
      <div className="section-heading">
        <h2>Discography</h2>
        <span>{albums.length} {albums.length === 1 ? "pressing" : "pressings"} in catalog</span>
      </div>

      {albums.length === 0 ? (
        <EmptyState title="No records yet" message="Check back soon." />
      ) : (
        <div className="product-grid">
          {albums.map((product) => (
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
