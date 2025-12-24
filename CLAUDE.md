# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Resumen del Proyecto

Sistema RPA (Robotic Process Automation) con constructor visual de workflows para automatizar tareas repetitivas en aplicaciones Windows (legacy y modernas) y web. Diseñado para usuarios no técnicos.

**Componentes principales:**
- **Frontend:** Aplicación web React con editor visual de workflows
- **Backend:** Firebase (Firestore, Authentication, Hosting)
- **Agente:** Motor Python que ejecuta workflows en Windows

## 🚀 Comandos de Desarrollo

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
pnpm install                    # Instalar dependencias
pnpm run dev                    # Dev server en http://localhost:5173
pnpm run build                  # Build para producción
pnpm run lint                   # ESLint
pnpm run deploy                 # Build + deploy a Firebase
```

### Backend (Firebase)
```bash
cd backend
firebase deploy                 # Deploy completo
firebase deploy --only hosting  # Solo hosting
firebase deploy --only firestore:rules  # Solo reglas Firestore
```

### Agente Windows 10/11
```bash
cd agente-win10
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python app.py                  # Inicia servidor Flask en localhost:5000
```

### Agente Windows 7 (sin Playwright)
```bash
cd agente-win7
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 🏗️ Arquitectura del Sistema

### Flujo de Datos
```
Usuario (Navegador) → Frontend React → Firebase Firestore (workflows)
                          ↓
                    Agente Local (localhost:5000) → Windows Apps/Web
```

### Frontend Architecture

**Estado Global (Zustand):**
- `authStore.ts` - Autenticación Firebase, usuario actual
- `workflowsStore.ts` - Lista de workflows, CRUD operations
- `excelFilesStore.ts` - Archivos Excel/CSV cargados globalmente
- `agentStore.ts` - Estado de conexión con agente local
- `uiStore.ts` - Estado de UI (sidebar, modales)

**Componentes Principales:**
- `WorkflowEditor.tsx` - Canvas principal con @xyflow/react, maneja nodos y conexiones
- `ActionNode.tsx` - Nodo de acción (click, type, wait, navigate, etc.)
- `LoopNode.tsx` - Nodo de loop con soporte para Excel/CSV, N veces, condiciones
- `IfElseNode.tsx` - Nodo condicional con bifurcación
- `LoopCanvasEditor.tsx` - Canvas anidado para editar loops
- `PropertiesPanel.tsx` - Panel lateral para configurar propiedades de nodos
- `VariableSelector.tsx` - Selector de variables con autocompletado

**Páginas:**
- `Dashboard.tsx` - Lista de workflows del usuario
- `Editor.tsx` - Editor visual de workflows
- `Login.tsx` - Autenticación con Firebase

### Backend (Firebase)

**Firestore Collections:**
- `users/{userId}` - Datos del usuario
- `workflows/{workflowId}` - Workflows (nodes, edges, metadata)
  - Reglas de seguridad: solo el creador puede leer/escribir

**Índices compuestos:**
- `workflows: userId (ASC), createdAt (DESC)` - Para queries optimizadas

### Agente Python

**Estructura:**
```
agente-win10/
├── app.py                  # Flask server, endpoints API
├── engine/
│   ├── executor.py         # Ejecutor principal de workflows
│   ├── desktop.py          # Automatización desktop (pywinauto)
│   ├── web.py              # Automatización web (Playwright) - solo Win10/11
│   └── excel.py            # Procesamiento Excel (pandas + pywin32)
```

**Endpoints API:**
- `GET /status` - Estado del agente
- `POST /execute` - Ejecutar workflow (recibe JSON del frontend)
- `POST /upload-excel` - Subir archivo Excel/CSV
- `GET /screenshot` - Screenshot de pantalla para debugging

## 🎨 Patrones de Código

### Tipos de Nodos en Workflows

Cada nodo tiene:
- `id` - UUID único
- `type` - Tipo de nodo: 'action' | 'loop' | 'ifElse'
- `data` - Datos específicos del nodo (actionType, params, etc.)
- `position` - Posición en canvas {x, y}

