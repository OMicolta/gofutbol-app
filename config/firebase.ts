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
