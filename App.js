import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuth } from "./src/services/auth";
import { COLORS, RADIUS } from "./src/theme";

import OrdersScreen from "./src/screens/OrdersScreen";
import OrderDetailScreen from "./src/screens/OrderDetailScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import ProductFormScreen from "./src/screens/ProductFormScreen";
import StatsScreen from "./src/screens/StatsScreen";
import BakeryScreen from "./src/screens/BakeryScreen";
import QrScannerScreen from "./src/screens/QrScannerScreen";
import PromotionsScreen from "./src/screens/PromotionsScreen";
import LoginScreen from "./src/screens/LoginScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Orders Stack ─────────────────────────────────────────────
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.surface } }}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="QrScanner" component={QrScannerScreen} options={{ presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}

// ── Products Stack ────────────────────────────────────────────
function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.surface } }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ presentation: "card" }} />
    </Stack.Navigator>
  );
}

// ── Bakery Stack ──────────────────────────────────────────────
function BakeryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.surface } }}>
      <Stack.Screen name="BakeryMain" component={BakeryScreen} />
      <Stack.Screen name="Promotions" component={PromotionsScreen} options={{ presentation: "card" }} />
    </Stack.Navigator>
  );
}

// ── Tab Navigator ─────────────────────────────────────────────
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.amber,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.border,
          height: 82,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Órdenes:      focused ? "bag-handle" : "bag-handle-outline",
            Productos:    focused ? "cafe" : "cafe-outline",
            Estadísticas: focused ? "bar-chart" : "bar-chart-outline",
            Panadería:    focused ? "storefront" : "storefront-outline",
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Órdenes"      component={OrdersStack} />
      <Tab.Screen name="Productos"    component={ProductsStack} />
      <Tab.Screen name="Estadísticas" component={StatsScreen} />
      <Tab.Screen name="Panadería"    component={BakeryStack} />
    </Tab.Navigator>
  );
}

// ── Loading screen ────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashEmoji}>🍞</Text>
      <Text style={styles.splashTitle}>Panahashi</Text>
      <Text style={styles.splashSub}>Panel de panadería</Text>
      <ActivityIndicator color={COLORS.amber} style={{ marginTop: 32 }} />
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────
function Root() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  // Si no hay usuario, aquí iría la pantalla de Login con Firebase
  // Por ahora el AuthProvider demo siempre loguea automáticamente
 if (!user) return <LoginScreen />;

  return <AppTabs />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <Root />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  splashEmoji: { fontSize: 64, marginBottom: 16 },
  splashTitle: { fontSize: 32, fontWeight: "700", color: COLORS.brown },
  splashSub: { fontSize: 16, color: COLORS.muted, marginTop: 6 },
});
