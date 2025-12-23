# 🔥 Guía de Setup Firebase

Esta guía te ayudará a configurar Firebase para el proyecto RPA desde cero.

## 📋 Tabla de Contenidos
1. [Crear Proyecto Firebase](#1-crear-proyecto-firebase)
2. [Configurar Authentication](#2-configurar-authentication)
3. [Configurar Firestore](#3-configurar-firestore)
4. [Configurar Hosting](#4-configurar-hosting)
5. [Obtener Credenciales](#5-obtener-credenciales)
6. [Configurar en el Proyecto](#6-configurar-en-el-proyecto)
7. [Desplegar](#7-desplegar)

---

## 1. Crear Proyecto Firebase

### Paso 1.1: Ir a Firebase Console
1. Abre https://console.firebase.google.com/
2. Inicia sesión con tu cuenta de Google

### Paso 1.2: Crear Nuevo Proyecto
1. Click en "Agregar proyecto" o "Add project"
2. Nombre del proyecto: `rpa-system` (o el nombre que prefieras)
3. Click "Continuar"
4. Deshabilitar Google Analytics (opcional para MVP)
5. Click "Crear proyecto"
6. Esperar ~30 segundos mientras se crea
7. Click "Continuar"

**✅ Listo:** Tienes tu proyecto Firebase creado

---

## 2. Configurar Authentication

### Paso 2.1: Activar Authentication
1. En el menú lateral, click en "Authentication"
2. Click en "Comenzar" o "Get started"

### Paso 2.2: Activar Métodos de Sign-in
1. Ve a la pestaña "Sign-in method"
2. Click en "Email/Password"
3. Activar el primer interruptor (Email/Password)
4. Click "Guardar"

**Opcional:** También puedes activar Google Sign-In
1. Click en "Google"
2. Activar interruptor
3. Seleccionar email de soporte
4. Click "Guardar"

**✅ Listo:** Authentication configurado

---

## 3. Configurar Firestore

### Paso 3.1: Crear Base de Datos
1. En el menú lateral, click en "Firestore Database"
2. Click en "Crear base de datos" o "Create database"

### Paso 3.2: Elegir Modo
1. Seleccionar "Iniciar en modo de producción"
2. Click "Siguiente"

### Paso 3.3: Elegir Ubicación
1. Seleccionar ubicación más cercana:
   - Para Perú: `us-east1` (Carolina del Norte) es lo más cercano
   - Alternativa: `southamerica-east1` (São Paulo, Brasil)
2. Click "Habilitar"
3. Esperar ~1 minuto mientras se crea

### Paso 3.4: Configurar Reglas de Seguridad
1. Ve a la pestaña "Reglas" o "Rules"
2. Reemplaza el contenido con esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Workflows
    match /workflows/{workflowId} {
      // Solo el dueño puede leer/escribir sus workflows
      allow read, write: if request.auth != null && 
                          request.auth.uid == resource.data.userId;
      
      // Permitir crear workflow si está autenticado
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
    
    // Workflows públicos (galería)
    match /publicWorkflows/{workflowId} {
      // Cualquiera autenticado puede leer workflows públicos
      allow read: if request.auth != null;
      
      // Solo el dueño puede escribir
      allow write: if request.auth != null && 
                      request.auth.uid == resource.data.userId;
    }
    
    // Configuraciones de usuario
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
    }
    
    // Historial de ejecuciones
    match /executionHistory/{executionId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

3. Click "Publicar"

**✅ Listo:** Firestore configurado con seguridad

---

## 4. Configurar Hosting

### Paso 4.1: Instalar Firebase CLI
```bash
# Instalar globalmente
npm install -g firebase-tools

# Verificar instalación
firebase --version
```

### Paso 4.2: Login
```bash
firebase login
```
- Se abrirá navegador
- Autoriza el acceso
- Vuelve a la terminal

### Paso 4.3: Inicializar Firebase en el Proyecto
```bash
cd /Volumes/Datos/Trabajo/Sistemas/rpa/frontend

firebase init
```

**Responde a las preguntas:**

1. "Which Firebase features do you want to set up?"
   - [x] Firestore
   - [x] Hosting
   - Presiona Espacio para seleccionar, Enter para continuar

2. "Please select an option:"
   - → "Use an existing project"

3. "Select a default Firebase project:"
   - → Selecciona `rpa-system` (o tu nombre de proyecto)

4. "What file should be used for Firestore Rules?"
   - → Presiona Enter (usa default: firestore.rules)

5. "What file should be used for Firestore indexes?"
   - → Presiona Enter (usa default: firestore.indexes.json)

6. "What do you want to use as your public directory?"
   - → Escribe: `dist`
   - (No "public", porque Vite genera en "dist")

7. "Configure as a single-page app (rewrite all urls to /index.html)?"
   - → `Yes`

8. "Set up automatic builds and deploys with GitHub?"
   - → `No` (por ahora)

### Paso 4.4: Verificar Archivos Creados
Deberías ver:
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `.firebaserc`

**✅ Listo:** Hosting configurado

---

## 5. Obtener Credenciales

### Paso 5.1: Registrar App Web
1. En Firebase Console, ve a Configuración del proyecto (⚙️ arriba izquierda)
2. En la sección "Tus apps", click en el ícono Web (</>)
3. Nombre de la app: `RPA Frontend`
4. NO marcar "Also set up Firebase Hosting"
5. Click "Registrar app"

### Paso 5.2: Copiar Configuración
Verás algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",
  authDomain: "rpa-system.firebaseapp.com",
  projectId: "rpa-system",
  storageBucket: "rpa-system.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

**Copia estos valores** (los usaremos en el siguiente paso)

---

## 6. Configurar en el Proyecto

### Paso 6.1: Crear archivo .env
```bash
cd /Volumes/Datos/Trabajo/Sistemas/rpa/frontend

# Copiar ejemplo
cp .env.example .env
```

### Paso 6.2: Editar .env
Abre `/Volumes/Datos/Trabajo/Sistemas/rpa/frontend/.env` y reemplaza:

```bash
VITE_FIREBASE_API_KEY=TU_API_KEY_REAL
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_AGENT_URL=http://localhost:5000
```

Con los valores que copiaste en el Paso 5.2

### Paso 6.3: Verificar Configuración
```bash
npm run dev
```

Abre http://localhost:3000 y revisa la consola del navegador:
- ✅ Si NO ves errores de Firebase, está bien configurado
- ❌ Si ves "Firebase no está configurado", revisa el .env

**✅ Listo:** Proyecto configurado localmente

---

## 7. Desplegar

### Paso 7.1: Build del Proyecto
```bash
cd /Volumes/Datos/Trabajo/Sistemas/rpa/frontend

npm run build
```

Esto genera la carpeta `dist/` con archivos optimizados

### Paso 7.2: Desplegar a Firebase Hosting
```bash
firebase deploy --only hosting
```

Espera ~30 segundos. Verás algo como:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/rpa-system
Hosting URL: https://rpa-system.web.app
```

### Paso 7.3: Probar en Producción
1. Abre la Hosting URL en tu navegador
2. Debería cargar la aplicación
3. Intenta registrarte con email/password
4. Verifica que funcione

**✅ Listo:** Aplicación desplegada en Firebase

---

## 🎯 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview del build localmente
npm run preview

# Desplegar (build + deploy automático)
npm run deploy

# Solo desplegar Firestore rules
firebase deploy --only firestore:rules

# Ver logs de Firebase
firebase hosting:logs
```

---

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"
**Solución:** Verificar que Authentication esté habilitado en Firebase Console

### Error: "Missing or insufficient permissions"
**Solución:** Verificar reglas de Firestore (Paso 3.4)

### Error: VITE_FIREBASE_API_KEY is undefined
**Solución:** 
1. Verificar que existe archivo `.env`
2. Verificar que las variables empiezan con `VITE_`
3. Reiniciar servidor dev: `npm run dev`

### Deploy falla con "Authorization failed"
**Solución:**
```bash
firebase logout
firebase login
```

---

## 📊 Costos Estimados

### Spark Plan (Gratis)
- ✅ Firestore: 1GB storage, 50k reads/day, 20k writes/day
- ✅ Hosting: 10GB bandwidth/mes
- ✅ Authentication: Ilimitado

**Para 50 usuarios activos:** Gratis  
**Para 100-200 usuarios:** Probablemente gratis  
**Para 500+ usuarios:** ~$5-20/mes

---

## ✅ Checklist de Setup Completo

- [ ] Proyecto Firebase creado
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore creado con reglas configuradas
- [ ] Firebase CLI instalado
- [ ] `firebase init` ejecutado correctamente
- [ ] Credenciales copiadas a `.env`
- [ ] `npm run dev` funciona sin errores
- [ ] `firebase deploy` exitoso
- [ ] App accesible en Hosting URL
- [ ] Registro/Login funciona

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa logs de Firebase: `firebase hosting:logs`
3. Consulta docs oficiales: https://firebase.google.com/docs

---

**¡Listo Edwin! Ahora tienes Firebase completamente configurado. 🎉**
