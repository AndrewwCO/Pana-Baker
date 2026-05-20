import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../services/api";
import { COLORS, STATUS_META, RADIUS, SHADOW } from "../theme";
import { fmtCurrency, fmtDate, timeAgo, fmtTime } from "../utils";
import { Button, ScreenHeader, StatusBadge, ConfirmModal, Toast } from "../components/UI";

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { order: initialOrder, onUpdate } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [toast, setToast] = useState(null);

  const meta = STATUS_META[order.status] || STATUS_META.PENDING;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const advance = async () => {
    const next = meta.next;
    if (!next) return;
    setLoading(true);
    try {
      const updated = await api.updateOrderStatus(order.id, next);
      setOrder(updated);
      showToast(`Orden → ${STATUS_META[next].label}`);
      onUpdate?.();
    } catch (e) {
      showToast(e.message || "Error al actualizar", "error");
    } finally {
      setLoading(false);
      onUpdate?.(); // ← mover aquí, siempre refresca la lista
    }
  };

  const cancel = async () => {
    setCancelModal(false);
    setLoading(true);
    try {
      const updated = await api.updateOrderStatus(order.id, "CANCELLED");
      setOrder(updated);
      showToast("Orden cancelada");
      onUpdate?.();
    } catch (e) {
      showToast(e.message || "Error al cancelar", "error");
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = !!meta.next;
  const canCancel = !["CANCELLED", "COMPLETED"].includes(order.status);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />
      <ConfirmModal
        visible={cancelModal}
        title="¿Cancelar orden?"
        message={`Se repondrá el stock de los ${order.items?.length} producto(s) y se notificará al cliente.`}
        confirmLabel="Sí, cancelar"
        onConfirm={cancel}
        onCancel={() => setCancelModal(false)}
        danger
      />

      <ScreenHeader
        title="Detalle de orden"
        onBack={() => navigation.goBack()}
        right={<StatusBadge meta={meta} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cliente */}
        <View style={[styles.card, SHADOW.card]}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{order.userName?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{order.userName}</Text>
              <Text style={styles.meta}>{fmtDate(order.createdAt)} · {timeAgo(order.createdAt)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.total}>{fmtCurrency(order.total)}</Text>
              {order.discountAmount > 0 && (
                <Text style={styles.discount}>– {fmtCurrency(order.discountAmount)}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoPills}>
            <InfoPill icon="time-outline" label={`Pickup ${order.pickupTime}`} />
            <InfoPill icon="card-outline" label={order.paymentMethod?.replace("_", " ") || "—"} />
            <InfoPill
              icon={order.paymentStatus === "APPROVED" ? "checkmark-circle" : "ellipse-outline"}
              label={order.paymentStatus === "APPROVED" ? "Pagado" : "Pago pendiente"}
              color={order.paymentStatus === "APPROVED" ? COLORS.success : COLORS.warning}
            />
          </View>
        </View>

        {/* Productos */}
        <View style={[styles.card, SHADOW.card]}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={[styles.itemRow, i < order.items.length - 1 && styles.itemBorder]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>×{item.qty}</Text>
              </View>
              <Text style={styles.itemPrice}>{fmtCurrency(item.price * item.qty)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmtCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Notas */}
        {order.notes ? (
          <View style={[styles.noteCard, SHADOW.card]}>
            <View style={styles.noteHeader}>
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.warning} />
              <Text style={styles.noteTitle}>Nota del cliente</Text>
            </View>
            <Text style={styles.noteText}>{order.notes}</Text>
          </View>
        ) : null}

        {/* Tiempo estimado */}
        {order.estimatedReadyAt && (
          <View style={[styles.estimatedCard, SHADOW.card]}>
            <Ionicons name="timer-outline" size={18} color={COLORS.info} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.estimatedLabel}>Tiempo estimado</Text>
              <Text style={styles.estimatedTime}>{fmtTime(order.estimatedReadyAt)}</Text>
            </View>
          </View>
        )}

        {/* QR */}
        <View style={[styles.qrCard, SHADOW.card]}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.brownMid} />
          <Text style={styles.qrCode} numberOfLines={1}>{order.qrCode}</Text>
        </View>
      </ScrollView>

      {/* Acciones */}
      {(canAdvance || canCancel) && (
        <View style={styles.actions}>
          {canAdvance && (
            <Button
              title={meta.nextLabel}
              icon={STATUS_META[meta.next]?.icon}
              onPress={advance}
              loading={loading}
              style={{ marginBottom: canCancel ? 10 : 0 }}
            />
          )}
          {canCancel && (
            <Button
              title="Cancelar orden"
              onPress={() => setCancelModal(true)}
              variant="danger"
              icon="close-circle-outline"
              disabled={loading}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoPill({ icon, label, color }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color={color || COLORS.muted} />
      <Text style={[styles.pillText, color && { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 8 },

  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.amberLight,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: COLORS.amber },
  clientName: { fontSize: 17, fontWeight: "700", color: COLORS.brown },
  meta: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  total: { fontSize: 20, fontWeight: "700", color: COLORS.brownMid },
  discount: { fontSize: 12, color: COLORS.success, marginTop: 2 },
  infoPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  pillText: { fontSize: 12, color: COLORS.muted, fontWeight: "500" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.brown, marginBottom: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  emoji: { fontSize: 28, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: "600", color: COLORS.charcoal },
  itemQty: { fontSize: 13, color: COLORS.muted },
  itemPrice: { fontSize: 15, fontWeight: "700", color: COLORS.brownMid },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 15, fontWeight: "700", color: COLORS.brown },
  totalValue: { fontSize: 18, fontWeight: "700", color: COLORS.amber },

  noteCard: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  noteTitle: { fontSize: 13, fontWeight: "700", color: COLORS.warning },
  noteText: { fontSize: 14, color: COLORS.charcoal, lineHeight: 20 },

  estimatedCard: { backgroundColor: COLORS.infoLight, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center" },
  estimatedLabel: { fontSize: 12, color: COLORS.info, fontWeight: "600" },
  estimatedTime: { fontSize: 18, fontWeight: "700", color: COLORS.info },

  qrCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  qrCode: { flex: 1, fontSize: 12, fontFamily: "monospace", color: COLORS.muted },

  actions: { padding: 16, paddingBottom: 4, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border },
});
