// hooks/useFields.ts
import { useEffect, useState } from "react";
import { useFieldStore, Field } from "@/store/fieldStore";
import { useAuth } from "./useAuth";

export function useFields() {
  const fieldStore = useFieldStore();
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Cargar canchas al montar el componente
  useEffect(() => {
    const loadFields = async () => {
      try {
        await fieldStore.fetchFields(true);
      } finally {
        setIsInitializing(false);
      }
    };

    loadFields();
  }, []);

  // Función para obtener detalles de una cancha específica
  const getFieldDetails = async (fieldId: string): Promise<Field | null> => {
    try {
      return await fieldStore.getFieldById(fieldId);
    } catch (error) {
      console.error("Error al obtener detalles de la cancha:", error);
      return null;
    }
  };

  // Función para obtener la ubicación del usuario
  const getUserLocation = async () => {
    return await fieldStore.getUserLocation();
  };

  // Función para aplicar filtros a las canchas
  const applyFilters = (filters: any) => {
    fieldStore.setFilters(filters);
  };

  // Función para cargar más canchas (paginación)
  const loadMoreFields = async () => {
    await fieldStore.fetchMoreFields();
  };

  return {
    ...fieldStore,
    isInitializing,
    getFieldDetails,
    getUserLocation,
    applyFilters,
    loadMoreFields,
  };
}
