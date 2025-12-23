# Arquitectura del Sistema RPA

## Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE (Google Cloud)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Firestore   │  │    Auth      │  │  Hosting + CDN  │   │
│  │  (Workflows) │  │  (Usuarios)  │  │  (React App)    │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         │
        ┌────────────────▼─────────────────────┐
        │    NAVEGADOR (Chrome, Edge, Firefox) │
        │    https://mi-rpa.web.app            │
        │                                       │
        │  - Constructor visual (React Flow)   │
        │  - Auth (Firebase SDK)               │
        │  - Guardar workflows (Firestore)     │
        └────────────┬──────────────────────────┘
                     │
                     │ HTTP a localhost:5000
                     │ (conexión directa)
                     │
    ┌────────────────▼────────────────────────────────────┐
    │         PC DEL USUARIO (Windows)                    │
    │                                                      │
    │  ┌────────────────────────────────────────────┐    │
    │  │   AGENTE LOCAL (Python + Flask)            │    │
    │  │   Puerto: localhost:5000                   │    │
    │  │   CORS: habilitado para Firebase           │    │
    │  └────────────────────────────────────────────┘    │
    └─────────────────────────────────────────────────────┘
```

## Flujo de Datos

### Crear Workflow
```
Usuario (navegador) 
  → React App 
  → Firebase Firestore
  → Guardado en cloud
```

### Ejecutar Workflow
```
1. Usuario presiona "Ejecutar" en navegador
2. Frontend carga workflow desde Firestore
3. Frontend envía workflow al agente (localhost:5000)
4. Agente ejecuta acciones en Windows
5. Agente envía logs en tiempo real al frontend
6. Frontend actualiza UI con progreso
```

## Diferencias entre Agentes

### Agente Windows 10/11 (Completo)
- Python 3.10
- pywinauto (desktop automation)
- **Playwright (web automation)** ✅
- pandas + openpyxl + pywin32 (Excel)
- Tamaño: ~200MB

### Agente Windows 7 (Ligero)
- Python 3.8
- pywinauto (desktop automation)
- **Sin automatización web** ❌
- pandas + pywin32 (Excel)
- Tamaño: ~150MB

**Razón:** Windows 7 tiene limitaciones de Python 3.8 y usuarios pueden usar automatización web desde Win10/11

## Tecnologías

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **UI Library:** Tailwind CSS + Radix UI
- **Workflow Editor:** React Flow
- **State:** Zustand
- **Backend:** Firebase SDK

### Backend (Firebase)
- **Database:** Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Hosting:** Firebase Hosting + CDN
- **Storage:** Cloud Storage (para exports)

### Agente
- **Server:** Flask + Flask-CORS
- **Desktop:** pywinauto 0.6.8
- **Web (Win10/11):** Playwright
- **Excel:** pandas + pywin32 (COM)

## Seguridad

### Frontend → Agente
- Conexión localhost solo (no expuesto a internet)
- CORS configurado solo para dominio Firebase
- Validación de workflows en agente

### Firebase
- Autenticación requerida
- Firestore rules por usuario
- HTTPS obligatorio

## Escalabilidad

### Gratis (Spark Plan)
- 0-50 usuarios
- 1GB Firestore
- 10GB hosting/mes
- Costo: $0

### Pago (Blaze Plan)
- 50-500 usuarios
- Pay-as-you-go
- Costo estimado: $5-20/mes
