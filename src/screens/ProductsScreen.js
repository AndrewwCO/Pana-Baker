import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { api } from "../services/api";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { fmtCurrency } from "../utils";
import { Toast, EmptyState, Button, ConfirmModal } from "../components/UI";

const AVAIL_LABEL = {
  READY_NOW: { label: "Listo ahora", color: COLORS.success },
  READY_IN_20: { label: "~20 minutos", color: COLORS.info },
  READY_IN_60: { label: "~1 hora", color: COLORS.warning },
  ADVANCE_ORDER_ONLY: { label: "Solo anticipado", color: COLORS.purple },
  OUT_OF_STOCK: { label: "Sin stock", color: COLORS.danger },
};

// Normaliza un producto del backend: si falta available, lo calcula con stock
function normalize(p) {
  return {
    ...p,
    available: p.available !== undefined ? p.available : (p.stock ?? 0) > 0,
    availabilityStatus: p.availabilityStatus || "READY_NOW",
  };
}

export default function ProductsScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMyProducts();
      const list = (Array.isArray(data) ? data : []).map(normalize);
      setProducts(list);
    } catch {
      showToast("Error cargando productos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const updateStock = async (id, stock) => {
    const safeStock = Math.max(0, Number(stock ?? 0));
    try {
      await api.updateStock(id, safeStock);
      setProducts(prev =>
        prev.map(p => p.id === id ? {
          ...p,
          stock: safeStock,
          available: safeStock > 0,
          availabilityStatus: safeStock > 0 && p.availabilityStatus === "OUT_OF_STOCK"
            ? "READY_NOW"
            : p.availabilityStatus,
        } : p)
      );
    } catch {
      showToast("Error al actualizar stock", "error");
    }
  };

  const confirmDelete = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Producto eliminado");
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const handleSeed = async () => {
    try {
      await api.seedProducts();
      load();
      showToast("Productos de prueba cargados");
    } catch {
      showToast("Error al cargar productos", "error");
    }
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onEdit={() => navigation.navigate("ProductForm", { product: item })}
      onDelete={() => setDeleteTarget(item.id)}
      onStockChange={(s) => updateStock(item.id, s)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />
      <ConfirmModal
        visible={!!deleteTarget}
        title="¿Eliminar producto?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>{products.length} productos</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("ProductForm", {})}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Ionicons name="cafe-outline" size={40} color={COLORS.amber} />
          <Text style={styles.loadingText}>Cargando productos…</Text>
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          emoji="🥐"
          title="Sin productos"
          subtitle="Crea tu primer producto o carga algunos de prueba para empezar."
          action={handleSeed}
          actionLabel="Cargar productos de prueba"
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function ProductCard({ product, onEdit, onDelete, onStockChange }) {
  const avail = AVAIL_LABEL[product.availabilityStatus] || AVAIL_LABEL.READY_NOW;

  return (
    <View style={[styles.card, SHADOW.card]}>
      <View style={styles.cardRow}>
        <Text style={styles.emoji}>{product.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.price}>{fmtCurrency(product.price)}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.availTag, { backgroundColor: avail.color + "18" }]}>
              <Text style={[styles.availText, { color: avail.color }]}>{avail.label}</Text>
            </View>
            <View style={styles.catTag}>
              <Text style={styles.catText}>{product.category}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={17} color={COLORS.brownMid} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, styles.iconBtnDanger]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stockRow}>
        <View style={styles.stockIndicator}>
          <View style={[styles.stockDot, { backgroundColor: product.available ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.stockStatus}>{product.available ? "Disponible" : "Sin stock"}</Text>
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => onStockChange(Math.max(0, Number(product.stock || 0) - 1))}
            style={styles.stepBtn}
          >
            <Ionicons name="remove" size={18} color={COLORS.brownMid} />
          </TouchableOpacity>
          <Text style={styles.stockNum}>{product.stock}</Text>
          <TouchableOpacity
            onPress={() => onStockChange(Number(product.stock || 0) + 1)}
            style={styles.stepBtn}
          >
            <Ionicons name="add" size={18} color={COLORS.brownMid} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  addBtn: {
    backgroundColor: COLORS.amber,
    width: 42, height: 42,
    borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
    ...SHADOW.button,
  },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 15 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  emoji: { fontSize: 38, lineHeight: 46 },
  productName: { fontSize: 16, fontWeight: "700", color: COLORS.brown, marginBottom: 2 },
  price: { fontSize: 15, fontWeight: "600", color: COLORS.amber, marginBottom: 6 },
  tagRow: { flexDirection: "row", gap: 6 },
  availTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  availText: { fontSize: 11, fontWeight: "700" },
  catTag: { backgroundColor: COLORS.cream, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  catText: { fontSize: 11, color: COLORS.muted, fontWeight: "500" },
  actions: { gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cream,
    alignItems: "center", justifyContent: "center",
  },
  iconBtnDanger: { backgroundColor: COLORS.dangerLight },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  stockIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockStatus: { fontSize: 13, color: COLORS.muted, fontWeight: "500" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stockNum: { fontSize: 15, fontWeight: "700", color: COLORS.brown, minWidth: 28, textAlign: "center" },
});