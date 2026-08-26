import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Disc3, ArrowDown, Globe, Search, X } from "lucide-react";
import { RecordArt } from "../components/catalog/RecordArt";
import { ProductCard } from "../components/catalog/ProductCard";
import { SkeletonGrid } from "../components/ui/SkeletonCard";
import { EmptyState } from "../components/ui/EmptyState";
import { GENRES, FORMATS } from "../data/mockProducts";

const COLLECTIONS = ["All records", "New Arrivals", "Bestsellers", "Staff Picks"];
const STAFF_PICKS = ["GR-002", "GR-006", "GR-009"];

function matchesCollection(product, collection) {
  if (collection === "All records") return true;
  if (collection === "New Arrivals") return product.isNew;
  if (collection === "Bestsellers") return product.isBestseller;
  if (collection === "Staff Picks") return STAFF_PICKS.includes(product.id);
  return true;
}

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 12;

export default function CatalogPage({ search, genre, format, onGenreChange, onFormatChange, onAdd, wishlist }) {
  // ── DB catalog state ──────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [collection, setCollection] = useState("All records");
  const [genreCounts, setGenreCounts] = useState({});
  const [formatCounts, setFormatCounts] = useState({});

  // ── iTunes live search state ──────────────────────────────────────────────
  const [itunesResults, setItunesResults] = useState([]);
  const [itunesLoading, setItunesLoading] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();
  const debouncedSearch = useDebounce(normalizedSearch, 350);

  // ── Load from PostgreSQL (reset on filter/search change) ─────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProducts([]);
    setOffset(0);
    setHasMore(false);

    const params = new URLSearchParams();
    if (normalizedSearch) params.append("search", normalizedSearch);
    if (genre !== "All") params.append("genre", genre);
    if (format !== "All") params.append("format", format);
    params.append("limit", PAGE_SIZE);
    params.append("offset", "0");

    fetch(`/api/products?${params}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        if (!cancelled) {
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setHasMore(data.hasMore || false);
          setOffset(PAGE_SIZE);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setProducts([]); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [normalizedSearch, genre, format]);

  // ── Load more handler ─────────────────────────────────────────────────────
  async function loadMore() {
    setLoadingMore(true);
    const params = new URLSearchParams();
    if (normalizedSearch) params.append("search", normalizedSearch);
    if (genre !== "All") params.append("genre", genre);
    if (format !== "All") params.append("format", format);
    params.append("limit", PAGE_SIZE);
    params.append("offset", offset);
    try {
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(prev => [...prev, ...(data.products || [])]);
      setHasMore(data.hasMore || false);
      setOffset(o => o + PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Load filter counts (fetch all without pagination) ─────────────────
  useEffect(() => {
    fetch("/api/products?limit=100&offset=0")
      .then(r => r.json())
      .then(data => {
        const all = data.products || [];
        const gc = { All: data.total || all.length };
        const fc = { All: data.total || all.length };
        all.forEach(p => {
          gc[p.genre] = (gc[p.genre] || 0) + 1;
          fc[p.format] = (fc[p.format] || 0) + 1;
        });
        setGenreCounts(gc);
        setFormatCounts(fc);
      })
      .catch(() => {});
  }, []);

  // ── Live iTunes search (debounced, triggers when DB has < 3 results) ─────
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setItunesResults([]);
      return;
    }

    let cancelled = false;
    setItunesLoading(true);

    fetch(`/api/search/itunes?q=${encodeURIComponent(debouncedSearch)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setItunesResults(data.products || []);
          setItunesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setItunesResults([]); setItunesLoading(false); }
      });

    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const visibleProducts = products.filter(p => matchesCollection(p, collection));

  // All available genres/formats from DB results
  const allGenres = ["All", ...new Set(products.map(p => p.genre).filter(Boolean))];
  const displayGenres = GENRES.filter(g => g === "All" || allGenres.includes(g) || genreCounts[g]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      {!normalizedSearch && (
        <section className="hero container">
          <div className="hero-grid">
            <div>
              <div className="hero-kicker">
                <span className="hero-kicker-line" />
                <span className="eyebrow" style={{ margin: 0 }}>The World's Music — In One Catalog</span>
              </div>
              <h1>
                Pressed.<br />
                <em>Not streamed.</em>
              </h1>
              <p className="hero-copy">
                Browse our curated collection of iconic pressings or search across
                millions of albums — from Coltrane to Kendrick, rare folk to
                underground techno. Every record, found by ear.
              </p>
              <div className="hero-actions">
                <a className="button button--primary" href="#catalog">
                  Browse the catalog <ArrowDown size={15} />
                </a>
                <Link className="button button--secondary" to="/wishlist">
                  Your wishlist
                </Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <strong>{Object.values(genreCounts).reduce((a, b) => a + b, 0) || "∞"}</strong>
                  <span>Pressings</span>
                </div>
                <div className="hero-stat">
                  <strong>{Object.keys(genreCounts).filter(k => k !== "All").length || "—"}</strong>
                  <span>Genres</span>
                </div>
                <div className="hero-stat">
                  <strong>∞</strong>
                  <span>Searchable</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <RecordArt palette={0} spinning={true} />
            </div>
          </div>
        </section>
      )}

      {/* ── Catalog ──────────────────────────────────────────── */}
      <section className="catalog-section container" id="catalog">
        <div className="catalog-layout">
          {/* Sidebar Filters */}
          <aside className="catalog-sidebar" aria-label="Filter catalog">
            <div>
              <p className="catalog-sidebar__heading">Genre</p>
              <div className="filter-group">
                {GENRES.map(g => (
                  <button
                    key={g}
                    className={`filter-btn${genre === g ? " is-active" : ""}`}
                    onClick={() => onGenreChange(g)}
                  >
                    {g}
                    <span className="filter-count">
                      {genreCounts[g] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-divider" />
            <div>
              <p className="catalog-sidebar__heading">Format</p>
              <div className="filter-group">
                {FORMATS.map(f => (
                  <button
                    key={f}
                    className={`filter-btn${format === f ? " is-active" : ""}`}
                    onClick={() => onFormatChange(f)}
                  >
                    {f}
                    <span className="filter-count">
                      {formatCounts[f] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {(genre !== "All" || format !== "All") && (
              <>
                <div className="filter-divider" />
                <button
                  className="button button--ghost"
                  onClick={() => { onGenreChange("All"); onFormatChange("All"); }}
                >
                  Clear filters
                </button>
              </>
            )}

            {/* iTunes Live Search Hint */}
            {normalizedSearch && (
              <>
                <div className="filter-divider" />
                <div className="itunes-hint">
                  <Globe size={13} />
                  <span>
                    {itunesLoading
                      ? "Searching global catalog…"
                      : `${itunesResults.length} found in Apple Music`}
                  </span>
                </div>
              </>
            )}
          </aside>

          {/* Main Catalog */}
          <div className="catalog-main">
            <div className="catalog-toolbar">
              <div>
                <h2>{normalizedSearch ? `Results for "${search}"` : "The Catalog"}</h2>
                {!loading && (
                  <p className="catalog-count">
                    Showing {products.length} of {total} {total === 1 ? "pressing" : "pressings"}
                    {normalizedSearch && itunesResults.length > 0 && !itunesLoading &&
                      ` · ${itunesResults.length} in global archive`}
                  </p>
                )}
              </div>
              {!normalizedSearch && (
                <div className="collection-pills" role="tablist" aria-label="Collection filter">
                  {COLLECTIONS.map(c => (
                    <button
                      key={c}
                      role="tab"
                      aria-selected={collection === c}
                      className={`pill-btn${collection === c ? " is-active" : ""}`}
                      onClick={() => setCollection(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DB Catalog Results */}
            {loading ? (
              <SkeletonGrid count={8} />
            ) : products.length === 0 && !normalizedSearch ? (
              <EmptyState
                title="No pressings found"
                message="Try adjusting your filters."
              />
            ) : products.length > 0 ? (
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={onAdd}
                    wishlist={wishlist}
                  />
                ))}
              </div>
            ) : null}

            {/* Load More */}
            {hasMore && !loading && (
              <div style={{ textAlign: "center", padding: "var(--sp-8) 0" }}>
                <button
                  className="button button--secondary"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ minWidth: "180px" }}
                >
                  {loadingMore ? "Loading…" : `Load more · ${total - products.length} remaining`}
                </button>
              </div>
            )}

            {/* ── Global Archive (iTunes Live Results) ─────────────── */}
            {normalizedSearch && (
              <div className="itunes-section">
                <div className="itunes-section__header">
                  <div className="itunes-section__title">
                    <Globe size={16} />
                    <span>Global Archive</span>
                    <span className="itunes-section__sub">Powered by Apple Music · {itunesResults.length} results</span>
                  </div>
                  <p className="itunes-section__desc">
                    Every album ever released — search results from the world's largest music catalog.
                  </p>
                </div>

                {itunesLoading ? (
                  <SkeletonGrid count={4} />
                ) : itunesResults.length === 0 ? (
                  <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)", padding: "var(--sp-4) 0" }}>
                    No global results for this search.
                  </p>
                ) : (
                  <div className="product-grid">
                    {itunesResults.map((product) => (
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
            )}
          </div>
        </div>
      </section>
    </>
  );
}
