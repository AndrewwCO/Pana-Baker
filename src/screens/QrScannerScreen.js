import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../services/api";
import { COLORS, RADIUS } from "../theme";

export default function QrScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { onSuccess } = route.params || {};
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null); // null | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.surface }]} edges={["top", "bottom"]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={COLORS.brown} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={60} color={COLORS.amber} />
          <Text style={styles.permTitle}>Cámara requerida</Text>
          <Text style={styles.permSub}>Necesitamos acceso a la cámara para escanear el QR del cliente.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir acceso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleScan = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    try {
      await api.verifyQr(data.toUpperCase());
      setResult("success");
      onSuccess?.();
      setTimeout(() => navigation.goBack(), 1800);
    } catch (e) {
      setResult("error");
      setErrorMsg(e.message || "QR inválido o no corresponde a tu panadería");
      setTimeout(() => { setScanned(false); setResult(null); }, 2500);
    }
  };

  const scanY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.viewfinder}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Scan line */}
            {!result && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />
            )}
            {/* Result overlay */}
            {result === "success" && (
              <View style={styles.resultOverlay}>
                <Ionicons name="checkmark-circle" size={64} color="#fff" />
                <Text style={styles.resultText}>¡Completado!</Text>
              </View>
            )}
            {result === "error" && (
              <View style={[styles.resultOverlay, { backgroundColor: COLORS.danger + "CC" }]}>
                <Ionicons name="close-circle" size={64} color="#fff" />
                <Text style={styles.resultText}>{errorMsg}</Text>
              </View>
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.hint}>Apunta al código QR del cliente</Text>
        </View>
      </View>

      {/* Close button */}
      <SafeAreaView style={styles.closeWrap} edges={["top"]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const VF = 220;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  backBtn: { position: "absolute", top: 60, left: 20 },
  permTitle: { fontSize: 22, fontWeight: "700", color: COLORS.brown, textAlign: "center" },
  permSub: { fontSize: 15, color: COLORS.muted, textAlign: "center", lineHeight: 22 },
  permBtn: { backgroundColor: COLORS.amber, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.md, marginTop: 8 },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  overlayMiddle: { flexDirection: "row", height: VF },
  overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  overlayBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "flex-start", paddingTop: 28 },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 14 },

  viewfinder: { width: VF, height: VF, position: "relative", overflow: "hidden" },
  corner: { position: "absolute", width: 28, height: 28, borderColor: "#fff" },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanLine: { position: "absolute", left: 8, right: 8, height: 2, backgroundColor: COLORS.amber, borderRadius: 1 },

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.success + "CC",
    alignItems: "center", justifyContent: "center", gap: 10, padding: 16,
  },
  resultText: { color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "center" },

  closeWrap: { position: "absolute", top: 0, right: 0, left: 0 },
  closeBtn: {
    position: "absolute", top: 12, right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
});
