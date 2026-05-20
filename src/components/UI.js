import React from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "../theme";

// ── Toast ────────────────────────────────────────────────────
export function Toast({ message, type = "success", visible }) {
  if (!visible || !message) return null;
  const bg = type === "error" ? COLORS.danger : type === "warning" ? COLORS.warning : COLORS.brown;
  return (
    <View style={[styles.toast, { backgroundColor: bg }]}>
      <Ionicons
        name={type === "error" ? "alert-circle" : "checkmark-circle"}
        size={16} color="#fff" style={{ marginRight: 6 }}
      />
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────
export function Button({ title, onPress, loading, variant = "primary", icon, style, disabled }) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isGhost = variant === "ghost";

  const bg = isPrimary ? COLORS.amber : isDanger ? COLORS.dangerLight : "transparent";
  const fg = isPrimary ? "#fff" : isDanger ? COLORS.danger : COLORS.brownMid;
  const border = isGhost ? { borderWidth: 1, borderColor: COLORS.border } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: loading || disabled ? 0.65 : 1 },
        isPrimary && SHADOW.button,
        border,
        style,
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} />}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, SHADOW.card, style]} activeOpacity={0.88}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, SHADOW.card, style]}>{children}</View>;
}

// ── Status Badge ─────────────────────────────────────────────
export function StatusBadge({ status, meta }) {
  if (!meta) return null;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Ionicons name={meta.icon} size={11} color={meta.fg} style={{ marginRight: 3 }} />
      <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

// ── Section Header ───────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Empty State ──────────────────────────────────────────────
export function EmptyState({ emoji = "📭", title, subtitle, action, actionLabel }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <Button title={actionLabel} onPress={action} variant="ghost" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

// ── Screen Header ────────────────────────────────────────────
export function ScreenHeader({ title, subtitle, right, onBack }) {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.brown} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

// ── Confirm Modal ────────────────────────────────────────────
export function ConfirmModal({ visible, title, message, onConfirm, onCancel, confirmLabel = "Confirmar", danger }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>
          {message && <Text style={styles.modalMessage}>{message}</Text>}
          <View style={styles.modalActions}>
            <Button title="Cancelar" onPress={onCancel} variant="ghost" style={{ flex: 1, marginRight: 8 }} />
            <Button title={confirmLabel} onPress={onConfirm} variant={danger ? "danger" : "primary"} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Stat Card ────────────────────────────────────────────────
export function StatCard({ label, value, icon, color }) {
  return (
    <View style={[styles.statCard, SHADOW.card]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Chip ─────────────────────────────────────────────────────
export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    zIndex: 999,
    maxWidth: "85%",
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  btnText: { fontSize: 15, fontWeight: "700" },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.brown },
  sectionAction: { fontSize: 13, color: COLORS.amber, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.brown, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: COLORS.muted, textAlign: "center", marginTop: 8, lineHeight: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: { marginRight: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.brown },
  headerSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.brown, marginBottom: 8 },
  modalMessage: { fontSize: 14, color: COLORS.muted, lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: "row" },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: "flex-start",
  },
  statIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.brown, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "500" },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warm,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.amber },
  chipText: { fontSize: 13, fontWeight: "500", color: COLORS.brownMid },
  chipTextActive: { color: "#fff", fontWeight: "700" },
});
