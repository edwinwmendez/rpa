// Users Service - Gestión de perfiles de usuario
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    notifications?: boolean;
  };
  stats?: {
    totalWorkflows: number;
    totalExecutions: number;
    totalSuccess: number;
    totalFailures: number;
  };
}

export interface CreateUserProfileInput {
  email: string;
  displayName?: string;
  photoURL?: string;
}

class UsersService {
  private getUserDoc(userId: string) {
    return doc(db, 'users', userId);
  }

  // Crear perfil de usuario al registrarse
  async createUserProfile(user: User, input?: CreateUserProfileInput): Promise<void> {
    const userDoc = this.getUserDoc(user.uid);
    
    // Verificar si el perfil ya existe
    const existingProfile = await getDoc(userDoc);
    if (existingProfile.exists()) {
      console.log('Perfil ya existe para usuario:', user.uid);
      return;
    }
    
    // Construir objeto de datos, excluyendo campos undefined
    const userData: Record<string, unknown> = {
      email: input?.email || user.email || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      preferences: {
        theme: 'auto',
        language: 'es',
        notifications: true,
      },
      stats: {
        totalWorkflows: 0,
        totalExecutions: 0,
        totalSuccess: 0,
        totalFailures: 0,
      },
    };

    // Solo agregar displayName si tiene valor
    const displayName = input?.displayName || user.displayName;
    if (displayName) {
      userData.displayName = displayName;
    }

    // Solo agregar photoURL si tiene valor
    const photoURL = input?.photoURL || user.photoURL;
    if (photoURL) {
      userData.photoURL = photoURL;
    }

    console.log('Intentando crear perfil con datos:', { uid: user.uid, email: userData.email });
    await setDoc(userDoc, userData, { merge: false });
    console.log('✅ Perfil creado exitosamente en Firestore');
  }

  // Obtener perfil de usuario
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userDoc = this.getUserDoc(userId);
    const docSnap = await getDoc(userDoc);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as UserProfile;
  }

  // Actualizar perfil de usuario
  async updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<void> {
    const userDoc = this.getUserDoc(userId);
    await updateDoc(userDoc, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // Actualizar estadísticas del usuario
  async updateUserStats(userId: string, stats: Partial<UserProfile['stats']>): Promise<void> {
    const userDoc = this.getUserDoc(userId);
    const currentProfile = await this.getUserProfile(userId);
    
    if (!currentProfile) return;

    await updateDoc(userDoc, {
      stats: {
        ...currentProfile.stats,
        ...stats,
      },
      updatedAt: serverTimestamp(),
    });
  }
}

export const usersService = new UsersService();

