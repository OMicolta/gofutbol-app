import 'dotenv/config';

export default {
  name: process.env.EXPO_PUBLIC_APP_NAME || 'GoFutbol',
  slug: 'gofutbol',
  version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gofutbol',
  userInterfaceStyle: 'automatic', // Para soportar temas claro y oscuro
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    imageWidth: 200,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gofutbol.app',
    config: {
      googleSignIn: {
        reservedClientId: process.env.FIREBASE_IOS_RESERVED_CLIENT_ID
      }
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'GoFutbol necesita acceso a tu ubicación para mostrarte canchas cercanas y calcular distancias.',
      NSCameraUsageDescription: 'GoFutbol necesita acceso a tu cámara para actualizar tu foto de perfil.',
      NSPhotoLibraryUsageDescription: 'GoFutbol necesita acceso a tu galería para seleccionar tu foto de perfil.',
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['com.gofutbol.app', 'gofutbol']
        }
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    userInterfaceStyle: 'automatic', // Para soportar temas claro y oscuro
    package: 'com.gofutbol.app',
    permissions: [
      'CAMERA',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE'
    ],
    // Configuración para autenticación OAuth
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "com.gofutbol.app",
            host: "auth",
            pathPrefix: "/google-redirect"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  extra: {
    // Firebase config
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,

    // Google Auth
    firebaseWebClientId: process.env.FIREBASE_WEB_CLIENT_ID,
    firebaseAndroidClientId: process.env.FIREBASE_ANDROID_CLIENT_ID,
    firebaseIosClientId: process.env.FIREBASE_IOS_CLIENT_ID,

    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#ffffff",
      }
    ],
    // Geolocalización para encontrar canchas cercanas
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'GoFutbol necesita acceso a tu ubicación para mostrarte canchas cercanas y calcular distancias.',
        locationWhenInUsePermission: 'GoFutbol necesita acceso a tu ubicación para mostrarte canchas cercanas y calcular distancias.'
      },
    ],
    // Para cámara y selección de imágenes (fotos de perfil)
    [
      'expo-image-picker',
      {
        photosPermission: 'GoFutbol necesita acceso a tu galería para seleccionar tu foto de perfil.',
        cameraPermission: 'GoFutbol necesita acceso a tu cámara para actualizar tu foto de perfil.'
      },
    ],
    // Para notificaciones de partidos
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#1DB954',
        sounds: ['./assets/sounds/notification.wav']
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};