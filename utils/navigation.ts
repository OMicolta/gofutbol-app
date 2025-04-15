// utils/navigation.ts
import { router } from "expo-router";

/**
 * Realiza una navegación segura utilizando un timeout para evitar problemas
 * de navegación durante el montaje de componentes.
 *
 * @param path Ruta a la que se desea navegar
 * @param method Método de navegación a utilizar ('push', 'replace', o 'back')
 * @param delay Tiempo de espera en ms antes de la navegación
 * @returns Promesa que se resuelve cuando se completa la navegación
 */
export function safeNavigate(
  path: string,
  method: "push" | "replace" | "back" = "push",
  delay: number = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (method === "back") {
          router.back();
        } else if (method === "replace") {
          router.replace(path as any);
        } else {
          router.push(path as any);
        }
        resolve();
      } catch (error) {
        console.error(`Error en navegación segura a ${path}:`, error);
        reject(error);
      }
    }, delay);
  });
}

/**
 * Verifica si una ruta es parte de un grupo específico.
 * Útil para determinar en qué parte de la aplicación estamos.
 *
 * @param currentPath Ruta actual
 * @param group Grupo a verificar (ej: 'auth', 'tabs')
 * @returns true si la ruta actual pertenece al grupo especificado
 */
export function isInRouteGroup(currentPath: string, group: string): boolean {
  // Por ejemplo: isInRouteGroup("/login", "auth") devuelve true
  return (
    currentPath.includes(`(${group})`) || currentPath.startsWith(`/${group}`)
  );
}

/**
 * Formatea un objeto de parámetros para su uso en la URL
 *
 * @param params Objeto con los parámetros
 * @returns String con formato de query params
 */
export function formatQueryParams(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
}

/**
 * Navega a una ruta con parámetros de forma segura
 *
 * @param basePath Ruta base
 * @param params Objeto con los parámetros
 * @param method Método de navegación
 * @param delay Tiempo de espera
 */
export function navigateWithParams(
  basePath: string,
  params: Record<string, any>,
  method: "push" | "replace" = "push",
  delay: number = 50
): Promise<void> {
  const queryString = formatQueryParams(params);
  const fullPath = queryString ? `${basePath}?${queryString}` : basePath;
  return safeNavigate(fullPath, method, delay);
}
