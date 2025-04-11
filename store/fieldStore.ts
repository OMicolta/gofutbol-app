// store/fieldStore.ts
import { create } from "zustand";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  GeoPoint,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import * as Location from "expo-location";
import { db } from "@/config/firebase";

export interface FieldFacility {
  id: string;
  name: string;
  icon: string;
}

export interface FieldAvailability {
  day: string;
  times: string[];
}

export interface Field {
  id: string;
  name: string;
  address: string;
  zone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  price: number;
  priceFormatted: string;
  rating: number;
  reviewCount: number;
  types: string[];
  photos: string[];
  facilities: string[];
  description: string;
  availability: FieldAvailability[];
  distance?: number; // Calculado en tiempo real
}

interface FieldFilters {
  query: string;
  zone?: string;
  type?: string[];
  facilities?: string[];
  priceRange?: [number, number];
  available?: boolean;
  sortBy: "distance" | "price" | "rating";
}

interface FieldState {
  fields: Field[];
  filteredFields: Field[];
  selectedField: Field | null;
  filters: FieldFilters;
  userLocation: Location.LocationObject | null;
  isLoading: boolean;
  error: string | null;
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;

  // Acciones
  fetchFields: (fresh?: boolean) => Promise<void>;
  fetchMoreFields: () => Promise<void>;
  getFieldById: (id: string) => Promise<Field | null>;
  setFilters: (newFilters: Partial<FieldFilters>) => void;
  resetFilters: () => void;
  selectField: (field: Field | null) => void;
  getUserLocation: () => Promise<Location.LocationObject | null>;
  calculateDistances: () => void;
  applyFilters: () => void; // Agregado para solucionar error
}

const defaultFilters: FieldFilters = {
  query: "",
  sortBy: "distance",
};

