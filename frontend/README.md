# Frontend - Sistema RPA

Aplicación web React + TypeScript + Firebase

## 🚀 Instalación

```bash
npm install
```

## 🔧 Configuración Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activa Authentication y Firestore
3. Copia las credenciales en `src/lib/firebase.ts`

## 📝 Scripts

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Deploy a Firebase
npm run deploy
```

## 📁 Estructura

```
src/
├── components/     # Componentes reutilizables
├── pages/          # Páginas/rutas
├── stores/         # Estado (Zustand)
├── lib/            # Utilidades (Firebase, Agent Client)
├── App.tsx         # Componente principal
└── main.tsx        # Punto de entrada
```

## 🔗 Conexión con Agente

El frontend se conecta directamente al agente en `localhost:5000`.
Asegúrate de tener el agente ejecutándose.
