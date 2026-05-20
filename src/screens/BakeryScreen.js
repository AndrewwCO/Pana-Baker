import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Image, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Button, Toast, ConfirmModal, ScreenHeader } from "../components/UI";

export default function BakeryScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [bakery, setBakery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const STATUS_LABEL = { ACTIVE: "Activa", INACTIVE: "Inactiva", SUSPENDED: "Suspendida" };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBakery();
      setBakery(data);
      setForm({
        name: data.name || "",
        description: data.description || "",
        phone: data.phone || "",
        address: data.address || "",
        openTime: data.openTime || "07:00",
        closeTime: data.closeTime || "14:00",
      });
    } catch {
      showToast("Error cargando datos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateBakery(form);
      setBakery(updated);
      setEditing(false);
      showToast("Panadería actualizada");
    } catch (e) {
      showToast(e.message || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async () => {
    setToggling(true);
    try {
      const updated = await api.toggleOpen(!bakery.isOpen);
      setBakery(updated);
    } catch (e) {
      showToast(e.message || "Fuera del horario configurado", "error");
    } finally {
      setToggling(false);
    }
  };

  const pickAndUpload = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "logo" ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      const uploader = type === "logo" ? api.uploadBakeryLogo : api.uploadBakeryBanner;
      const updated = await uploader.call(api, result.assets[0].uri);
      setBakery(updated);
      showToast("Imagen actualizada");
    } catch {
      showToast("Error al subir imagen", "error");
    }
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi panadería</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="storefront-outline" size={40} color={COLORS.amber} />
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />
      <ConfirmModal
        visible={logoutModal}
        title="¿Cerrar sesión?"
        message="Tendrás que iniciar sesión nuevamente para acceder al panel."
        confirmLabel="Cerrar sesión"
        onConfirm={logout}
        onCancel={() => setLogoutModal(false)}
        danger
      />

      <View style={styles.header}>
        <Text style={styles.title}>Mi panadería</Text>
        <TouchableOpacity onPress={() => setLogoutModal(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Banner + Logo */}
          <TouchableOpacity onPress={() => pickAndUpload("banner")} style={styles.bannerWrap}>
            {bakery?.bannerUrl ? (
              <Image source={{ uri: bakery.bannerUrl }} style={styles.banner} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons name="image-outline" size={28} color={COLORS.muted} />
                <Text style={styles.placeholderText}>Banner</Text>
              </View>
            )}
            <View style={styles.bannerEdit}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => pickAndUpload("logo")} style={styles.logoWrap}>
            {bakery?.logoUrl ? (
              <Image source={{ uri: bakery.logoUrl }} style={styles.logo} />
            ) : (
              <Text style={styles.logoEmoji}>🍞</Text>
            )}
            <View style={styles.logoEdit}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Open/Close toggle */}
          <View style={[styles.card, SHADOW.card, styles.openCard]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.openStatus, { color: bakery?.isOpen ? COLORS.success : COLORS.danger }]}>
                {bakery?.isOpen ? "● Abierta ahora" : "● Cerrada"}
              </Text>
              <Text style={styles.openHours}>{bakery?.openTime} – {bakery?.closeTime}</Text>
            </View>
            <Switch
              value={bakery?.isOpen || false}
              onValueChange={toggle}
              disabled={toggling}
              trackColor={{ false: COLORS.border, true: COLORS.amber }}
              thumbColor="#fff"
            />
          </View>

          {/* Rating */}
          <View style={[styles.card, SHADOW.card, styles.ratingCard]}>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.ratingNum}>{bakery?.rating?.toFixed(1) || "—"}</Text>
              <Text style={styles.ratingLabel}>Calificación</Text>
            </View>
            <View style={styles.ratingDivider} />
            <View style={{ alignItems: "center" }}>
              <Text style={styles.ratingNum}>{bakery?.totalReviews || 0}</Text>
              <Text style={styles.ratingLabel}>Reseñas</Text>
            </View>
            <View style={styles.ratingDivider} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={styles.ratingNum}>{STATUS_LABEL[bakery?.status] || bakery?.status}</Text>
              <Text style={styles.ratingLabel}>Estado</Text>
            </View>
          </View>

          {/* Datos / Formulario */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Información</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={styles.editBtn}>{editing ? "Cancelar" : "Editar"}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={[styles.card, SHADOW.card]}>
              {[
                ["Nombre", "name", "default"],
                ["Descripción", "description", "default"],
                ["Teléfono", "phone", "phone-pad"],
                ["Dirección", "address", "default"],
                ["Hora apertura", "openTime", "default"],
                ["Hora cierre", "closeTime", "default"],
              ].map(([label, key, kb]) => (
                <View key={key} style={{ marginBottom: 14 }}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    value={form[key]}
                    onChangeText={set(key)}
                    keyboardType={kb}
                    placeholderTextColor={COLORS.muted}
                    style={styles.input}
                  />
                </View>
              ))}
              <Button title="Guardar cambios" onPress={save} loading={saving} icon="checkmark-circle-outline" />
            </View>
          ) : (
            <View style={[styles.card, SHADOW.card]}>
              {[
                ["Nombre", bakery?.name],
                ["Descripción", bakery?.description || "—"],
                ["Teléfono", bakery?.phone || "—"],
                ["Dirección", bakery?.address],
              ].filter(([, v]) => v).map(([label, value], i, arr) => (
                <View key={label} style={[styles.infoRow, i < arr.length - 1 && styles.infoBorder]}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Promociones shortcut */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Promotions")}
            style={[styles.shortcutCard, SHADOW.card]}
          >
            <View style={styles.shortcutIcon}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Promociones y descuentos</Text>
              <Text style={styles.shortcutSub}>Gestiona tus happy hours y cupones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.brown },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 15 },
  content: { paddingBottom: 32 },

  bannerWrap: { height: 140, backgroundColor: COLORS.warm, position: "relative" },
  banner: { width: "100%", height: 140 },
  bannerPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  placeholderText: { fontSize: 13, color: COLORS.muted },
  bannerEdit: {
    position: "absolute", right: 12, bottom: 12,
    backgroundColor: COLORS.amber, width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },

  logoWrap: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    marginLeft: 20, marginTop: -36, ...SHADOW.card,
  },
  logo: { width: 72, height: 72, borderRadius: RADIUS.lg },
  logoEmoji: { fontSize: 36 },
  logoEdit: {
    position: "absolute", right: -4, bottom: -4,
    backgroundColor: COLORS.amber, width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },

  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginHorizontal: 16, marginBottom: 12 },
  openCard: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  openStatus: { fontSize: 16, fontWeight: "700" },
  openHours: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  ratingCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  ratingNum: { fontSize: 20, fontWeight: "700", color: COLORS.brown },
  ratingLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  ratingDivider: { width: 0.5, height: 40, backgroundColor: COLORS.border },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 10, marginTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  editBtn: { fontSize: 14, color: COLORS.amber, fontWeight: "600" },

  fieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.charcoal, marginBottom: 4 },

  infoRow: { paddingVertical: 12 },
  infoBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 11, fontWeight: "700", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 15, color: COLORS.charcoal },

  shortcutCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  shortcutIcon: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.amberLight, alignItems: "center", justifyContent: "center" },
  shortcutTitle: { fontSize: 15, fontWeight: "700", color: COLORS.brown },
  shortcutSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
