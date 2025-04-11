// hooks/useColorScheme.web.ts
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return theme;
  }

  return "light";
}
