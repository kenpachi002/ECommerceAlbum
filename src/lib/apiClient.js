const API_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("groove-auth-token");
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(
      response.ok
        ? "The API returned an invalid response."
        : `API request failed (${response.status}). Check that the endpoint exists and the server is running.`
    );
  }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function queryParams(params) {
  return new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
}

export const apiClient = {
    // Products
  getProducts: (params = {}) => request(`/products?${queryParams(params)}`),
  getProduct: (productId) => request(`/products/${productId}`),
  itunesSearch: (query) => request(`/search/itunes?q=${encodeURIComponent(query)}`),

    // Orders
  createOrder: (order) => request("/orders", { method: "POST", body: JSON.stringify(order) }),
  getOrders: () => request("/orders/my"),
  payOrder: (orderId) => request(`/orders/${orderId}/pay`, { method: "POST" }),
  getOrder: (orderId) => request(`/orders/${orderId}`),
  cancelOrder: (orderId) => request(`/orders/${orderId}/cancel`, { method: "PATCH" }),

  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  updateProfile: (data) => request("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  // Wallet
  getWallet: () => request("/wallet"),
  depositWallet: (amountCents) => request("/wallet/deposit", { method: "POST", body: JSON.stringify({ amountCents }) }),

  // Admin
  getAdminStats: () => request("/admin/stats"),
  listUsers: () => request("/admin/users"),
  updateUser: (userId, data) => request(`/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(data) }),
  listOrders: () => request("/admin/orders"),
  updateOrderStatus: (orderId, status, deliveryDueAt) => request(`/admin/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status, deliveryDueAt }) }),
  listProducts: () => request("/admin/products"),
  updateProductStock: (productId, stockQuantity) => request(`/admin/products/${productId}/stock`, { method: "PATCH", body: JSON.stringify({ stockQuantity }) }),
};
