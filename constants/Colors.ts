// constants\Colors.ts

// Colores base de la aplicación
const primaryColor = "#1DB954"; // Verde GoFutbol (similar a Spotify) para energía y acción
const secondaryColor = "#1ED760"; // Verde más claro para variaciones
const successColor = "#4CAF50"; // Verde para acciones positivas
const warningColor = "#FF9800"; // Naranja para advertencias
const dangerColor = "#F44336"; // Rojo para errores o advertencias críticas
const infoColor = "#2196F3"; // Azul para información

// Sistema de grises
const gray = {
  900: "#0D0D0D", // Casi negro
  800: "#212121",
  700: "#424242",
  600: "#616161",
  500: "#757575", // Gris medio
  400: "#9E9E9E",
  300: "#BDBDBD",
  200: "#E0E0E0",
  100: "#F5F5F5", // Casi blanco
  50: "#FAFAFA",
};

export const Colors = {
  light: {
    // Colores principales
    primary: primaryColor,
    secondary: secondaryColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    info: infoColor,

    // Colores de texto
    text: gray[900],
    textSecondary: gray[600],
    textDisabled: gray[400],

    // Colores de fondo
    background: gray[50],
    backgroundSecondary: "white",
    card: "white",
    surface: "white",

    // Colores de líneas y bordes
    border: gray[200],
    borderLight: gray[100],

    // Colores de acción
    tint: primaryColor,
    icon: gray[500],
    tabIconDefault: gray[400],
    tabIconSelected: primaryColor,

    // Estados
    disabled: gray[300],
    placeholder: gray[400],

    // Overlay y sombras
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Colores principales
    primary: primaryColor,
    secondary: secondaryColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    info: infoColor,

    // Colores de texto
    text: "white",
    textSecondary: gray[300],
    textDisabled: gray[500],

    // Colores de fondo
    background: "#121212", // Negro elegante estilo dark mode
    backgroundSecondary: gray[900],
    card: "#1E1E1E",
    surface: "#1E1E1E",

    // Colores de líneas y bordes
    border: gray[700],
    borderLight: gray[800],

    // Colores de acción
    tint: primaryColor,
    icon: gray[300],
    tabIconDefault: gray[400],
    tabIconSelected: primaryColor,

    // Estados
    disabled: gray[700],
    placeholder: gray[600],

    // Overlay y sombras
    overlay: "rgba(0, 0, 0, 0.8)",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
};

// Espaciado consistente
export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Tipografía consistente
export const Typography = {
  fontSizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },
  lineHeights: {
    xs: 16,
    s: 20,
    m: 24,
    l: 28,
    xl: 32,
    xxl: 38,
    xxxl: 42,
  },
};

// Radios y sombras para elementos de la interfaz
export const Shape = {
  radius: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
  },
  shadow: {
    s: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    m: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    l: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};
