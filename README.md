# Sistema RPA Personalizado

Sistema de automatización RPA con constructor visual de workflows.

## 📁 Estructura del Proyecto

```
rpa/
├── frontend/           # Aplicación web React + Firebase
├── agente-win10/       # Agente para Windows 10/11 (con Playwright)
├── agente-win7/        # Agente para Windows 7 (ligero, sin web)
├── docs/               # Documentación del proyecto
└── README.md           # Este archivo
```

## 🚀 Componentes

### Frontend (React + Firebase)
- **Framework:** React 18 + TypeScript + Vite
- **UI:** React Flow (constructor visual)
- **Backend:** Firebase (Firestore + Auth + Hosting)
- **Deployment:** Firebase Hosting
- **Ubicación:** `/frontend`

### Agente Windows 10/11
- **Lenguaje:** Python 3.10
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
- npm o yarn
- Cuenta Firebase (gratis)

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
npm install
npm run dev
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

## 📖 Documentación

Ver `/docs` para documentación detallada:
- [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [Guía de Desarrollo Frontend](docs/FRONTEND.md)
- [Guía de Desarrollo Agente](docs/AGENTE.md)
- [Firebase Setup](docs/FIREBASE_SETUP.md)

## 🎯 Roadmap

- [x] Setup inicial del proyecto
- [ ] Frontend básico con Firebase
- [ ] Agente con 3 acciones básicas (Click, Type, Wait)
- [ ] Constructor visual con React Flow
- [ ] Sistema de targeting (element picker)
- [ ] Procesamiento Excel/CSV
- [ ] Instalador con diagnóstico
- [ ] Galería de workflows

## 👥 Equipo

- **CTO & Tech Lead:** Edwin
- **Empresa:** 9 personas, Perú

## 📄 Licencia

Propietario - Uso interno
