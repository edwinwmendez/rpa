# Backend - Firebase Configuration

Esta carpeta contiene toda la configuración de Firebase para el proyecto.

## 📁 Estructura

```
backend/
├── firebase.json          # Configuración principal de Firebase
├── firestore.rules        # Reglas de seguridad de Firestore
├── firestore.indexes.json # Índices de Firestore
└── README.md             # Este archivo
```

## 🔧 Configuración

### Firebase CLI

Asegúrate de tener Firebase CLI instalado y estar autenticado:

```bash
npm install -g firebase-tools
firebase login
```

### Inicializar Firebase (si es necesario)

```bash
cd backend
firebase init
```

## 🚀 Comandos de Despliegue

Desde esta carpeta (`backend/`):

```bash
# Desplegar solo Firestore (reglas e índices)
firebase deploy --only firestore

# Desplegar solo índices de Firestore
firebase deploy --only firestore:indexes

# Desplegar solo reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar solo Hosting (frontend)
firebase deploy --only hosting

# Desplegar todo
firebase deploy
```

## ⚠️ Nota sobre Índices

Si Firebase te pide crear un índice automáticamente, puedes:
1. Hacer clic en el enlace que proporciona Firebase Console
2. O desplegar los índices con: `firebase deploy --only firestore:indexes`

## 📝 Notas

- **Hosting**: El frontend se despliega desde `../frontend/dist` (carpeta dist del frontend)
- **Firestore**: Las reglas e índices están en esta carpeta
- **Variables de entorno**: Las credenciales de Firebase están en `../frontend/.env`

## 🔒 Seguridad

- Las reglas de Firestore están en `firestore.rules`
- Asegúrate de revisar y probar las reglas antes de desplegar
- Usa `firebase emulators` para probar localmente

