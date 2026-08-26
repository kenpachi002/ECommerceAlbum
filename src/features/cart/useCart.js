import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "groove-and-co-cart";

export function useCart() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...current, { ...product, qty: 1 }];
    });
  };

  const increase = (id) => setItems((current) => current.map((item) => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  const decrease = (id) => setItems((current) => current.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item));
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const count = items.reduce((total, item) => total + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return { items, count, total, addItem, increase, decrease, remove };
}
