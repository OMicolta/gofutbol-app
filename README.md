# GoFutbol - La red social del Fútbol Amateur

GoFutbol es una aplicación móvil que permite a los amantes del fútbol amateur organizar partidos como si fueran eventos sociales. Los usuarios pueden encontrar canchas, programar partidos, invitar amigos y ganar puntos de reputación por ser cumplidos.

## Características Principales

### Explorar y Alquilar Canchas

- Mapa con canchas cercanas (por geolocalización)
- Ver disponibilidad por franjas horarias
- Precios, fotos, reseñas
- Reservar desde la app

### Programar Partidos

- Crear partido (fecha, hora, tipo: 5, 6, 7 u 11)
- Seleccionar cancha o dejarla por definir
- Modo privado (solo por invitación) o público
- Cupos disponibles y notificaciones

### Invitar y Armar Equipos

- Enviar invitaciones a amigos o jugadores con buen ranking
- Autogestión de equipos (A/B)
- Color de uniforme sugerido

### Calificar Comportamiento

- Después del partido, los jugadores califican a los demás:
  - ✅ Asistencia: llegó / no llegó
  - 🕒 Puntualidad: a tiempo / tarde / se fue antes
  - 🔥 Actitud: buena onda / conflictivo / colaborador

### Ranking Futbolero

- Porcentaje de asistencia
- Promedio de puntualidad
- Karma social (calificaciones de otros jugadores)

### Perfil de Jugador

- Posición preferida
- Ranking de asistencia y compromiso
- Partidos jugados

## Tecnologías Utilizadas

- React Native / Expo
- Firebase (Authentication, Firestore, Storage)
- Zustand para gestión de estado
- TypeScript para un código más robusto
- Expo Router para navegación
- React Native Maps para mapas
- Expo Location para geolocalización

## Instalación y Ejecución

### Requisitos Previos

- Node.js (versión 20 o superior)
- npm
- Expo CLI

### Pasos de Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/gofutbol.git
cd gofutbol
```

2. Instalar dependencias:

```bash
npm install
# o con yarn
yarn install
```

3. Iniciar la aplicación:

```bash
npm start
# o con yarn
yarn start
```

4. Usar Expo Go en tu dispositivo o ejecutar en un emulador.

## Configuración de Firebase

Para utilizar todas las funcionalidades, es necesario configurar un proyecto en Firebase:

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password y Google)
3. Configurar Firestore Database
4. Configurar Storage
5. Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
# Firebase Core Configuration
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456
FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# Google Auth Client IDs (OAuth)
FIREBASE_WEB_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
FIREBASE_ANDROID_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
FIREBASE_IOS_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

# Expo Configuration
EAS_PROJECT_ID=tu-proyecto-expo
```

### Configuración de Autenticación con Google

Para habilitar el inicio de sesión con Google:

1. Ve a la [Consola de Google Cloud Platform](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs y Servicios" > "Credenciales"
4. Configura la pantalla de consentimiento OAuth
5. Crea credenciales de ID de cliente OAuth para:

   - Web: Para autenticación en navegadores web
   - Android: Configura el paquete y la huella digital SHA-1
   - iOS: Configura el ID del paquete

6. Copia los IDs de cliente generados y añádelos a tu archivo `.env` en las variables correspondientes
7. En Firebase Console, habilita Google como proveedor de autenticación en la sección Authentication

## Estructura del Proyecto

El proyecto sigue una estructura de carpetas clara y organizada:

```
/gofutbol
├── /app                     # Directorio principal para las pantallas (expo-router)
│   ├── /(tabs)              # Pantallas principales con navegación por tabs
│   ├── /(auth)              # Pantallas de autenticación
│   ├── /field               # Pantallas relacionadas con canchas
│   ├── /match               # Pantallas relacionadas con partidos
│   └── /ratings             # Pantallas relacionadas con calificaciones
├── /assets                  # Recursos estáticos
├── /components              # Componentes reutilizables
├── /config                  # Configuraciones (Firebase, etc.)
├── /constants               # Constantes de la aplicación
├── /context                 # Contextos de React
├── /hooks                   # Custom hooks
├── /store                   # Tiendas de estado (Zustand)
├── /types                   # Definiciones de tipos
└── /utils                   # Utilidades y helpers
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo MIT License - ver el archivo LICENSE.md para más detalles.

## Contacto

Si tienes preguntas o sugerencias, contacta a [tu-email@example.com].
