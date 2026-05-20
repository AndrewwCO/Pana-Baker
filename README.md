# 🍞 Panahashi Baker App

App móvil para panaderías. Construida con **React Native + Expo**.

## Requisitos

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode (Mac) o app **Expo Go** en tu iPhone
- Para Android: Android Studio o app **Expo Go** en tu Android

---

## Instalación

```bash
cd panahashi-baker
npm install
npx expo start
```

Luego escanea el QR con **Expo Go** en tu celular.

---

## Configuración obligatoria

### 1. URL del backend

En `src/services/api.js`, cambia:

```js
const API_BASE = "https://tu-backend.com/api/v1"; // 👈 Tu URL real
```

### 2. Firebase Auth (reemplazar el demo)

En `src/services/auth.js`, reemplaza el bloque **DEMO MODE** con Firebase real.
Las instrucciones están en los comentarios del archivo.

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth
```

Luego en `auth.js`:

```js
import auth from "@react-native-firebase/auth";

const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
  if (firebaseUser) {
    const token = await firebaseUser.getIdToken();
    api.setToken(token);
    api.setUserName(firebaseUser.displayName || "Baker");
    setUser({ uid: firebaseUser.uid, displayName: firebaseUser.displayName });
  } else {
    setUser(null);
  }
  setLoading(false);
});
return subscriber;
```

---

## Estructura del proyecto

```
panahashi-baker/
├── App.js                          # Navegación raíz
├── src/
│   ├── theme.js                    # Colores, sombras, radios
│   ├── utils.js                    # Formateo de moneda, fechas
│   ├── services/
│   │   ├── api.js                  # Todas las llamadas al backend
│   │   └── auth.js                 # Contexto de autenticación
│   ├── components/
│   │   └── UI.js                   # Componentes reutilizables
│   └── screens/
│       ├── OrdersScreen.js         # Lista de órdenes con filtros
│       ├── OrderDetailScreen.js    # Detalle y gestión de orden
│       ├── ProductsScreen.js       # CRUD de productos + stock
│       ├── ProductFormScreen.js    # Formulario crear/editar producto
│       ├── StatsScreen.js          # Estadísticas y gráficos
│       ├── BakeryScreen.js         # Perfil y configuración de panadería
│       ├── QrScannerScreen.js      # Escáner QR para completar órdenes
│       └── PromotionsScreen.js     # Gestión de promociones y descuentos
```

---

## Funcionalidades

### 📋 Órdenes
- Lista activa con actualización automática cada 30s
- Filtros: Activas / Pendientes / Confirmadas / Horneando / Listas / Completadas
- Avanzar estado: Pendiente → Confirmado → Horneando → Listo
- Cancelar orden (repone stock automáticamente)
- Ver notas del cliente, método de pago, hora de pickup

### 📷 Escáner QR
- Escanea el QR del cliente para marcar orden como COMPLETED
- Animación de línea de escaneo
- Feedback visual de éxito/error

### 🥖 Productos
- Listado con emoji, precio, stock y estado de disponibilidad
- Crear/editar con selector de emoji, imagen, categoría
- Control de stock inline (+ / −)
- Subida de foto del producto a Firebase Storage
- Cargar productos de prueba (seed)

### 📊 Estadísticas
- Totales, ingresos, ticket promedio
- Comparativa hoy vs. semana
- Top 5 productos más vendidos
- Gráfico de barras por hora del día
- Distribución por estado

### 🏪 Panadería
- Toggle abrir/cerrar con validación de horario
- Editar nombre, descripción, teléfono, dirección, horarios
- Subir logo y banner
- Rating y número de reseñas
- Acceso directo a Promociones

### 🏷️ Promociones
- Crear descuentos por porcentaje, monto fijo o happy hour
- Activar/desactivar con switch
- Eliminar promociones

---

## Producción (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK para Android
eas build --platform ios       # IPA para iOS (requiere cuenta Apple Developer)
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz (opcional, con expo-constants):

```
API_BASE=https://tu-backend.com/api/v1
```
