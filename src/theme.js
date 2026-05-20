export const COLORS = {
  cream: "#FDF6EC",
  warm: "#F5E6CC",
  amber: "#D4850A",
  amberLight: "#FEF3E2",
  brown: "#4A2C0A",
  brownMid: "#7A4820",
  charcoal: "#2C2416",
  muted: "#8B7355",
  surface: "#FFFDF8",
  border: "rgba(74,44,10,0.12)",
  white: "#FFFFFF",

  success: "#2D7A3A",
  successLight: "#EAF5EB",
  danger: "#C0392B",
  dangerLight: "#FDECEA",
  warning: "#A0620A",
  warningLight: "#FEF3E2",
  info: "#1A6FA0",
  infoLight: "#E8F4FB",
  purple: "#6B48C8",
  purpleLight: "#F0ECFC",
};

export const STATUS_META = {
  PENDING: {
    label: "Pendiente",
    bg: "#FEF3E2",
    fg: "#A0620A",
    icon: "time-outline",
    next: "CONFIRMED",
    nextLabel: "Confirmar orden",
  },
  CONFIRMED: {
    label: "Confirmado",
    bg: "#F0ECFC",
    fg: "#6B48C8",
    icon: "checkmark-circle-outline",
    next: "BAKING",
    nextLabel: "Empezar a hornear",
  },
  BAKING: {
    label: "Horneando",
    bg: "#E8F4FB",
    fg: "#1A6FA0",
    icon: "flame-outline",
    next: "READY",
    nextLabel: "Marcar como listo",
  },
  READY: {
    label: "Listo ✓",
    bg: "#EAF5EB",
    fg: "#2D7A3A",
    icon: "cube-outline",
    next: null,
    nextLabel: null,
  },
  COMPLETED: {
    label: "Completado",
    bg: "#F4F4F4",
    fg: "#666666",
    icon: "checkmark-done-circle-outline",
    next: null,
    nextLabel: null,
  },
  CANCELLED: {
    label: "Cancelado",
    bg: "#FDECEA",
    fg: "#C0392B",
    icon: "close-circle-outline",
    next: null,
    nextLabel: null,
  },
};

export const FONTS = {
  regular: { fontFamily: "System", fontWeight: "400" },
  medium: { fontFamily: "System", fontWeight: "500" },
  semibold: { fontFamily: "System", fontWeight: "600" },
  bold: { fontFamily: "System", fontWeight: "700" },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: "#4A2C0A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: "#D4850A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};
