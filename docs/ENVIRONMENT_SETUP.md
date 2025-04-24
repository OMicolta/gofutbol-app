# Configuración de Variables de Entorno para GoFutbol

Este documento explica cómo configurar las variables de entorno necesarias para la autenticación con Google y Firebase, así como la construcción con EAS.

## Variables de Entorno Necesarias

Para el correcto funcionamiento de GoFutbol, necesitas configurar las siguientes variables de entorno:

### Información de la Aplicación

```
EXPO_PUBLIC_APP_NAME=GoFutbol
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Firebase Configuration

```
FIREBASE_API_KEY=tu_api_key_aqui
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456
FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
```

### Google Auth Client IDs

```
# ID de cliente web (necesario para todas las plataformas)
FIREBASE_WEB_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

# ID de cliente para Android
FIREBASE_ANDROID_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

# ID de cliente para iOS
FIREBASE_IOS_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
FIREBASE_IOS_RESERVED_CLIENT_ID=com.googleusercontent.apps.123456789012-abcdefghijklmnopqrstuvwxyz123456
```

### Expo Configuration

```
EAS_PROJECT_ID=tu_eas_project_id_aqui
```

## Configuración para Desarrollo Local

Para desarrollo local, crea un archivo `.env` en la raíz del proyecto con todas las variables mencionadas anteriormente.

## Configuración para EAS Build

Para construir con EAS, todas las variables de entorno deben configurarse en el archivo `eas.json`. Ya hemos configurado este archivo con placeholders para todas las variables necesarias.

1. Edita el archivo `eas.json`
2. Reemplaza todos los valores `TU_*_AQUI` con tus valores reales
3. Configura las variables para cada perfil (development, preview, production)

## Obtención de IDs de Cliente de Google

Para obtener los IDs de cliente necesarios para la autenticación con Google:

1. Ve a la [Consola de Google Cloud Platform](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a "APIs y Servicios" > "Credenciales"
4. Crea/edita los IDs de cliente OAuth:
   - Para Web: Cliente OAuth web
   - Para Android: Cliente OAuth para Android (requiere huella SHA-1)
   - Para iOS: Cliente OAuth para iOS (requiere ID de paquete)

### URI de Redirección para Android

Para la autenticación en Android, configura el URI de redirección en Google Cloud Platform como:

```
com.gofutbol.app://auth/google-redirect
```

## Construir la Aplicación

Hemos creado un script para facilitar la construcción con EAS:

### En macOS/Linux:

```bash
# Hacer el script ejecutable
chmod +x scripts/build-android.js

# Para desarrollo (cliente de desarrollo)
./scripts/build-android.js development

# Para pruebas (genera un APK)
./scripts/build-android.js preview

# Para producción (versión final)
./scripts/build-android.js production
```

### En Windows:

```powershell
# Para desarrollo (cliente de desarrollo)
node scripts/build-android.js development

# Para pruebas (genera un APK)
node scripts/build-android.js preview

# Para producción (versión final)
node scripts/build-android.js production
```

## Solución de Problemas

### Error de autenticación con Google

Si obtienes un error "Error 400: invalid_request" al intentar autenticarte con Google:

1. Verifica que los IDs de cliente estén configurados correctamente
2. Asegúrate de que el URI de redirección en Google Cloud Platform coincida exactamente con el configurado en la app
3. Verifica que las variables de entorno estén disponibles durante la ejecución

### Error "androidClientId must be defined"

Si obtienes este error, asegúrate de que la variable `FIREBASE_ANDROID_CLIENT_ID` esté configurada correctamente tanto en `.env` como en `eas.json`.
