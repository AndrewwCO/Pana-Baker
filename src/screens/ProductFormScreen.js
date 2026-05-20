import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../services/api";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Button, ScreenHeader, Toast } from "../components/UI";

const EMOJIS = ["🍞", "🥖", "🥐", "🥨", "🧁", "🎂", "🍰", "🍩", "🍪", "🥧", "🧆", "🫓", "🥯", "🍮", "🧇"];
const CATEGORIES = ["bread", "pastelería", "galletas", "bebidas", "otro"];
const STATUSES = [
  { value: "READY_NOW", label: "Listo ahora" },
  { value: "READY_IN_20", label: "Listo en ~20 min" },
  { value: "READY_IN_60", label: "Listo en ~1 hora" },
  { value: "ADVANCE_ORDER_ONLY", label: "Solo con anticipación" },
  { value: "OUT_OF_STOCK", label: "Sin stock" },
];

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = route.params || {};

  const [form, setForm] = useState({
    name: product?.name || "",
    price: product?.price?.toString() || "",
    emoji: product?.emoji || "🍞",
    category: product?.category || "bread",
    description: product?.description || "",
    stock: product?.stock?.toString() || "0",
    availabilityStatus: product?.availabilityStatus || "READY_NOW",
    advanceMinutes: product?.advanceMinutes?.toString() || "0",
    imageUrl: product?.imageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setLocalImage(result.assets[0].uri);
  };

  const save = async () => {
    if (!form.name.trim()) return showToast("El nombre es requerido", "error");
    if (!form.price || isNaN(parseFloat(form.price))) return showToast("Precio inválido", "error");

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        emoji: form.emoji,
        category: form.category,
        description: form.description.trim(),
        availabilityStatus: form.availabilityStatus,
        advanceMinutes: parseInt(form.advanceMinutes) || 0,
      };
      console.log("STOCK:", form.stock, parseInt(form.stock));

      let savedProduct;
      if (product) {
        savedProduct = await api.updateProduct(product.id, body);
        await api.updateStock(product.id, parseInt(form.stock) || 0);
      } else {
        savedProduct = await api.createProduct({
          ...body,
          stock: parseInt(form.stock) || 0,
          available: parseInt(form.stock) > 0,
        });
        console.log("SAVED:", JSON.stringify(savedProduct));
        await api.updateStock(savedProduct.id, parseInt(form.stock) || 0);
      }

      // Upload image if selected
      if (localImage && savedProduct?.id) {
        setUploading(true);
        try {
          await api.uploadProductImage(savedProduct.id, localImage);
        } catch {
          showToast("Producto guardado, pero falló la imagen", "warning");
        } finally {
          setUploading(false);
        }
      }

      navigation.goBack();
    } catch (e) {
      showToast(e.message || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }

  };

  const imageSource = localImage || (form.imageUrl ? { uri: form.imageUrl } : null);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />
      <ScreenHeader
        title={product ? "Editar producto" : "Nuevo producto"}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Image picker */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {imageSource ? (
              <Image source={typeof imageSource === "string" ? { uri: imageSource } : imageSource} style={styles.imagePreview} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color={COLORS.muted} />
                <Text style={styles.imageHint}>Foto del producto</Text>
              </>
            )}
            <View style={styles.imageEditBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Emoji picker */}
          <Text style={styles.label}>Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => set("emoji")(e)}
                style={[styles.emojiBtn, form.emoji === e && styles.emojiBtnActive]}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Field label="Nombre del producto" value={form.name} onChangeText={set("name")} placeholder="Pan de masa madre" />
          <Field label="Descripción" value={form.description} onChangeText={set("description")} placeholder="Opcional…" multiline />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Precio (COP)" value={form.price} onChangeText={set("price")} placeholder="12000" keyboardType="numeric" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field label="Stock" value={form.stock} onChangeText={set("stock")} placeholder="0" keyboardType="numeric" />
            </View>
          </View>

          {/* Category */}
          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} onPress={() => set("category")(c)}
                style={[styles.catBtn, form.category === c && styles.catBtnActive]}>
                <Text style={[styles.catText, form.category === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Availability */}
          <Text style={styles.label}>Disponibilidad</Text>
          {STATUSES.map(s => (
            <TouchableOpacity key={s.value} onPress={() => set("availabilityStatus")(s.value)}
              style={[styles.radioRow, form.availabilityStatus === s.value && styles.radioRowActive]}>
              <View style={[styles.radio, form.availabilityStatus === s.value && styles.radioActive]}>
                {form.availabilityStatus === s.value && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, form.availabilityStatus === s.value && styles.radioLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}

          {form.availabilityStatus === "ADVANCE_ORDER_ONLY" && (
            <Field label="Minutos de anticipación" value={form.advanceMinutes} onChangeText={set("advanceMinutes")} keyboardType="numeric" />
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={saving ? "Guardando…" : uploading ? "Subiendo imagen…" : product ? "Guardar cambios" : "Crear producto"}
          icon={product ? "checkmark-circle-outline" : "add-circle-outline"}
          onPress={save}
          loading={saving || uploading}
        />
      </View>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        placeholderTextColor={COLORS.muted + "99"}
        style={[styles.input, multiline && { height: 72, textAlignVertical: "top" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 20, paddingBottom: 8 },

  imagePicker: {
    width: 100, height: 100, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cream, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 24, overflow: "visible",
  },
  imagePreview: { width: 100, height: 100, borderRadius: RADIUS.lg },
  imageHint: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
  imageEditBadge: {
    position: "absolute", bottom: -6, right: -6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.amber, alignItems: "center", justifyContent: "center",
  },

  label: { fontSize: 12, fontWeight: "700", color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.charcoal,
  },
  row: { flexDirection: "row" },

  emojiScroll: { marginBottom: 18 },
  emojiBtn: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  emojiBtnActive: { borderColor: COLORS.amber, backgroundColor: COLORS.amberLight },
  emojiText: { fontSize: 24 },

  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  catBtnActive: { backgroundColor: COLORS.amber, borderColor: COLORS.amber },
  catText: { fontSize: 13, color: COLORS.muted, fontWeight: "500" },
  catTextActive: { color: "#fff", fontWeight: "700" },

  radioRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white, marginBottom: 8,
  },
  radioRowActive: { borderColor: COLORS.amber, backgroundColor: COLORS.amberLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: COLORS.amber },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.amber },
  radioLabel: { fontSize: 14, color: COLORS.muted },
  radioLabelActive: { color: COLORS.brown, fontWeight: "600" },

  footer: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border },
});