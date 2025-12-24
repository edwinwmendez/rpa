// Auth Store - Gestión de autenticación con Zustand
import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { usersService } from '../lib/usersService';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Inicializar listener de autenticación
  let unsubscribe: (() => void) | null = null;

    const init = () => {
      if (unsubscribe) return;
      
      set({ loading: true });
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          // Si el usuario existe pero no tiene perfil, crearlo
          if (user) {
            try {
              const profile = await usersService.getUserProfile(user.uid);
              if (!profile) {
                console.log('Usuario sin perfil detectado, creando perfil...', user.uid);
                // Crear perfil si no existe (para usuarios antiguos o nuevos)
                await usersService.createUserProfile(user, { email: user.email || '' });
                console.log('Perfil creado desde onAuthStateChanged');
              } else {
                console.log('Perfil encontrado para usuario:', user.uid);
              }
            } catch (error) {
              console.error('Error al verificar/crear perfil:', error);
              const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
              console.error('Detalles del error:', errorMessage);
            }
          }
          
          set({ user, loading: false, initialized: true, error: null });
        },
        (error) => {
          set({ 
            user: null, 
            loading: false, 
            initialized: true, 
            error: error.message 
          });
        }
      );
    };

  // Inicializar al crear el store
  init();

  return {
    user: null,
    loading: true,
    error: null,
    initialized: false,

    signIn: async (email: string, password: string) => {
      try {
        set({ loading: true, error: null });
        await signInWithEmailAndPassword(auth, email, password);
        set({ loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
        set({ loading: false, error: message });
        throw error;
      }
    },

    signUp: async (email: string, password: string) => {
      try {
        set({ loading: true, error: null });
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Esperar a que el token de autenticación esté completamente propagado
        // Esto asegura que Firestore reconozca la autenticación
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Obtener el token para forzar la actualización
        try {
          await userCredential.user.getIdToken(true);
        } catch (tokenError) {
          console.warn('Error al obtener token:', tokenError);
        }
        
        // Crear perfil de usuario en Firestore
        try {
          console.log('Creando perfil para usuario:', userCredential.user.uid, 'Email:', email);
          await usersService.createUserProfile(userCredential.user, { email });
          console.log('✅ Perfil creado exitosamente en Firestore');
        } catch (profileError) {
          console.error('❌ Error al crear perfil de usuario:', profileError);
          const errorMessage = profileError instanceof Error ? profileError.message : 'Error desconocido';
          console.error('Detalles del error:', errorMessage);
          
          // Si falla aquí, el onAuthStateChanged también intentará crear el perfil
          // No lanzamos error para no bloquear el registro
        }
        
        set({ loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al registrar usuario';
        set({ loading: false, error: message });
        throw error;
      }
    },

    logout: async () => {
      try {
        set({ loading: true, error: null });
        await signOut(auth);
        set({ user: null, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al cerrar sesión';
        set({ loading: false, error: message });
        throw error;
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
});

