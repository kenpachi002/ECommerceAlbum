const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { "Content-Type": "application/json", ...options.headers }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const apiClient = {
  getProducts: (params = {}) => request(`/products?${new URLSearchParams(params)}`),
  getProduct: (productId) => request(`/products/${productId}`),
  createOrder: (order) => request("/orders", { method: "POST", body: JSON.stringify(order) }),
};
