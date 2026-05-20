import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Switch,
  Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "../services/api";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Button, Toast, ScreenHeader, EmptyState, ConfirmModal } from "../components/UI";
import { fmtCurrency } from "../utils";

const TYPE_META = {
  PERCENTAGE:   { label: "Porcentaje", icon: "percent-outline", color: COLORS.purple },
  FIXED_AMOUNT: { label: "Monto fijo",  icon: "cash-outline",    color: COLORS.success },
  HAPPY_HOUR:   { label: "Happy hour", icon: "time-outline",    color: COLORS.amber },
};

export default function PromotionsScreen() {
  const navigation = useNavigation();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMyPromotions();
      setPromos(Array.isArray(data) ? data : []);
    } catch {
      showToast("Error cargando promociones", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    try {
      const updated = await api.togglePromotion(id);
      setPromos(prev => prev.map(p => p.id === id ? updated : p));
    } catch {
      showToast("Error al cambiar estado", "error");
    }
  };

  const deletePromo = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.deletePromotion(id);
      setPromos(prev => prev.filter(p => p.id !== id));
      showToast("Promoción eliminada");
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const renderPromo = ({ item }) => {
    const meta = TYPE_META[item.type] || TYPE_META.PERCENTAGE;
    return (
      <View style={[styles.card, SHADOW.card]}>
        <View style={styles.cardRow}>
          <View style={[styles.typeIcon, { backgroundColor: meta.color + "18" }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.promoMeta}>
              {item.type === "PERCENTAGE" && `${item.discountPct}% descuento`}
              {item.type === "FIXED_AMOUNT" && `– ${fmtCurrency(item.discountAmount)}`}
              {item.type === "HAPPY_HOUR" && `${item.happyHourStart} – ${item.happyHourEnd} · ${item.discountPct}%`}
            </Text>
            {item.description ? <Text style={styles.promoDesc} numberOfLines={1}>{item.description}</Text> : null}
          </View>
          <View style={styles.actions}>
            <Switch
              value={item.active}
              onValueChange={() => toggle(item.id)}
              trackColor={{ false: COLORS.border, true: COLORS.amber }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
            <TouchableOpacity onPress={() => setDeleteTarget(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.statusBar, { backgroundColor: item.active ? COLORS.successLight : COLORS.cream }]}>
          <View style={[styles.statusDot, { backgroundColor: item.active ? COLORS.success : COLORS.muted }]} />
          <Text style={[styles.statusText, { color: item.active ? COLORS.success : COLORS.muted }]}>
            {item.active ? "Activa" : "Inactiva"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />
      <ConfirmModal
        visible={!!deleteTarget}
        title="¿Eliminar promoción?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={deletePromo}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <ScreenHeader
        title="Promociones"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <Ionicons name="pricetag-outline" size={40} color={COLORS.amber} />
          <Text style={styles.loadingText}>Cargando promociones…</Text>
        </View>
      ) : promos.length === 0 ? (
        <EmptyState
          emoji="🏷️"
          title="Sin promociones"
          subtitle="Crea descuentos y happy hours para atraer más clientes."
          action={() => setShowForm(true)}
          actionLabel="Crear promoción"
        />
      ) : (
        <FlatList
          data={promos}
          keyExtractor={p => p.id}
          renderItem={renderPromo}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <PromoFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={() => { setShowForm(false); load(); showToast("Promoción creada"); }}
        showToast={showToast}
      />
    </SafeAreaView>
  );
}

function PromoFormModal({ visible, onClose, onSave, showToast }) {
  const [form, setForm] = useState({ title: "", description: "", type: "PERCENTAGE", discountPct: "", discountAmount: "", happyHourStart: "", happyHourEnd: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return showToast("Título requerido", "error");
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        type: form.type,
        discountPct: parseFloat(form.discountPct) || 0,
        discountAmount: parseFloat(form.discountAmount) || 0,
        happyHourStart: form.happyHourStart,
        happyHourEnd: form.happyHourEnd,
      };
      await api.createPromotion(body);
      setForm({ title: "", description: "", type: "PERCENTAGE", discountPct: "", discountAmount: "", happyHourStart: "", happyHourEnd: "" });
      onSave();
    } catch (e) {
      showToast(e.message || "Error al crear", "error");
    } finally {
      setSaving(false);
    }
  };

  const TYPES = Object.entries(TYPE_META);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.brown} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nueva promoción</Text>
          <View style={{ width: 24 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <FieldInput label="Título" value={form.title} onChangeText={set("title")} placeholder="Ej: 20% en croissants" />
            <FieldInput label="Descripción" value={form.description} onChangeText={set("description")} placeholder="Opcional…" />

            <Text style={styles.fieldLabel}>Tipo de descuento</Text>
            {TYPES.map(([type, meta]) => (
              <TouchableOpacity key={type} onPress={set("type")(type)} style={[styles.typeRow, form.type === type && styles.typeRowActive]}>
                <View style={[styles.typeIconSm, { backgroundColor: meta.color + "18" }]}>
                  <Ionicons name={meta.icon} size={16} color={meta.color} />
                </View>
                <Text style={[styles.typeLabel, form.type === type && { color: COLORS.brown, fontWeight: "700" }]}>{meta.label}</Text>
                <View style={[styles.radioSm, form.type === type && styles.radioSmActive]}>
                  {form.type === type && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}

            {(form.type === "PERCENTAGE" || form.type === "HAPPY_HOUR") && (
              <FieldInput label="Porcentaje de descuento (%)" value={form.discountPct} onChangeText={set("discountPct")} keyboardType="numeric" placeholder="20" />
            )}
            {form.type === "FIXED_AMOUNT" && (
              <FieldInput label="Monto fijo (COP)" value={form.discountAmount} onChangeText={set("discountAmount")} keyboardType="numeric" placeholder="5000" />
            )}
            {form.type === "HAPPY_HOUR" && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FieldInput label="Desde" value={form.happyHourStart} onChangeText={set("happyHourStart")} placeholder="08:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldInput label="Hasta" value={form.happyHourEnd} onChangeText={set("happyHourEnd")} placeholder="10:00" />
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={{ padding: 16 }}>
          <Button title="Crear promoción" icon="pricetag-outline" onPress={save} loading={saving} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        keyboardType={keyboardType || "default"}
        placeholderTextColor={COLORS.muted + "99"}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 15 },
  list: { padding: 16 },
  addBtn: { backgroundColor: COLORS.amber, width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },

  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginBottom: 12, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  typeIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  promoTitle: { fontSize: 15, fontWeight: "700", color: COLORS.brown },
  promoMeta: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  promoDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  actions: { gap: 10, alignItems: "center" },
  statusBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },

  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
  modalTitle: { fontSize: 17, fontWeight: "700", color: COLORS.brown },

  fieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.charcoal },

  typeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, marginBottom: 8 },
  typeRowActive: { borderColor: COLORS.amber, backgroundColor: COLORS.amberLight },
  typeIconSm: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  typeLabel: { flex: 1, fontSize: 14, color: COLORS.muted },
  radioSm: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioSmActive: { borderColor: COLORS.amber },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.amber },
});
