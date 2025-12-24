# Sistema RPA Personalizado

Sistema de automatización RPA con constructor visual de workflows.

## 📁 Estructura del Proyecto

```
rpa/
├── frontend/           # Aplicación web React
├── backend/            # Configuración Firebase (Firestore, Hosting)
├── agente-win10/       # Agente para Windows 10/11 (con Playwright)
├── agente-win7/        # Agente para Windows 7 (ligero, sin web)
├── docs/               # Documentación del proyecto
├── excel_csv/          # Archivos Excel/CSV de ejemplo
└── README.md           # Este archivo
```

## 🚀 Componentes

### Frontend (React)
- **Framework:** React 19 + TypeScript + Vite 7
- **UI Canvas:** @xyflow/react 12 (constructor visual de workflows)
- **Estado:** Zustand 5
- **Backend:** Firebase (Firestore + Auth)
- **Estilos:** Tailwind CSS 4 + Radix UI
- **Ubicación:** `/frontend`

### Backend (Firebase)
- **Servicios:** Firestore, Authentication, Hosting
- **Reglas:** Security Rules con autenticación por usuario
- **Índices:** Composite indexes para queries optimizadas
- **Ubicación:** `/backend`
- **Deployment:** `cd backend && firebase deploy`

### Agente Windows 10/11
- **Lenguaje:** Python 3.10+
- **API:** Flask + Flask-CORS
- **Automatización Desktop:** pywinauto (UIA + Win32)
- **Automatización Web:** Playwright
- **Excel:** pandas + openpyxl + pywin32
- **Ubicación:** `/agente-win10`

### Agente Windows 7
- **Lenguaje:** Python 3.8
- **Automatización Desktop:** pywinauto (UIA + Win32)
- **Automatización Web:** ❌ NO (más ligero)
- **Excel:** pandas + pywin32
- **Ubicación:** `/agente-win7`

## 📋 Requisitos Previos

### Para Frontend:
- Node.js 18+
- pnpm (recomendado) o npm
- Cuenta Firebase

### Para Agentes:
**Windows 10/11:**
- Python 3.10+
- Visual C++ Redistributable 2015-2022
- .NET Framework 4.8

**Windows 7:**
- Python 3.8
- Visual C++ Redistributable 2015
- .NET Framework 4.5+

## 🛠️ Instalación Rápida

### 1. Frontend
```bash
cd frontend
pnpm install
cp .env.example .env  # Configurar variables de Firebase
pnpm run dev
```

### 2. Agente Windows 10/11
```bash
cd agente-win10
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 3. Agente Windows 7
```bash
cd agente-win7
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## ✨ Características Implementadas

### Editor Visual de Workflows
- Canvas drag & drop con @xyflow/react
- Nodos personalizados: Action, Loop, If/Else
- Conexiones con flechas animadas
- Panel de propiedades para configurar acciones
- Soporte para loops anidados con canvas dedicado

### Acciones Disponibles
- **Click:** Clic en elementos (selector CSS/XPath)
- **Escribir Texto:** Escritura con soporte de variables
- **Esperar:** Por tiempo, elemento aparece/desaparece
- **Navegar:** Abrir URLs en navegador
- **Extraer:** Extraer texto de elementos
- **Leer Texto:** Leer contenido de elementos
- **Loop:** Iteración sobre Excel/CSV, N veces, hasta/mientras condición
- **If/Else:** Bifurcación condicional

### Gestión de Datos
- Carga global de archivos Excel/CSV
- Variables dinámicas: `{{fila.columna}}`
- Selector visual de variables
- Sincronización de archivos con agente local

### Autenticación y Datos
- Firebase Authentication
- Firestore para workflows y usuarios
- Cada usuario ve solo sus workflows
- Guardado automático con timestamps

### UI/UX
- Sistema de toasts para notificaciones
- Sidebar colapsable
- Panel de propiedades contextual
- Tema moderno con Tailwind CSS

## 📖 Documentación

Ver `/docs` para documentación detallada:
- [PRD - Product Requirements](docs/PRD.md)
- [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [Guía de Desarrollo Frontend](docs/FRONTEND.md)
- [Guía de Desarrollo Agente](docs/AGENTE.md)
- [Firebase Setup](docs/FIREBASE_SETUP.md)

## 🎯 Roadmap

- [x] Setup inicial del proyecto
- [x] Frontend con React 19 + Vite 7 + TypeScript
- [x] Firebase Authentication + Firestore
- [x] Constructor visual con @xyflow/react 12
- [x] Acciones básicas (Click, Type, Wait, Navigate)
- [x] Sistema de variables y Excel/CSV
- [x] Loops con múltiples modos (Excel, N veces, condición)
- [x] If/Else con bifurcación visual
- [x] Panel de propiedades completo
- [x] Sistema de toasts para feedback
- [ ] Agente con ejecución de workflows
- [ ] Sistema de targeting (element picker)
- [ ] Instalador con diagnóstico
- [ ] Galería de workflows compartidos

## 🔧 Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Frontend Framework | React | 19.2.3 |
| Build Tool | Vite | 7.3.0 |
| Canvas/Flow | @xyflow/react | 12.10.0 |
| State Management | Zustand | 5.0.9 |
| Styling | Tailwind CSS | 4.1.18 |
| UI Components | Radix UI | Latest |
| Backend | Firebase | 12.7.0 |
| Agent | Python + Flask | 3.10+ |

## 👥 Equipo

- **CTO & Tech Lead:** Edwin
- **Empresa:** 9 personas, Perú

## 📄 Licencia

Propietario - Uso interno
