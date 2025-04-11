// config/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Obtener variables de entorno desde Expo Constants
// Estas variables se configuran en app.config.js o app.json
const getFirebaseKeys = () => {
  // Intenta obtener las claves desde Constants.expoConfig.extra
  const extra = Constants.expoConfig?.extra;

  return {
    apiKey: extra?.firebaseApiKey || process.env.FIREBASE_API_KEY,
    authDomain: extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID,
    storageBucket:
      extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      extra?.firebaseMessagingSenderId ||
      process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: extra?.firebaseAppId || process.env.FIREBASE_APP_ID,
  };
};

// Obtener la configuración de Firebase de variables de entorno
const firebaseConfig = getFirebaseKeys();

// Fallback para desarrollo en caso de que las variables no estén definidas
if (!firebaseConfig.apiKey) {
  console.warn(
    "Firebase config no encontrado en variables de entorno. Usando valores por defecto para desarrollo."
  );

  // Valores por defecto para desarrollo local
  Object.assign(firebaseConfig, {
    apiKey: "AIzaSyBzNuU9rcWpwN7ExmC3FQh5pVY_dNgaaP4",
    authDomain: "gofutbol-app.firebaseapp.com",
    projectId: "gofutbol-app",
    storageBucket: "gofutbol-app.firebasestorage.app",
    messagingSenderId: "388240856326",
    appId: "1:388240856326:web:4d0593449fb12bfba23a87",
  });
}

// Inicializar Firebase solo una vez
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);

  // Configurar persistencia de autenticación para React Native
  if (Platform.OS !== "web") {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

// Inicializar servicios
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
