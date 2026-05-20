import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../services/api";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { fmtCurrency } from "../utils";
import { StatCard } from "../components/UI";

const W = Dimensions.get("window").width;

export default function StatsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getBakeryStats();
      setStats(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="bar-chart-outline" size={40} color={COLORS.amber} />
          <Text style={styles.loadingText}>Cargando datos…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxHour = stats ? Math.max(...Object.values(stats.ordersByHour || {}), 1) : 1;
  const hourEntries = Object.entries(stats?.ordersByHour || {}).sort();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />}
      >
        {/* Resumen general */}
        <Text style={styles.sectionLabel}>Resumen general</Text>
        <View style={styles.statGrid}>
          <StatCard label="Total órdenes" value={stats?.totalOrders ?? 0} icon="bag-handle-outline" color={COLORS.amber} />
          <StatCard label="Ingresos totales" value={fmtCurrency(stats?.totalRevenue)} icon="cash-outline" color={COLORS.success} />
        </View>
        <View style={[styles.statGrid, { marginTop: 10 }]}>
          <StatCard label="Ticket promedio" value={fmtCurrency(stats?.averageOrderValue)} icon="receipt-outline" color={COLORS.info} />
          <StatCard label="Hoy" value={fmtCurrency(stats?.revenueToday)} icon="today-outline" color={COLORS.purple} />
        </View>

        {/* Hoy / Semana */}
        <Text style={styles.sectionLabel}>Hoy vs. esta semana</Text>
        <View style={[styles.card, SHADOW.card]}>
          <Row icon="time-outline" label="Órdenes hoy" value={stats?.ordersToday} color={COLORS.amber} />
          <View style={styles.divider} />
          <Row icon="calendar-outline" label="Órdenes esta semana" value={stats?.ordersThisWeek} color={COLORS.info} />
          <View style={styles.divider} />
          <Row icon="trending-up-outline" label="Ingresos esta semana" value={fmtCurrency(stats?.revenueThisWeek)} color={COLORS.success} />
        </View>

        {/* Top productos */}
        {stats?.topProducts?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Top productos</Text>
            <View style={[styles.card, SHADOW.card]}>
              {stats.topProducts.map((p, i) => (
                <View key={i} style={[styles.topRow, i < stats.topProducts.length - 1 && styles.topBorder]}>
                  <Text style={styles.rank}>#{i + 1}</Text>
                  <Text style={styles.productEmoji}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={1}>{p.productName}</Text>
                    <Text style={styles.productQty}>{p.totalSold} vendidos</Text>
                  </View>
                  <Text style={styles.productRevenue}>{fmtCurrency(p.totalRevenue)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Gráfico por hora */}
        {hourEntries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Órdenes por hora</Text>
            <View style={[styles.card, SHADOW.card]}>
              <View style={styles.chart}>
                {hourEntries.map(([hour, count]) => (
                  <View key={hour} style={styles.barCol}>
                    <Text style={styles.barValue}>{count > 0 ? count : ""}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: Math.max(4, (count / maxHour) * 80) }]} />
                    </View>
                    <Text style={styles.barLabel}>{hour}h</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Estados */}
        {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Por estado</Text>
            <View style={[styles.card, SHADOW.card]}>
              {Object.entries(stats.ordersByStatus).map(([status, count], i, arr) => (
                <View key={status} style={[styles.statusRow, i < arr.length - 1 && styles.topBorder]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={styles.statusName}>{status}</Text>
                  <Text style={styles.statusCount}>{count}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value, color }) {
  return (
    <View style={styles.rowItem}>
      <View style={[styles.rowIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(s) {
  const map = { PENDING: COLORS.warning, CONFIRMED: COLORS.purple, BAKING: COLORS.info, READY: COLORS.success, COMPLETED: "#888", CANCELLED: COLORS.danger };
  return map[s] || COLORS.muted;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.brown },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 15 },
  content: { padding: 16, paddingBottom: 32 },

  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  statGrid: { flexDirection: "row", gap: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16 },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginVertical: 2 },

  rowItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowIcon: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: COLORS.charcoal },
  rowValue: { fontSize: 15, fontWeight: "700", color: COLORS.brown },

  topRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
  topBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  rank: { fontSize: 11, fontWeight: "700", color: COLORS.amber, minWidth: 20 },
  productEmoji: { fontSize: 24 },
  productName: { fontSize: 14, fontWeight: "600", color: COLORS.charcoal },
  productQty: { fontSize: 12, color: COLORS.muted },
  productRevenue: { fontSize: 14, fontWeight: "700", color: COLORS.brownMid },

  chart: { flexDirection: "row", alignItems: "flex-end", height: 110, gap: 4 },
  barCol: { flex: 1, alignItems: "center" },
  barValue: { fontSize: 9, color: COLORS.muted, marginBottom: 2, fontWeight: "600" },
  barTrack: { width: "100%", height: 80, justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: COLORS.amber, borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 9, color: COLORS.muted, marginTop: 4 },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusName: { flex: 1, fontSize: 14, color: COLORS.charcoal },
  statusCount: { fontSize: 16, fontWeight: "700", color: COLORS.brown },
});
