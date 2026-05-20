import * as SecureStore from "expo-secure-store";

const API_BASE = "http://10.0.2.2:8080/api/v1"; // 👈 Cambia esto

class ApiService {
  token = null;
  userName = "Baker";

  setToken(token) { this.token = token; }
  setUserName(name) { this.userName = name; }

  async call(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        "X-User-Name": this.userName,
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401) throw new Error("NO_AUTH");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.data ?? data;
  }

  // ── Bakery ───────────────────────────────────────
  getBakery()           { return this.call("/bakeries/me"); }
  updateBakery(body)    { return this.call("/bakeries/me", { method: "PATCH", body }); }
  toggleOpen(isOpen)    { return this.call("/bakeries/me/open", { method: "PATCH", body: { isOpen } }); }

  // ── Orders ───────────────────────────────────────
  getActiveOrders()     { return this.call("/orders/bakery/active"); }
  getAllOrders(page = 1) { return this.call(`/orders/bakery?page=${page}&pageSize=100`); }
  getPendingOrders()    { return this.call("/orders/bakery/pending"); }
  updateOrderStatus(id, status) { return this.call(`/orders/${id}/status`, { method: "PATCH", body: { status } }); }
  verifyQr(qrCode)      { return this.call("/orders/verify-qr", { method: "POST", body: { qrCode } }); }
  setEstimatedReady(id, estimatedReadyAt) {
    return this.call(`/orders/${id}/estimated-ready`, { method: "PATCH", body: { estimatedReadyAt } });
  }

  // ── Products ─────────────────────────────────────
  getMyProducts()           { return this.call("/products/my"); }
  createProduct(body)       { return this.call("/products", { method: "POST", body }); }
  updateProduct(id, body)   { return this.call(`/products/${id}`, { method: "PATCH", body }); }
  updateStock(id, stock)    { return this.call(`/products/${id}/stock`, { method: "PATCH", body: { stock } }); }
  deleteProduct(id)         { return this.call(`/products/${id}`, { method: "DELETE" }); }
  seedProducts()            { return this.call("/products/seed", { method: "POST" }); }

  // ── Stats ────────────────────────────────────────
  getBakeryStats()          { return this.call("/stats/bakery"); }

  // ── Promotions ───────────────────────────────────
  getMyPromotions()         { return this.call("/promotions/me"); }
  createPromotion(body)     { return this.call("/promotions", { method: "POST", body }); }
  togglePromotion(id)       { return this.call(`/promotions/${id}/toggle`, { method: "PATCH" }); }
  deletePromotion(id)       { return this.call(`/promotions/${id}`, { method: "DELETE" }); }

  // ── Reviews ──────────────────────────────────────
  getReviews(bakeryId)      { return this.call(`/reviews?bakeryId=${bakeryId}`); }

  // ── Upload ───────────────────────────────────────
  async uploadImage(uri, endpoint) {
    const formData = new FormData();
    const filename = uri.split("/").pop();
    const ext = filename.split(".").pop();
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    formData.append("image", { uri, name: filename, type });

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    return data.data ?? data;
  }

  uploadProductImage(productId, uri) {
    return this.uploadImage(uri, `/upload/product/${productId}`);
  }
  uploadBakeryLogo(uri) {
    return this.uploadImage(uri, "/upload/bakery/logo");
  }
  uploadBakeryBanner(uri) {
    return this.uploadImage(uri, "/upload/bakery/banner");
  }
}

export const api = new ApiService();