**Action Node:**
```typescript
{
  actionType: 'click' | 'type' | 'wait' | 'navigate' | 'extract' | 'readText',
  params: {
    selector?: string,      // CSS/XPath selector
    text?: string,          // Texto a escribir (soporta variables {{fila.columna}})
    url?: string,           // URL para navigate
    timeout?: number        // Timeout en ms
  }
}
```

**Loop Node:**
```typescript
{
  loopType: 'excel' | 'times' | 'while' | 'until',
  source?: string,          // Nombre del archivo Excel/CSV
  iterations?: number,      // Para loopType='times'
  condition?: string,       // Para while/until
  childNodes: Node[],       // Nodos dentro del loop
  childEdges: Edge[]
}
```

### Variables en Workflows

Sistema de variables dinámicas:
- Sintaxis: `{{fila.columna}}` - Reemplazado en tiempo de ejecución
- Ejemplo: `{{fila.nombre}}`, `{{fila.email}}`
- Soportado en: text fields, selectors, URLs
- Autocompletado: `VariableSelector` component sugiere columnas disponibles

### Historial de Cambios (Undo/Redo)

El hook `useWorkflowHistory` implementa undo/redo:
- Almacena snapshots del estado del workflow (nodes + edges)
- `undo()` - Retroceder cambio
- `redo()` - Rehacer cambio
- `pushState(nodes, edges)` - Guardar nuevo estado
- Stack size limitado para performance

## 🔧 Convenciones de Código

### Frontend
- **Componentes:** PascalCase, un componente por archivo
- **Hooks:** camelCase, prefijo `use`
- **Stores:** camelCase con sufijo `Store`
- **Tipos:** PascalCase, interfaz con prefijo `I` cuando sea necesario
- **Imports:** Orden: React, third-party, local components, types, styles

### Python (Agente)
- **Funciones:** snake_case
- **Clases:** PascalCase
- **Constantes:** UPPER_SNAKE_CASE
- **Módulos:** snake_case

## 📝 Notas Importantes

### React Flow (@xyflow/react)
- Versión 12.10.0 - Usa sintaxis moderna, no React Flow v11
- Nodos personalizados definidos en `nodeTypes` object
- Handlers: `onNodesChange`, `onEdgesChange`, `onConnect`
- Custom edges con animaciones: `animated: true`

### Firebase
- Variables de entorno en `frontend/.env`
- SDK modular (v12.7.0) - Usa imports específicos: `import { getFirestore } from 'firebase/firestore'`
- Queries optimizadas con índices compuestos (ver `backend/firestore.indexes.json`)

### Agente Windows
- **Win10/11:** Soporta Playwright para web automation
- **Win7:** Solo desktop automation (sin Playwright por limitaciones de Python 3.8)
- pywinauto usa UIA (UI Automation) backend por defecto
- Excel: Usa COM automation (pywin32) cuando Excel está instalado, fallback a pandas+openpyxl

### Estado del Proyecto
- ✅ MVP Frontend completado (editor visual funcional)
- ⏳ Agente en desarrollo (estructura base lista)
- ⏳ Integración frontend-agente pendiente
- ⏳ Sistema de targeting (element picker) en desarrollo

## 🐛 Debugging

### Frontend
```bash
# Ver logs de Firebase
cd frontend
pnpm run dev  # Console logs en navegador

# Inspeccionar estado de Zustand
# En DevTools Console:
window.__ZUSTAND_STORES__  # Si configurado
```

### Agente
```bash
# Ver logs de Flask
cd agente-win10
python app.py  # Logs en consola

# Test endpoint
curl http://localhost:5000/status
```

## 📚 Documentación Adicional

Ver `/docs` para detalles:
- `PRD.md` - Product Requirements Document (versión 3.0)
- `ARQUITECTURA.md` - Diagramas y flujos detallados
- `FIREBASE_SETUP.md` - Configuración de Firebase
- `/frontend/README.md` - Guía específica del frontend
- `/backend/README.md` - Configuración de Firebase
- `/agente-win10/README.md` - Guía del agente

## 🌐 Idioma

**IMPORTANTE:** Todo el código, comentarios, documentación y comunicación debe ser en **español**. El equipo es de Perú y este es el idioma preferido del proyecto.
