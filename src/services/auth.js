import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";



// Inicializar app solo una vez
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Inicializar auth con persistencia — también solo una vez
let auth;
try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Si ya fue inicializado (hot reload), obtener la instancia existente
  const { getAuth } = require("firebase/auth");
  auth = getAuth(firebaseApp);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          api.setToken(token);
          api.setUserName(firebaseUser.displayName || "Baker");
          setUser({
            uid:         firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email:       firebaseUser.email,
          });
        } else {
          api.setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.log("Auth error:", error);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      api.setToken(null);
      setUser(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { auth };