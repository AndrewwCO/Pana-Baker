export function fmtCurrency(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n || 0);
}

export function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short" });
}

export function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function truncate(str, n = 30) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}
