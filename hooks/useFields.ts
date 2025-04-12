// hooks/useFields.ts
import { useEffect, useState } from "react";
import { useFieldStore, Field } from "@/store/fieldStore";
import { useAuth } from "./useAuth";
import { useNotification } from "@/context/NotificationContext";

export function useFields() {
  const fieldStore = useFieldStore();
  const { user, isInitializing: authInitializing } = useAuth();
  const { showNotification } = useNotification();
  const [isLocalInitializing, setIsLocalInitializing] = useState(true);

  // Cargar canchas al montar el componente, pero solo si hay un usuario autenticado
  useEffect(() => {
    const loadFields = async () => {
      // Solo intentar cargar datos si hay un usuario autenticado
      if (user) {
        try {
          await fieldStore.fetchFields(true);
        } catch (error) {
          console.error("Error al cargar canchas:", error);
          // No mostrar notificación aquí, se manejará en el componente
          fieldStore.setError("Error al cargar canchas. Verifica tu conexión.");
        }
      } else {
        // Si no hay usuario, limpiar datos y establecer error informativo
        fieldStore.clearFields();
        fieldStore.setError("Debes iniciar sesión para ver las canchas.");
      }
      setIsLocalInitializing(false);
    };

    // Esperar a que la autenticación se inicialice antes de cargar campos
    if (!authInitializing) {
      loadFields();
    }
  }, [user, authInitializing]);

  // Función para obtener detalles de una cancha específica con manejo de errores
  const getFieldDetails = async (fieldId: string): Promise<Field | null> => {
    if (!user) {
      showNotification(
        "Debes iniciar sesión para ver los detalles de la cancha",
        "error"
      );
      return null;
    }

    try {
      return await fieldStore.getFieldById(fieldId);
    } catch (error) {
      console.error("Error al obtener detalles de la cancha:", error);
      showNotification(`Error: ${(error as Error).message}`, "error");
      return null;
    }
  };

  // Función para obtener la ubicación del usuario con mejor manejo de errores
  const getUserLocation = async () => {
    try {
      return await fieldStore.getUserLocation();
    } catch (error) {
      console.error("Error al obtener ubicación:", error);
      showNotification("No se pudo acceder a tu ubicación", "warning");
      return null;
    }
  };

  // Función segura para aplicar filtros
  const setFilters = (filters: any) => {
    try {
      fieldStore.setFilters(filters);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
    }
  };

  // Función segura para cargar más canchas
  const loadMoreFields = async () => {
    if (!user) {
      showNotification("Debes iniciar sesión para cargar más canchas", "error");
      return;
    }

    try {
      await fieldStore.fetchMoreFields();
    } catch (error) {
      console.error("Error al cargar más canchas:", error);
      showNotification(`Error: ${(error as Error).message}`, "error");
    }
  };

  return {
    ...fieldStore,
    isInitializing: isLocalInitializing || authInitializing,
    getFieldDetails,
    getUserLocation,
    setFilters,
    loadMoreFields,
  };
}