export const useFieldStore = create<FieldState>()((set, get) => ({
  fields: [],
  filteredFields: [],
  selectedField: null,
  filters: defaultFilters,
  userLocation: null,
  isLoading: false,
  error: null,
  lastVisible: null,

  // Obtener campos con paginación
  fetchFields: async (fresh = false) => {
    try {
      set({ isLoading: true, error: null });

      // Si es una carga fresca, resetear lastVisible
      if (fresh) {
        set({ lastVisible: null });
      }

      // Primero, obtener ubicación del usuario
      const location = await get().getUserLocation();

      // Crear query base
      const fieldsRef = collection(db, "fields");
      let fieldQuery = query(fieldsRef, orderBy("name"), limit(10));

      // Si no es una carga fresca y tenemos lastVisible, usar startAfter
      if (!fresh && get().lastVisible) {
        fieldQuery = query(
          fieldsRef,
          orderBy("name"),
          startAfter(get().lastVisible),
          limit(10)
        );
      }

      const querySnapshot = await getDocs(fieldQuery);

      // Guardar último documento visible para paginación
      const lastVisible =
        querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      // Mapear documentos a objetos Field
      const fetchedFields: Field[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const field: Field = {
          id: doc.id,
          name: data.name,
          address: data.address,
          zone: data.zone,
          location: {
            latitude: data.geoPoint?.latitude || 0,
            longitude: data.geoPoint?.longitude || 0,
          },
          price: data.price || 0,
          priceFormatted: data.price
            ? `$${data.price.toLocaleString("es-CO")}`
            : "No disponible",
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          types: data.types || [],
          photos: data.photos || [],
          facilities: data.facilities || [],
          description: data.description || "",
          availability: data.availability || [],
        };

        fetchedFields.push(field);
      });

      // Si es carga fresca, reemplazar los campos
      const fields = fresh
        ? fetchedFields
        : [...get().fields, ...fetchedFields];

      // Calcular distancias si hay ubicación
      if (location) {
        const fieldsWithDistance = fields.map((field) => ({
          ...field,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            field.location.latitude,
            field.location.longitude
          ),
        }));

        // Ordenar por distancia por defecto
        fieldsWithDistance.sort(
          (a, b) => (a.distance || 0) - (b.distance || 0)
        );

        set({
          fields: fieldsWithDistance,
          filteredFields: fieldsWithDistance,
          lastVisible,
          isLoading: false,
          userLocation: location,
        });
      } else {
        set({
          fields,
          filteredFields: fields,
          lastVisible,
          isLoading: false,
        });
      }

      // Aplicar filtros actuales a los nuevos campos
      get().applyFilters();
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  // Cargar más campos (paginación)
  fetchMoreFields: async () => {
    if (!get().lastVisible || get().isLoading) return;
    await get().fetchFields(false);
  },

  // Obtener campo por ID
  getFieldById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // Primero revisar si ya lo tenemos en el estado
      const cachedField = get().fields.find((field) => field.id === id);
      if (cachedField) {
        set({ selectedField: cachedField, isLoading: false });
        return cachedField;
      }

      // Si no está en caché, buscarlo en Firestore
      const fieldDoc = await getDoc(doc(db, "fields", id));

      if (fieldDoc.exists()) {
        const data = fieldDoc.data();
        const field: Field = {
          id: fieldDoc.id,
          name: data.name,
          address: data.address,
          zone: data.zone,
          location: {
            latitude: data.geoPoint?.latitude || 0,
            longitude: data.geoPoint?.longitude || 0,
          },
          price: data.price || 0,
          priceFormatted: data.price
            ? `$${data.price.toLocaleString("es-CO")}`
            : "No disponible",
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          types: data.types || [],
          photos: data.photos || [],
          facilities: data.facilities || [],
          description: data.description || "",
          availability: data.availability || [],
        };

        // Calcular distancia si tenemos ubicación del usuario
        const userLocation = get().userLocation;
        if (userLocation) {
          field.distance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            field.location.latitude,
            field.location.longitude
          );
        }

        set({ selectedField: field, isLoading: false });
        return field;
      }

      set({ isLoading: false });
      return null;
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      return null;
    }
  },

  // Establecer filtros
  setFilters: (newFilters: Partial<FieldFilters>) => {
    set({
      filters: { ...get().filters, ...newFilters },
    });
    get().applyFilters();
  },

  // Resetear filtros
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },

  // Aplicar filtros (función interna)
  applyFilters: () => {
    const { fields, filters } = get();

    let result = [...fields];

    // Filtrar por texto de búsqueda
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (field) =>
          field.name.toLowerCase().includes(query) ||
          field.zone.toLowerCase().includes(query) ||
          field.address.toLowerCase().includes(query)
      );
    }

    // Filtrar por zona
    if (filters.zone) {
      result = result.filter((field) => field.zone === filters.zone);
    }

    // Filtrar por tipo
    if (filters.type && filters.type.length > 0) {
      result = result.filter((field) =>
        filters.type!.some((type) => field.types.includes(type))
      );
    }

    // Filtrar por instalaciones
    if (filters.facilities && filters.facilities.length > 0) {
      result = result.filter((field) =>
        filters.facilities!.every((facility) =>
          field.facilities.includes(facility)
        )
      );
    }

    // Filtrar por rango de precio
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      result = result.filter(
        (field) => field.price >= min && field.price <= max
      );
    }

    // Ordenar resultados
    switch (filters.sortBy) {
      case "distance":
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case "price":
        result.sort((a, b) => a.price - b.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    set({ filteredFields: result });
  },

  // Seleccionar una cancha
  selectField: (field: Field | null) => {
    set({ selectedField: field });
  },

  // Obtener ubicación del usuario
  getUserLocation: async () => {
    try {
      // Si ya tenemos la ubicación, devolverla
      if (get().userLocation) {
        return get().userLocation;
      }

      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        set({ error: "Permiso de ubicación no concedido" });
        return null;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({});
      set({ userLocation: location });

      // Si ya tenemos campos, calcular distancias
      if (get().fields.length > 0) {
        get().calculateDistances();
      }

      return location;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  // Calcular distancias a todas las canchas
  calculateDistances: () => {
    const { userLocation, fields } = get();

    if (!userLocation) return;

    const fieldsWithDistance = fields.map((field) => ({
      ...field,
      distance: calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        field.location.latitude,
        field.location.longitude
      ),
    }));

    set({
      fields: fieldsWithDistance,
      filteredFields: fieldsWithDistance,
    });

    // Reaplicar filtros con las nuevas distancias
    get().applyFilters();
  },
}));

// Función de utilidad para calcular distancia en km entre dos puntos
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en km
  return Math.round(distance * 10) / 10; // Redondear a 1 decimal
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
