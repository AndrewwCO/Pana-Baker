import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ScrollView, TextInput, Alert, Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "../services/api";
import { COLORS, STATUS_META, RADIUS, SHADOW } from "../theme";
import { fmtCurrency, timeAgo } from "../utils";
import { Toast, Chip, EmptyState, ScreenHeader, StatusBadge } from "../components/UI";

const FILTERS = [
  { id: "active", label: "Activas" },
  { id: "PENDING", label: "Pendientes" },
  { id: "CONFIRMED", label: "Confirmadas" },
  { id: "BAKING", label: "Horneando" },
  { id: "READY", label: "Listas" },
  { id: "COMPLETED", label: "Completadas" },
];

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const intervalRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = filter === "active"
        ? await api.getActiveOrders()
        : await api.getAllOrders();
      const list = Array.isArray(data) ? data : [];
      const filtered = filter === "active" ? list :
        list.filter(o => o.status === filter);
      setOrders(filtered);
    } catch (e) {
      if (!silent) showToast("Error cargando órdenes", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), 30000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderOrder = ({ item }) => (
    <OrderCard
      order={item}
      onPress={() => navigation.navigate("OrderDetail", { order: item, onUpdate: load })}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Órdenes</Text>
          <Text style={styles.subtitle}>{orders.length} {filter === "active" ? "activas" : "en total"}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("QrScanner", { onSuccess: () => { showToast("¡Orden completada!"); load(); } })}
          style={styles.qrBtn}
        >
          <Ionicons name="qr-code-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <Ionicons name="restaurant-outline" size={40} color={COLORS.amber} />
          <Text style={styles.loadingText}>Cargando órdenes…</Text>
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          emoji="🍞"
          title="Sin órdenes"
          subtitle={filter === "active" ? "No hay órdenes activas en este momento." : "No hay órdenes con este filtro."}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress }) {
  const meta = STATUS_META[order.status] || STATUS_META.PENDING;
  const isPending = order.status === "PENDING";

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, SHADOW.card, isPending && styles.cardPending]} activeOpacity={0.88}>
      {isPending && <View style={styles.pendingBar} />}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={styles.clientName}>{order.userName}</Text>
            <StatusBadge meta={meta} />
          </View>
          <Text style={styles.cardMeta}>
            {order.items?.length} producto{order.items?.length !== 1 ? "s" : ""} · Pickup {order.pickupTime}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.total}>{fmtCurrency(order.total)}</Text>
          <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.itemChips}>
        {order.items?.slice(0, 3).map((item, i) => (
          <View key={i} style={styles.itemChip}>
            <Text style={styles.itemChipText}>{item.emoji} {item.name} ×{item.qty}</Text>
          </View>
        ))}
        {order.items?.length > 3 && (
          <Text style={styles.moreItems}>+{order.items.length - 3} más</Text>
        )}
      </View>

      {order.notes ? (
        <View style={styles.noteRow}>
          <Ionicons name="chatbubble-outline" size={12} color={COLORS.warning} />
          <Text style={styles.noteText} numberOfLines={1}>{order.notes}</Text>
        </View>
      ) : null}

      <Ionicons
        name="chevron-forward"
        size={16}
        color={COLORS.muted}
        style={{ position: "absolute", right: 16, bottom: 16 }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.brown },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  qrBtn: {
    backgroundColor: COLORS.amber,
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.button,
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 15 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardPending: { borderWidth: 1, borderColor: COLORS.amber + "40" },
  pendingBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.amber,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: "700", color: COLORS.brown },
  cardMeta: { fontSize: 13, color: COLORS.muted },
  total: { fontSize: 16, fontWeight: "700", color: COLORS.brownMid },
  timeAgo: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  itemChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  itemChip: { backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  itemChipText: { fontSize: 12, color: COLORS.muted },
  moreItems: { fontSize: 12, color: COLORS.muted, alignSelf: "center" },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: COLORS.warningLight, padding: 8, borderRadius: RADIUS.sm },
  noteText: { fontSize: 12, color: COLORS.warning, flex: 1 },
});
