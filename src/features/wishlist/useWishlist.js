import { useEffect, useState } from "react";

const WISHLIST_STORAGE_KEY = "groove-and-co-wishlist";

export function useWishlist() {
  const [ids, setIds] = useState(() => JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]"));

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const toggle = (productId) => setIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  return { ids, toggle, has: (productId) => ids.includes(productId) };
}
