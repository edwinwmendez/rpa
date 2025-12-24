// Firebase Configuration
// Lee configuración desde variables de entorno (.env)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validar que las variables estén configuradas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName] || import.meta.env[varName] === ''
);

if (missingVars.length > 0) {
  console.error('⚠️ Firebase no está configurado correctamente');
  console.error('Faltan las siguientes variables de entorno:');
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  console.error('\nPor favor, configura tu archivo .env con las credenciales de Firebase');
  console.error('Copia .env.example a .env y reemplaza los valores');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics solo en producción y si está configurado
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (
  typeof window !== 'undefined' &&
  import.meta.env.PROD &&
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('No se pudo inicializar Analytics:', error);
  }
}

export { analytics };
export default app;
