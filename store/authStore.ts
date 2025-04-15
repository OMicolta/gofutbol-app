// store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

import { auth, db } from "@/config/firebase";

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  position?: string;
  zone?: string;
  stats: {
    totalMatches: number;
    attendanceRate: number;
    punctualityAvg: number;
    attitudeAvg: number;
    mvpVotes: number;
  };
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;

  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  processGoogleCredential: (idToken: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      error: null,
      initialized: false,

      // Inicializar - verificar si hay usuario autenticado
      initialize: async () => {
        try {
          set({ isLoading: true });

          // Validación para prevenir inicializaciones múltiples
          if (get().initialized) {
            set({ isLoading: false });
            return;
          }

          // Crear una promesa que se resuelve cuando se determina el estado de autenticación
          await new Promise<void>((resolve) => {
            // Establecer un tiempo máximo de espera para evitar bloqueos
            const timeoutId = setTimeout(() => {
              console.warn("Auth initialization timeout - forcing completion");
              set({
                user: null,
                profile: null,
                isLoading: false,
                initialized: true,
              });
              resolve();
            }, 5000); // 5 segundos de timeout

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
              clearTimeout(timeoutId); // Limpiar el timeout si onAuthStateChanged responde

              if (user) {
                try {
                  // Usuario autenticado - obtener perfil adicional
                  const profileData = await get().fetchUserProfile(user.uid);

                  set({
                    user,
                    profile: profileData,
                    isLoading: false,
                    initialized: true,
                  });
                } catch (error) {
                  console.error("Error fetching user profile:", error);
                  // Continuar incluso si hay error al obtener el perfil
                  set({
                    user,
                    profile: null,
                    isLoading: false,
                    initialized: true,
                  });
                }
              } else {
                // No hay usuario autenticado
                set({
                  user: null,
                  profile: null,
                  isLoading: false,
                  initialized: true,
                });
              }

              // Desuscribirse después de manejar el estado inicial
              unsubscribe();
              resolve();
            });
          });
        } catch (error) {
          console.error("Error during auth initialization:", error);
          set({
            isLoading: false,
            error: (error as Error).message,
            initialized: true, // Marcamos como inicializado incluso con error
          });
        }
      },

      // Obtener perfil del usuario de Firestore
      fetchUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
          } else {
            // Si no existe el perfil, crea uno nuevo básico
            const user = auth.currentUser;
            const newProfile: UserProfile = {
              uid,
              displayName: user?.displayName || null,
              email: user?.email || null,
              photoURL: user?.photoURL || null,
              stats: {
                totalMatches: 0,
                attendanceRate: 1, // 100% al inicio
                punctualityAvg: 5, // máxima al inicio
                attitudeAvg: 5, // máxima al inicio
                mvpVotes: 0,
              },
            };

            // Guardar perfil nuevo en Firestore
            await setDoc(docRef, newProfile);
            return newProfile;
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          return null;
        }
      },

      // Iniciar sesión con email y contraseña
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );

          // Obtener perfil del usuario
          const profileData = await get().fetchUserProfile(
            userCredential.user.uid
          );

          set({
            user: userCredential.user,
            profile: profileData,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
          });
          throw error;
        }
      },

      // Registrarse con email y contraseña
      signUpWithEmail: async (
        email: string,
        password: string,
        displayName: string
      ) => {
        try {
          set({ isLoading: true, error: null });

          // Crear usuario en Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

          // Actualizar perfil con displayName
          await updateProfile(userCredential.user, { displayName });

          // Crear perfil en Firestore
          const newProfile: UserProfile = {
            uid: userCredential.user.uid,
            displayName,
            email: userCredential.user.email,
            photoURL: null,
            stats: {
              totalMatches: 0,
              attendanceRate: 1,
              punctualityAvg: 5,
              attitudeAvg: 5,
              mvpVotes: 0,
            },
          };

          await setDoc(doc(db, "users", userCredential.user.uid), newProfile);

          set({
            user: userCredential.user,
            profile: newProfile,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
          });
          throw error;
        }
      },

      // Procesar credencial de Google (idToken)
      // Esta función será llamada desde un componente que use useAuthRequest
      processGoogleCredential: async (idToken: string) => {
        try {
          set({ isLoading: true, error: null });

          // Crear credencial para Firebase
          const credential = GoogleAuthProvider.credential(idToken);

          // Iniciar sesión en Firebase con credencial de Google
          const userCredential = await signInWithCredential(auth, credential);

          // Obtener o crear perfil
          const profileData = await get().fetchUserProfile(
            userCredential.user.uid
          );

          set({
            user: userCredential.user,
            profile: profileData,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
          });
          throw error;
        }
      },

      // Actualizar perfil de usuario
      updateUserProfile: async (data: Partial<UserProfile>) => {
        try {
          set({ isLoading: true, error: null });

          const { user, profile } = get();

          if (!user || !profile) {
            throw new Error("Usuario no autenticado");
          }

          // Actualizar displayName en Firebase Auth si se proporciona
          if (data.displayName && data.displayName !== profile.displayName) {
            await updateProfile(user, { displayName: data.displayName });
          }

          // Actualizar perfil en Firestore
          const updatedProfile = { ...profile, ...data };
          await setDoc(doc(db, "users", user.uid), updatedProfile, {
            merge: true,
          });

          set({
            profile: updatedProfile,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
          });
          throw error;
        }
      },

      // Cerrar sesión
      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          await signOut(auth);
          set({
            user: null,
            profile: null,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: (error as Error).message,
          });
          throw error;
        }
      },

      // Limpiar errores
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        initialized: state.initialized,
      }),
    }
  )
);
