# PRD: Sistema RPA Personalizado con Constructor Visual de Workflows

**Versión:** 2.0  
**Fecha:** Diciembre 2024  
**Autor:** Edwin (CTO) + Claude  
**Estado:** Actualizado - Arquitectura Firebase  
**Última actualización:** Diciembre 2024

---

## 📋 Tabla de Contenidos

1. [Visión del Producto](#1-visión-del-producto)
2. [Objetivos y Alcance](#2-objetivos-y-alcance)
3. [User Personas](#3-user-personas)
4. [User Stories Detalladas](#4-user-stories-detalladas)
5. [Arquitectura del Sistema](#5-arquitectura-del-sistema)
6. [Wireframes y Flujos](#6-wireframes-y-flujos)
7. [Especificaciones Funcionales Detalladas](#7-especificaciones-funcionales-detalladas)
8. [Stack Tecnológico](#8-stack-tecnológico)
9. [Roadmap de Desarrollo](#9-roadmap-de-desarrollo)
10. [Criterios de Aceptación Globales](#10-criterios-de-aceptación-globales)
11. [Riesgos y Mitigaciones](#11-riesgos-y-mitigaciones)
12. [Métricas de Éxito](#12-métricas-de-éxito)
13. [Plan de Soporte](#13-plan-de-soporte)
14. [Apéndices](#14-apéndices)
15. [Aprobación](#15-aprobación)

---

## 1. Visión del Producto

### 1.1 Resumen Ejecutivo

Desarrollar un sistema RPA (Robotic Process Automation) que permita a usuarios no técnicos automatizar tareas repetitivas en aplicaciones Windows (legacy y modernas) y web mediante un constructor visual drag-and-drop accesible desde navegador web.

### 1.2 Problema a Resolver
Situación actual:

Empleados realizan tareas repetitivas manualmente (ej: registrar 2000+ contratos de trabajadores)
Cada registro toma múltiples pasos y consume tiempo valioso
Sistemas legacy sin APIs (solo disponibles en Windows 7)
Sistemas modernos (.NET, web) que coexisten con los legacy
Usuarios no tienen conocimientos de programación

Consecuencias:

Pérdida de productividad (horas-hombre desperdiciadas)
Errores humanos en entrada de datos
Imposibilidad de procesar grandes volúmenes rápidamente
Dependencia de personas específicas que conocen los procesos

### 1.3 Solución Propuesta

Un sistema en 3 componentes:

- **Instalador con Diagnóstico:** Detecta y resuelve problemas de compatibilidad antes de instalar
- **Agente Local:** Motor de automatización Python que controla aplicaciones Windows y web
- **Interfaz Web:** Constructor visual de workflows accesible desde navegador

**Diferenciador clave:** UI/UX web profesional + Diagnóstico inteligente + Soporte real para sistemas legacy

## 2. Objetivos y Alcance

### 2.1 Objetivos de Negocio
Primarios:

Reducir 80% el tiempo de tareas repetitivas
Permitir procesar 2000+ registros sin supervisión humana
Democratizar automatización (usuarios no técnicos)

Secundarios:

Crear galería de workflows reutilizables entre equipos
Reducir errores humanos a <1%
Generar ROI positivo en 3 meses

### 2.2 Objetivos Técnicos

- ✅ Soportar Windows 7, 10, 11 (con agentes separados)
- ✅ Automatizar aplicaciones Win32, WinForms, WPF
- ✅ Automatizar navegadores web (Chrome, Edge, Firefox) - solo Win10/11
- ✅ Procesar archivos Excel/CSV con miles de registros
- ✅ Interfaz 100% web (sin instalar UI) - Firebase Hosting
- ✅ Backend sin servidor dedicado (Firebase)
- ✅ Workflows exportables/importables (JSON)
- ✅ Sistema de diagnóstico que identifique problemas específicos

### 2.3 Fuera de Alcance (v1.0)

❌ OCR avanzado con IA
❌ Automatización en Mac/Linux
❌ Reconocimiento de voz
❌ Integración con servicios cloud (AWS, Azure) - para v2.0
❌ Scheduler avanzado con cron - para v1.5


## 3. User Personas

### Persona 1: María - Asistente Administrativa
Demografía:

Edad: 35 años
Rol: Asistente en Recursos Humanos
Experiencia técnica: Básica (usa Excel, Word, email)
Ubicación: Oficina en Lima, Perú

Necesidades:

Registrar 200 contratos nuevos cada mes en sistema legacy
Cada contrato toma 10 minutos manualmente
Copia datos desde Excel al sistema viejo
Necesita solución sin aprender programación

Frustraciones:

El sistema es lento y se cuelga frecuentemente
Errores de tipeo generan problemas legales
Horas extras no remuneradas

Quote: "Si pudiera hacer que la computadora haga esto por mí, podría dedicarme a tareas más importantes"

### Persona 2: Carlos - Analista de Operaciones
Demografía:

Edad: 28 años
Rol: Analista de procesos
Experiencia técnica: Media (Power BI, SQL básico)
Ubicación: Oficina en Atalaya, Ucayali

Necesidades:

Automatizar reportes que extrae de 3 sistemas diferentes
Consolidar datos en Excel maestro
Distribuir reportes por email automáticamente
Crear workflows que otros puedan reutilizar

Frustraciones:

Pierde 2 horas diarias en tareas repetitivas
Los sistemas no tienen APIs
Dependencia de él para generar reportes

Quote: "Entiendo el proceso, pero no sé programar. Necesito algo visual."

## 4. User Stories Detalladas

### Epic 1: Instalación y Configuración
US-1.1: Diagnóstico Pre-Instalación
Como usuario nuevo
Quiero que el sistema detecte automáticamente problemas de compatibilidad
Para saber exactamente qué necesito instalar antes de usar el agente
Criterios de aceptación:

 Instalador verifica: OS, arquitectura, Visual C++, .NET, permisos, espacio disco
 Si algo falta, muestra mensaje específico con link de descarga
 Si todo OK, procede automáticamente con instalación
 Envía reporte de diagnóstico al servidor (telemetría)

Prioridad: P0 (Crítico)

US-1.2: Instalación del Agente
Como usuario
Quiero instalar el agente local fácilmente
Para comenzar a crear automatizaciones
Criterios de aceptación:

 Proceso de instalación <3 minutos
 Instalador crea servicio Windows del agente
 Agente se inicia automáticamente al bootear
 Muestra ícono en system tray con estado

Prioridad: P0 (Crítico)

### Epic 2: Gestión de Estado del Agente
US-2.1: Visualización de Estado en Dashboard
Como usuario
Quiero ver claramente si mi agente está funcionando
Para saber si puedo ejecutar workflows
Criterios de aceptación:

 Banner en header muestra: "✅ Agente conectado" (verde) o "❌ Agente desconectado" (rojo)
 Si está desconectado, muestra botón "Solucionar problema"
 Actualización en tiempo real (polling cada 5 segundos)
 Tooltip muestra última vez conectado

Prioridad: P0 (Crítico)

US-2.2: Página de Diagnóstico y Recursos
Como usuario con problemas
Quiero acceder a una página que me ayude a solucionarlos
Para hacer que mi agente funcione sin soporte técnico
Criterios de aceptación:

 Página muestra checklist de diagnóstico en vivo
 Links directos para descargar: Visual C++, .NET, agente
 Botón "Re-ejecutar diagnóstico" que prueba conexión
 Guía paso a paso con screenshots
 Logs del agente accesibles desde la página

Prioridad: P0 (Crítico)

### Epic 3: Constructor de Workflows
US-3.1: Crear Workflow Nuevo
Como María (asistente administrativa)
Quiero crear un workflow visualmente arrastrando acciones
Para automatizar el registro de contratos
Criterios de aceptación:

 Panel izquierdo con acciones disponibles (Click, Type, Wait, Loop, If, Excel)
 Canvas central donde arrastro y conecto acciones
 Panel derecho para configurar propiedades de acción seleccionada
 Validación en tiempo real (no permite conexiones inválidas)
 Auto-guardado cada 30 segundos

Prioridad: P0 (Crítico)

US-3.2: Seleccionar Elementos de Aplicaciones (Target)
Como usuario
Quiero seleccionar fácilmente dónde hacer click o escribir
Para no tener que conocer IDs técnicos de elementos
Criterios de aceptación:

 Botón "🎯 Seleccionar elemento" en configuración de acción
 Al presionar, minimiza navegador y activa inspector en agente
 Usuario mueve mouse sobre aplicación y elementos se resaltan en rojo
 CTRL+Click captura elemento
 Muestra screenshot + propiedades del elemento en navegador
 Usuario confirma o reintenta selección

Prioridad: P0 (Crítico)

US-3.3: Procesar Datos desde Excel/CSV
Como María
Quiero leer datos de Excel y procesar cada fila
Para registrar 200 contratos automáticamente
Criterios de aceptación:

 Acción "Excel Read" permite cargar archivo
 Acción "Loop" itera sobre filas del Excel
 Variables {{nombre}}, {{rut}}, etc. se reemplazan en acciones
 Progress bar muestra: "Procesando fila 45 de 200"
 Si falla una fila, continúa con siguiente (error log guardado)
 Al terminar, genera reporte de éxitos/fallos

Prioridad: P0 (Crítico)

US-3.4: Guardar y Ejecutar Workflow
Como usuario
Quiero guardar mi workflow y ejecutarlo
Para probar que funciona correctamente
Criterios de aceptación:

 Botón "💾 Guardar" persiste workflow en servidor
 Botón "▶️ Ejecutar" envía workflow al agente local
 Panel de logs muestra ejecución en tiempo real
 Si hay error, resalta paso que falló
 Puede pausar/detener ejecución en cualquier momento

Prioridad: P0 (Crítico)

### Epic 4: Galería y Compartir
US-4.1: Exportar Workflow
Como Carlos (analista)
Quiero exportar mi workflow como archivo
Para compartirlo con mi equipo por email/WhatsApp
Criterios de aceptación:

 Botón "⬇️ Exportar" descarga archivo .rpa.json
 Incluye metadata: autor, fecha, descripción
 Puede incluir capturas de pantalla de cada paso

Prioridad: P1

US-4.2: Importar Workflow
Como usuario
Quiero importar workflows que otros crearon
Para reutilizarlos en mi trabajo
Criterios de aceptación:

 Botón "📂 Importar" permite cargar .rpa.json
 Valida que selectores sean compatibles con mi sistema
 Si algo no es compatible, muestra advertencias

Prioridad: P1

US-4.3: Galería de Workflows Públicos
Como usuario
Quiero ver workflows que otros compartieron públicamente
Para no reinventar la rueda
Criterios de aceptación:

 Página "Galería" muestra workflows públicos con thumbnails
 Filtros: categoría, popularidad, autor
 Botón "Usar este workflow" lo clona a mi cuenta
 Rating y comentarios de otros usuarios

Prioridad: P2

## 5. Arquitectura del Sistema

### 5.1 Decisión Arquitectónica: Firebase vs Backend Dedicado

**¿Por qué Firebase y no un backend dedicado (NestJS/PostgreSQL)?**

Después de analizar los requisitos del sistema, se decidió usar **Firebase** en lugar de un backend dedicado por las siguientes razones:

1. **No necesitamos servidor dedicado:**
   - El agente corre localmente en la PC del usuario
   - La comunicación frontend ↔ agente es directa (localhost:5000)
   - No hay procesamiento pesado en servidor
   - Solo necesitamos almacenar workflows y autenticación

2. **Ventajas de Firebase:**
   - ✅ **Setup rápido:** Configuración en minutos vs días
   - ✅ **Sin servidor que mantener:** Google maneja infraestructura
   - ✅ **Escalabilidad automática:** De 0 a 1000 usuarios sin cambios
   - ✅ **Costo:** Gratis hasta 50 usuarios, luego ~$5-20/mes
   - ✅ **Hosting incluido:** CDN global automático
   - ✅ **Real-time:** Firestore actualizaciones en tiempo real
   - ✅ **Seguridad:** Reglas de Firestore integradas

3. **Lo que NO necesitamos:**
   - ❌ Servidor Node.js corriendo 24/7
   - ❌ Base de datos PostgreSQL que mantener
   - ❌ WebSocket server (agente usa HTTP directo)
   - ❌ Redis para cache (no necesario)
   - ❌ Deployment complejo (Railway/AWS)

**Conclusión:** Firebase es la solución perfecta porque solo necesitamos almacenar datos y autenticación. Todo el procesamiento pesado ocurre en el agente local.

### 5.2 Diagrama de Arquitectura Actualizado

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE (Google Cloud)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐     │
│  │  Firestore   │  │    Auth      │  │  Hosting + CDN  │     │
│  │  (Workflows) │  │  (Usuarios)  │  │  (React App)    │     │
│  │  NoSQL DB    │  │  Email/Pwd   │  │  Firebase Host  │     │
│  └──────────────┘  └──────────────┘  └─────────────────┘     │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS
                         │
        ┌────────────────▼─────────────────────┐
        │    NAVEGADOR (Chrome, Edge, Firefox) │
        │    https://mi-rpa.web.app            │
        │                                       │
        │  - Constructor visual (React Flow)   │
        │  - Auth (Firebase SDK)               │
        │  - Guardar workflows (Firestore)       │
        │  - State (Zustand)                    │
        └────────────┬──────────────────────────┘
                     │
                     │ HTTP directo (localhost:5000)
                     │ (sin pasar por servidor)
                     │
    ┌────────────────▼────────────────────────────────────┐
    │         PC DEL USUARIO (Windows)                    │
    │                                                      │
    │  ┌────────────────────────────────────────────┐    │
    │  │   AGENTE LOCAL (Python + Flask)            │    │
    │  │   Puerto: localhost:5000                   │    │
    │  │   CORS: habilitado para Firebase           │    │
    │  │   - pywinauto engine (desktop)            │    │
    │  │   - Playwright engine (web, solo Win10+)  │    │
    │  │   - Excel engine (pandas + pywin32)       │    │
    │  │   - Workflow executor                      │    │
    │  └────────────────────────────────────────────┘    │
    │                          │                         │
    │         ┌────────────────┼────────────────┐        │
    │         │                │                │        │
    │    ┌────▼─────┐   ┌─────▼──────┐   ┌────▼─────┐ │
    │    │ Apps     │   │ Navegador  │   │ Excel    │ │
    │    │ Win32    │   │ Web        │   │ CSV      │ │
    │    │ WinForms │   │ Chromium   │   │ Office   │ │
    │    │ WPF      │   │ (Playwright)│   │          │ │
    │    └──────────┘   └────────────┘   └──────────┘ │
    └────────────────────────────────────────────────────┘
```

### 5.3 Agentes Separados: Windows 7 vs Windows 10/11

**Decisión:** Mantener agentes completamente separados para Windows 7 y Windows 10/11.

**Razones técnicas:**

1. **Windows 7 tiene limitaciones:**
   - Python máximo: 3.8 (no soporta 3.10+)
   - Playwright NO funciona en Win7
   - Algunas librerías modernas incompatibles
   - Requiere Visual C++ 2015 (no 2015-2022)

2. **Windows 10/11 es más moderno:**
   - Python 3.10+ disponible
   - Playwright funciona perfectamente
   - Todas las librerías modernas compatibles
   - Visual C++ 2015-2022 requerido

**Razón de negocio (clave):**

3. **Automatización web no es necesaria en Win7:**
   - 🌐 **La web se puede usar en cualquier SO:** Si un usuario necesita automatizar una aplicación web, puede hacerlo desde cualquier sistema operativo (Windows 10/11, Mac, Linux, etc.)
   - 🎯 **Win7 es para sistemas legacy:** Los usuarios de Windows 7 generalmente necesitan automatizar aplicaciones desktop legacy (Win32, WinForms) que solo corren en Windows
   - 💡 **Separación lógica:** No tiene sentido incluir ~50MB de Playwright en Win7 si la automatización web se puede hacer desde cualquier otro SO
   - ✅ **Instalador más ligero:** Win7 sin Playwright = ~150MB vs ~200MB (25% más pequeño)

**Beneficios de separación:**

- ✅ Instalador más pequeño para Win7 (~150MB vs ~200MB)
- ✅ Menos dependencias en Win7 (sin Playwright)
- ✅ Menos errores de compatibilidad
- ✅ Mantenimiento más simple
- ✅ Usuarios Win7 no descargan código innecesario
- ✅ Separación clara de responsabilidades: Win7 = Desktop legacy, Win10/11 = Desktop + Web

**Estructura de agentes:**

```
agente-win7/
├── app.py              # Flask server (ligero)
├── engine/
│   ├── desktop.py      # pywinauto (UIA + Win32)
│   ├── excel.py        # pandas + pywin32
│   └── executor.py     # Workflow executor
└── requirements.txt    # Python 3.8 compatible

agente-win10/
├── app.py              # Flask server (completo)
├── engine/
│   ├── desktop.py      # pywinauto (UIA + Win32)
│   ├── web.py          # Playwright (solo Win10+)
│   ├── excel.py        # pandas + openpyxl + pywin32
│   └── executor.py     # Workflow executor
└── requirements.txt    # Python 3.10+ compatible
```

### ### 5.4 Flujo de Datos

#### Creación de Workflow:
```
Usuario (navegador)
  ↓
Frontend (React)
  ↓
Firebase Firestore (almacenamiento)
  ↓
Workflow guardado en cloud
```

#### Ejecución de Workflow:
```
1. Usuario presiona "Ejecutar" (navegador)
   ↓
2. Frontend carga workflow desde Firestore
   ↓
3. Frontend envía workflow al agente (HTTP localhost:5000)
   ↓
4. Agente ejecuta acciones en Windows
   ↓
5. Agente envía logs en tiempo real al frontend (HTTP polling/SSE)
   ↓
6. Frontend actualiza UI con progreso
   ↓
7. Usuario ve progreso en navegador
```

**Nota:** No hay servidor intermedio. La comunicación es directa entre frontend y agente local.

## 6. Wireframes y Flujos

### 6.1 Pantalla: Dashboard Principal
┌────────────────────────────────────────────────────────────────────┐
│  🤖 RPA System                      [👤 Edwin] [⚙️ Config] [🚪 Salir]│
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ✅ Agente conectado (última conexión: hace 2 segundos)      │  │
│  │    Windows 10 Pro • Python 3.10.5 • pywinauto 0.6.8        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │              │  │              │  │              │            │
│  │ [+] Nuevo    │  │ [📂] Mis     │  │ [🌐] Galería │            │
│  │  Workflow    │  │  Workflows   │  │              │            │
│  │              │  │              │  │              │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  Workflows Recientes:                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📋 Registro de Contratos        [▶️] [✏️] [📋] [🗑️]         │ │
│  │    Última ejecución: hace 2 horas • 200 registros • ✅ OK    │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 📊 Reporte Diario               [▶️] [✏️] [📋] [🗑️]         │ │
│  │    Última ejecución: hace 1 día • 15 pasos • ✅ OK          │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 📧 Envío Masivo Emails          [▶️] [✏️] [📋] [🗑️]         │ │
│  │    Última ejecución: hace 3 días • ⚠️ 3 fallos              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
### 6.2 Pantalla: Dashboard (Agente Desconectado)
┌────────────────────────────────────────────────────────────────────┐
│  🤖 RPA System                      [👤 Edwin] [⚙️ Config] [🚪 Salir]│
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ❌ Agente desconectado                                       │  │
│  │    Última conexión: hace 15 minutos                         │  │
│  │    [🔧 Solucionar Problema] [↻ Reintentar Conexión]         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ⚠️ No puedes ejecutar workflows sin el agente conectado           │
│                                                                     │
│  [Ver Workflows] (Solo lectura)                                    │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
### 6.3 Pantalla: Diagnóstico y Recursos
┌────────────────────────────────────────────────────────────────────┐
│  ← Volver                        Diagnóstico del Sistema            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Estado del Agente: ❌ Desconectado                                 │
│  [↻ Re-ejecutar Diagnóstico Completo]                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ✅ Sistema Operativo: Windows 10 Pro x64                     │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ ❌ Visual C++ Redistributable: NO INSTALADO                  │  │
│  │    [⬇️ Descargar VC++ 2015-2022]                             │  │
│  │    https://aka.ms/vs/17/release/vc_redist.x64.exe           │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ ✅ .NET Framework 4.8: Instalado                             │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ ⚠️ Agente RPA: Versión antigua (v1.2.0)                      │  │
│  │    Versión más reciente: v1.5.1                             │  │
│  │    [⬇️ Actualizar Agente]                                    │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ ✅ Conectividad al servidor: OK (45ms)                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Recursos de Instalación:                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📦 Instalador Completo del Agente (v1.5.1)                   │  │
│  │    Windows 7/10/11 • 195 MB                                 │  │
│  │    [⬇️ Descargar] [📄 Guía de Instalación]                   │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ 📦 Visual C++ Redistributable 2015-2022                      │  │
│  │    Requerido para pywinauto • 25 MB                         │  │
│  │    [⬇️ Descargar] [📄 Instrucciones]                         │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ 📦 .NET Framework 4.8                                        │  │
│  │    Requerido para apps .NET • 115 MB                        │  │
│  │    [⬇️ Descargar] [📄 Instrucciones]                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  📹 Videos Tutoriales:                                              │
│    • Cómo instalar el agente paso a paso (3:45)                    │
│    • Solucionar problemas comunes (5:20)                           │
│    • Agregar excepción en Windows Defender (2:10)                  │
│                                                                     │
│  Logs del Agente (últimas 24 horas):                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [2024-12-23 10:45:32] INFO: Agente iniciado                  │  │
│  │ [2024-12-23 10:45:35] ERROR: No se pudo conectar a servidor  │  │
│  │ [2024-12-23 10:45:35] ERROR: Socket timeout after 5s         │  │
│  │ [Ver logs completos]                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
### 6.4 Pantalla: Constructor de Workflows
┌────────────────────────────────────────────────────────────────────────────────┐
│ ← Workflows    Registro de Contratos    [💾 Guardar] [▶️ Ejecutar] [⚙️ Config] │
├───────────────┬────────────────────────────────────────────────┬───────────────┤
│               │                                                │               │
│  ACCIONES     │              CANVAS DE WORKFLOW                │  PROPIEDADES  │
│               │                                                │               │
│ 🖱️  Click     │  ┌─────────────────────┐                      │  Acción:      │
│ ⌨️  Escribir  │  │  1. Excel Read      │                      │  Excel Read   │
│ ⏸️  Esperar   │  │  "contratos.xlsx"   │                      │               │
│ 🔄 Loop       │  └──────────┬──────────┘                      │  Archivo:     │
│ ❓ If/Else    │             │                                  │  [📂] Buscar  │
│ 📊 Excel      │  ┌──────────▼──────────┐                      │               │
│   • Read      │  │  2. Loop            │                      │  Hoja:        │
│   • Write     │  │  sobre "contratos"  │                      │  [Hoja1   ▼] │
│ 🌐 Web        │  └──────────┬──────────┘                      │               │
│   • Navigate  │             │                                  │  Guardar en:  │
│   • Click     │  ┌──────────▼──────────┐                      │  [contratos]  │
│   • Fill      │  │  3. Click           │                      │               │
│ 💾 Archivo    │  │  App: "ERP v2.1"    │                      │  [Aplicar]    │
│   • Leer      │  │  Btn: "Nuevo"       │                      │               │
│   • Escribir  │  └──────────┬──────────┘                      │               │
│               │             │                                  │               │
│ [+ Custom]    │  ┌──────────▼──────────┐                      │               │
│               │  │  4. Escribir        │                      │               │
│               │  │  Campo: "Nombre"    │                      │               │
│               │  │  {{nombre}}         │                      │               │
│               │  └──────────┬──────────┘                      │               │
│               │             │                                  │               │
│               │  ┌──────────▼──────────┐                      │               │
│               │  │  5. Escribir        │                      │               │
│               │  │  Campo: "RUT"       │                      │               │
│               │  │  {{rut}}            │                      │               │
│               │  └──────────┬──────────┘                      │               │
│               │             │                                  │               │
│               │  ┌──────────▼──────────┐                      │               │
│               │  │  6. Click           │                      │               │
│               │  │  Btn: "Guardar"     │                      │               │
│               │  └─────────────────────┘                      │               │
│               │                                                │               │
│               │  [+ Agregar acción aquí]                       │               │
│               │                                                │               │
├───────────────┴────────────────────────────────────────────────┴───────────────┤
│  Variables disponibles: {{nombre}}, {{rut}}, {{fecha_inicio}}, {{salario}}     │
│  [Ver todas las variables]                                                     │
└────────────────────────────────────────────────────────────────────────────────┘
### 6.5 Pantalla: Selector de Elementos (Target Picker)
┌────────────────────────────────────────────────────────────────┐
│  Seleccionar Elemento                            [✕ Cancelar]  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Modo de selección activo en su computadora                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  🎯 Inspector de Elementos Activado                    │   │
│  │                                                         │   │
│  │  1. Mueva el mouse sobre el elemento deseado           │   │
│  │  2. El elemento se resaltará en rojo                   │   │
│  │  3. Presione CTRL + Click para capturarlo              │   │
│  │                                                         │   │
│  │  [🎥 Ver tutorial en video (1:30)]                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⏳ Esperando que seleccione un elemento...                     │
│                                                                 │
│  [Cancelar Selección]                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

Después de seleccionar:

┌────────────────────────────────────────────────────────────────┐
│  Elemento Capturado                              [✕ Cancelar]  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Elemento seleccionado exitosamente                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  [Screenshot del botón capturado]                      │   │
│  │   ┌────────────┐                                       │   │
│  │   │  Guardar   │                                       │   │
│  │   └────────────┘                                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Información del elemento:                                     │
│  • Aplicación: Sistema ERP v2.1                                │
│  • Tipo: Button                                                │
│  • Texto: "Guardar"                                            │
│  • ID: btn_guardar_contrato                                    │
│  • Clase: WindowsForms10.BUTTON.app.0.141b42a_r13_ad1          │
│                                                                 │
│  [✓ Usar Este Elemento]  [🔄 Seleccionar Otro]                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
### 6.6 Pantalla: Ejecución de Workflow
┌────────────────────────────────────────────────────────────────┐
│  Ejecutando: Registro de Contratos              [⏸️ Pausar]    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progreso General:                                             │
│  ████████████████░░░░░░░░░░  65% (130/200 registros)          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Registro actual: #131                                 │   │
│  │  • Nombre: Juan Carlos Mendoza López                   │   │
│  │  • RUT: 15.234.567-8                                   │   │
│  │  • Fecha inicio: 01/01/2025                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Paso actual:                                                  │
│  ▶️ 4. Escribir en campo "Nombre"                               │
│     Escribiendo: "Juan Carlos Mendoza López"                   │
│                                                                 │
│  Logs de ejecución:                                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ [10:45:32] ✅ Registro #130 completado                  │   │
│  │ [10:45:35] ℹ️ Iniciando registro #131                   │   │
│  │ [10:45:36] ✅ Click en botón "Nuevo" exitoso            │   │
│  │ [10:45:37] ✅ Campo "Nombre" encontrado                 │   │
│  │ [10:45:37] ▶️ Escribiendo en campo "Nombre"...          │   │
│  │                                                         │   │
│  │ [Ver logs completos]                                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Estadísticas:                                                 │
│  • Tiempo transcurrido: 21 minutos 15 segundos                │
│  • Tiempo estimado restante: 10 minutos                       │
│  • Éxitos: 130                                                 │
│  • Fallos: 0                                                   │
│  • Velocidad: 6.1 registros/minuto                            │
│                                                                 │
│  [⏸️ Pausar] [⏹️ Detener] [📊 Ver Detalle]                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
### 6.7 Proceso de Instalación (Wizard)
Pantalla 1: Bienvenida
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│         🤖 Instalador del Agente RPA                            │
│                                                                 │
│         Versión 1.5.1 para Windows 7/10/11                     │
│                                                                 │
│                                                                 │
│         Este asistente instalará el agente RPA en              │
│         su computadora.                                        │
│                                                                 │
│         Antes de continuar, verificaremos que su               │
│         sistema cumple con los requisitos.                     │
│                                                                 │
│                                                                 │
│                                                                 │
│                     [Siguiente >]  [Cancelar]                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

Pantalla 2: Diagnóstico
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│         Verificando sistema...                                 │
│                                                                 │
│         ✅ Sistema operativo: Windows 10 Pro x64                │
│         ✅ Espacio en disco: 15.3 GB disponible                 │
│         ✅ .NET Framework 4.8 instalado                         │
│         ❌ Visual C++ Redistributable NO instalado              │
│         ✅ Permisos de administrador: OK                        │
│         ✅ Conectividad al servidor: OK (32ms)                  │
│                                                                 │
│         ⚠️ Se encontraron 1 problema que debe resolver:         │
│                                                                 │
│         Visual C++ Redistributable 2015-2022 (x64)             │
│         Este componente es REQUERIDO para que el agente        │
│         funcione correctamente.                                │
│                                                                 │
│         [📥 Descargar e Instalar Automáticamente]              │
│         [↓ Descargar Manualmente]                              │
│                                                                 │
│                     [< Atrás]  [Cancelar]                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

Pantalla 3: Instalando (después de resolver problemas)
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│         Instalando Agente RPA...                               │
│                                                                 │
│         ████████████████████░░░░░░  75%                        │
│                                                                 │
│         Instalando pywinauto y dependencias...                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

Pantalla 4: Completado
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│         ✅ Instalación Completada                               │
│                                                                 │
│         El Agente RPA se ha instalado correctamente.           │
│                                                                 │
│         🎉 ¡Ya puedes comenzar a crear automatizaciones!        │
│                                                                 │
│                                                                 │
│         Próximos pasos:                                        │
│         1. El agente se iniciará automáticamente               │
│         2. Abre tu navegador en: https://rpa.tuempresa.com     │
│         3. Inicia sesión con tu cuenta                         │
│         4. Verifica que el agente aparezca conectado           │
│                                                                 │
│                                                                 │
│         [Ver Tutorial]  [Finalizar]                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

## 7. Especificaciones Funcionales Detalladas

### 7.1 Sistema de Acciones
Acciones de Escritorio (Desktop)
1. Click

Input: Selector del elemento
Output: None
Opciones:

Tipo de click: Left/Right/Double
Delay después: 0-10 segundos
Continuar si falla: Sí/No



2. Escribir (Type)

Input: Selector + Texto
Output: None
Opciones:

Velocidad: Rápido/Normal/Lento (simula humano)
Limpiar campo antes: Sí/No
Variables: {{variable}}



3. Leer Texto (Read)

Input: Selector
Output: Variable con texto leído
Opciones:

Nombre de variable destino
Trim espacios: Sí/No



4. Esperar (Wait)

Input: Condición o tiempo
Output: None
Tipos:

Tiempo fijo: X segundos
Hasta que elemento aparezca
Hasta que elemento desaparezca



Acciones Web
5. Navegar

Input: URL
Output: None
Opciones:

Navegador: Chrome/Edge/Firefox
Esperar carga completa: Sí/No



6. Click Web

Input: Selector CSS/XPath
Output: None
Similar a Click desktop

7. Llenar Campo Web

Input: Selector + Valor
Output: None
Tipos de campo: text, textarea, select, checkbox

Acciones Excel
8. Leer Excel

Input: Ruta archivo + Hoja
Output: Variable tipo tabla
Opciones:

Primera fila como headers: Sí/No
Rango específico: A1:Z100



9. Escribir Excel

Input: Ruta + Celda + Valor
Output: None
Métodos:

COM (mantiene formato)
openpyxl (más rápido)



Control de Flujo
10. Loop (Bucle)

Input: Variable tipo lista/tabla
Output: Variable item actual
Opciones:

Máximo iteraciones
Break on error: Sí/No



11. If/Else (Condicional)

Input: Condición
Output: None
Operadores:

==, !=, >, <, contains, exists



12. Try/Catch

Input: Acciones a intentar
Output: None
Manejo de errores personalizado

### 7.2 Sistema de Variables
Tipos de variables:

String: {{nombre}}
Number: {{cantidad}}
Boolean: {{activo}}
List: {{lista_items}}
Table: {{contratos}} (desde Excel)

Scope:

Global: Disponible en todo el workflow
Loop: Solo dentro de un bucle específico

Operaciones:

Concatenar: {{nombre}} {{apellido}}
Matemáticas: {{precio}} * 1.18 (IGV 18%)
Funciones: {{UPPERCASE(nombre)}}, {{DATE_FORMAT(fecha, "DD/MM/YYYY")}}


## 8. Stack Tecnológico

### 8.1 Frontend

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| **Framework** | React | 18.2+ | UI framework |
| **Lenguaje** | TypeScript | 5.2+ | Type safety |
| **Build Tool** | Vite | 5.0+ | Build rápido |
| **State Management** | Zustand | 4.4+ | Estado global |
| **Workflow Editor** | React Flow | 11.10+ | Constructor visual |
| **HTTP Client** | Axios | 1.6+ | Comunicación con agente |
| **UI Components** | Radix UI | Latest | Componentes accesibles |
| **Styling** | Tailwind CSS | 3.3+ | Utility-first CSS |
| **Routing** | React Router | 6.20+ | Navegación |
| **Backend Services** | Firebase SDK | 10.7+ | Firestore + Auth |
| **Deployment** | Firebase Hosting | - | CDN global automático |

### 8.2 Backend (Firebase)

| Servicio | Tecnología | Propósito |
|----------|-----------|-----------|
| **Database** | Firestore (NoSQL) | Almacenar workflows, configuraciones |
| **Authentication** | Firebase Auth | Email/Password, Google Sign-In |
| **Hosting** | Firebase Hosting | Deploy automático con CDN |
| **Storage** | Cloud Storage | Archivos exportados (.rpa.json) |
| **Real-time** | Firestore Listeners | Actualizaciones en tiempo real |

**Ventajas:**
- ✅ Sin servidor que mantener
- ✅ Escalabilidad automática
- ✅ Costo: Gratis hasta 50 usuarios
- ✅ Setup en minutos

### 8.3 Agente Local

#### Agente Windows 10/11 (Completo)

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| **Lenguaje** | Python | 3.10+ | Runtime |
| **Web Server** | Flask | Latest | API REST local |
| **CORS** | Flask-CORS | Latest | Permitir conexiones frontend |
| **Desktop Automation** | pywinauto | 0.6.8+ | Control apps Windows (UIA + Win32) |
| **Web Automation** | Playwright | Latest | Control navegadores web |
| **Excel Processing** | pandas | Latest | Leer/escribir Excel/CSV |
| **Excel COM** | pywin32 | Latest | Mantener formato Excel |
| **Packaging** | Nuitka | Latest | Compilar a .exe |
| **Installer** | Inno Setup | Latest | Wizard de instalación |
| **Auto-update** | pyupdater | Latest | Actualizaciones automáticas |

**Tamaño estimado:** ~200MB (con Playwright)

#### Agente Windows 7 (Ligero)

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| **Lenguaje** | Python | 3.8 | Runtime (máximo compatible) |
| **Web Server** | Flask | Latest | API REST local |
| **CORS** | Flask-CORS | Latest | Permitir conexiones frontend |
| **Desktop Automation** | pywinauto | 0.6.8+ | Control apps Windows (UIA + Win32) |
| **Web Automation** | ❌ NO | - | No disponible en Win7 |
| **Excel Processing** | pandas | Latest | Leer/escribir Excel/CSV |
| **Excel COM** | pywin32 | Latest | Mantener formato Excel |
| **Packaging** | Nuitka | Latest | Compilar a .exe |
| **Installer** | Inno Setup | Latest | Wizard de instalación |

**Tamaño estimado:** ~150MB (sin Playwright)

**Diferencias clave:**
- Win7: Python 3.8 máximo, sin Playwright
- Win10/11: Python 3.10+, con Playwright

## 9. Roadmap de Desarrollo

### Fase 0: Setup Inicial (Semana 1)

- [x] Crear repositorios Git (frontend, agente-win7, agente-win10)
- [x] Configurar Firebase (proyecto, Auth, Firestore, Hosting)
- [x] Setup estructura de agentes (Win7 y Win10 separados)
- [x] Documentación de arquitectura
- [x] Configurar CORS en agentes para Firebase

**Estado:** ✅ Completado

### Fase 1: MVP Core (Semanas 2-4)

#### Firebase (Backend):
- [x] Configuración Firebase completa
- [ ] Auth UI (login, registro) - Firebase Auth
- [ ] CRUD workflows (crear, leer, actualizar, eliminar) - Firestore
- [ ] Reglas de seguridad Firestore

#### Frontend:
- [x] Estructura base React + TypeScript + Vite
- [ ] Auth UI (login, registro) con Firebase SDK
- [ ] Dashboard principal
- [ ] Lista de workflows
- [ ] Banner estado del agente (conexión real)

#### Agente:
- [x] Flask server básico (Win7 y Win10)
- [x] Health check endpoint
- [ ] 3 acciones: Click, Type, Wait (desktop)
- [ ] Ejecutor de workflows simple

**Entregable:** Sistema funcional con 3 acciones básicas

### Fase 2: Constructor Visual (Semanas 5-7)

#### Frontend:
- [ ] Implementar React Flow
- [ ] Drag & drop de acciones
- [ ] Panel de propiedades dinámico
- [ ] Conexión entre nodos
- [ ] Validación de flujos
- [ ] Auto-guardado en Firestore

#### Firebase:
- [ ] Schema de workflows en Firestore
- [ ] Validación de workflows (client-side + Firestore rules)

#### Agente:
- [ ] Parser de workflows con nodos conectados
- [ ] Logging estructurado
- [ ] Endpoint `/execute` completo

**Entregable:** Constructor visual funcional

### Fase 3: Targeting System (Semanas 8-9)

#### Agente:
- [ ] Inspector de elementos (element picker)
- [ ] Overlay con resaltado de elementos
- [ ] Captura CTRL+Click
- [ ] Extracción de selectores (auto_id, name, class, etc.)
- [ ] Screenshot de elemento capturado
- [ ] Endpoint `/picker/start` y `/picker/capture`

#### Frontend:
- [ ] Modal "Seleccionar elemento"
- [ ] Visualización de elemento capturado
- [ ] Confirmación/Retry
- [ ] Integración con React Flow

**Entregable:** Sistema de targeting funcional

### Fase 4: Excel + Loop (Semanas 10-11)

#### Agente:
- [ ] Acción Excel Read (pandas) - Win7 y Win10
- [ ] Acción Excel Write (COM + openpyxl) - Win10, COM solo - Win7
- [ ] Acción Loop sobre datos
- [ ] Sistema de variables {{placeholder}}
- [ ] Reemplazo de variables en acciones

#### Frontend:
- [ ] Configuración de Excel Read
- [ ] Configuración de Loop
- [ ] Visualización de variables disponibles
- [ ] Preview de datos Excel

**Entregable:** Procesamiento bulk de Excel funcional

### Fase 5: Instalador + Diagnóstico (Semanas 12-13)

#### Instalador:
- [ ] Script diagnóstico completo (Python)
- [ ] Wizard Inno Setup (separado Win7 y Win10)
- [ ] Descarga automática de dependencias
- [ ] Health check post-instalación
- [ ] Detección automática de versión Windows

#### Firebase:
- [ ] Colección `diagnostics` en Firestore (telemetría)
- [ ] Dashboard admin de fallos comunes (opcional)

#### Frontend:
- [ ] Página "Diagnóstico y Recursos"
- [ ] Visualización estado del agente en tiempo real
- [ ] Guías troubleshooting
- [ ] Links de descarga directos

**Entregable:** Instalador robusto con diagnóstico

### Fase 6: Web Automation (Semanas 14-15)

**Nota:** Solo para agente Windows 10/11. Win7 NO incluye esta funcionalidad.

#### Agente Win10/11:
- [ ] Integración Playwright completa
- [ ] Acciones web: Navigate, Click, Fill, Read
- [ ] Selector inspector para web (Playwright recorder)
- [ ] Soporte Chrome, Edge, Firefox

#### Frontend:
- [ ] Switch Desktop/Web en constructor
- [ ] Configuración de acciones web
- [ ] Detección automática de capacidades del agente

**Entregable:** Automatización web funcional (solo Win10/11)

### Fase 7: Galería + Compartir (Semanas 16-17)

#### Firebase:
- [ ] Colección `publicWorkflows` en Firestore
- [ ] Reglas de seguridad para workflows públicos
- [ ] Cloud Storage para archivos exportados (.rpa.json)

#### Frontend:
- [ ] Página galería con filtros
- [ ] Exportar/Importar workflows (JSON)
- [ ] Rating y comentarios
- [ ] Compartir workflows públicamente

**Entregable:** Sistema de compartir workflows

Fase 8: Polish + Testing (Semanas 18-20)

 Tests unitarios (>70% cobertura)
 Tests E2E (Playwright frontend, Pytest agente)
 Performance optimization
 Refactor código crítico
 Documentación completa
 Videos tutoriales

Entregable: Producto production-ready

## 10. Criterios de Aceptación Globales

### 10.1 Performance

 Agente inicia en <5 segundos
 Frontend carga en <2 segundos (3G)
 Workflows guardan en <500ms
 Targeting captura elemento en <200ms

### 10.2 Compatibilidad

 Windows 7 SP1 o superior
 Apps Win32, WinForms, WPF, UWP
 Chrome, Edge, Firefox (últimas 2 versiones)
 Excel 2010 o superior

### 10.3 Seguridad

| Aspecto | Implementación |
|---------|----------------|
| **Autenticación** | Firebase Auth (Email/Password, Google) |
| **Passwords** | Hasheados automáticamente por Firebase |
| **HTTPS** | Obligatorio (Firebase Hosting) |
| **Firestore Rules** | Validación server-side por usuario |
| **CORS** | Configurado solo para dominio Firebase |
| **Agente Local** | Solo acepta conexiones localhost |
| **Validación Input** | Client-side (Zod) + Firestore rules |

### 10.4 Usabilidad

 Onboarding <5 minutos para usuario nuevo
 Tutorial interactivo en primer uso
 Mensajes de error claros y accionables
 Responsive design (desktop + tablet)


## 11. Riesgos y Mitigaciones
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Problemas compatibilidad Win7 | Alta | Alto | Sistema diagnóstico robusto + soporte específico Win7 + agentes separados |
| pywinauto no detecta elementos | Media | Alto | Cascada de estrategias (UIA → win32 → coords → OCR) |
| Antivirus bloquea agente | Media | Alto | Firma digital del ejecutable + guía de excepciones |
| Conexión HTTP inestable | Media | Medio | Reconnection automática + retry logic + health check periódico |
| Usuario no técnico confundido | Alta | Medio | Tutorial interactivo + videos + tooltips contextuales |
| Excel corrupto durante escritura | Baja | Alto | Backup automático antes de modificar + modo safe-write |
| Workflow colgado infinitamente | Media | Medio | Timeout por paso + botón "Forzar detención" |
| Firebase quota excedida | Baja | Medio | Monitoreo de uso + alertas + plan de escalamiento |

## 12. Métricas de Éxito
KPIs del Producto (6 meses post-lanzamiento)
Adopción:

50+ usuarios activos mensuales
200+ workflows creados
80% usuarios completan onboarding

Engagement:

Promedio 3 workflows ejecutados/usuario/semana
Tiempo promedio workflow: 15 minutos
30% workflows son reutilizados (importados)

Calidad:

<5% tasa de fallos en workflows
<10% tickets de soporte por problemas de instalación
4.5/5 rating promedio del producto

Impacto:

80% reducción tiempo en tareas automatizadas
ROI positivo en 3 meses
90% satisfacción de usuarios


## 13. Plan de Soporte
Documentación

Wiki técnica completa
Videos tutoriales (5-10 videos)
FAQ con problemas comunes
Guía troubleshooting paso a paso

Canales de Soporte

Email: soporte@rpa.tuempresa.com
Chat en aplicación (Intercom/similar)
WhatsApp Business (para Perú)
Foro comunitario (opcional v2.0)

SLA

Respuesta inicial: <24 horas
Resolución bugs críticos: <72 horas
Actualizaciones de seguridad: <7 días


## 14. Apéndices

### A. Glosario

Agente: Aplicación instalada localmente que ejecuta automatizaciones
Workflow: Secuencia de acciones automatizadas
Selector: Identificador único de un elemento UI
Target: Elemento sobre el cual se ejecuta una acción
Backend UIA/win32: Tecnologías de Microsoft para acceder a elementos UI

### B. Referencias Técnicas

- **pywinauto docs:** https://pywinauto.readthedocs.io/
- **React Flow docs:** https://reactflow.dev/
- **Playwright docs:** https://playwright.dev/python/
- **Firebase docs:** https://firebase.google.com/docs
- **Flask docs:** https://flask.palletsprojects.com/
- **Firestore rules:** https://firebase.google.com/docs/firestore/security/get-started


## 15. Aprobación

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | Edwin | ____________________ | |
| Tech Lead | Edwin | ____________________ | |
| Stakeholder | | ____________________ | |

---

## 📝 Nota sobre Estructura de Documentos Markdown

Este documento sigue las mejores prácticas de estructuración de documentos Markdown:

### Estructura Completa de un Archivo .MD

1. **Encabezado Principal (H1):**
   ```markdown
   # Título Principal del Documento
   ```

2. **Metadata (Opcional pero recomendado):**
   ```markdown
   **Versión:** X.X
   **Fecha:** Mes Año
   **Autor:** Nombre
   **Estado:** Draft/Actualizado/Aprobado
   ```

3. **Tabla de Contenidos:**
   ```markdown
   ## 📋 Tabla de Contenidos
   1. [Sección 1](#sección-1)
   2. [Sección 2](#sección-2)
   ```

4. **Separadores Horizontales:**
   ```markdown
   ---
   ```
   (Usar entre secciones principales)

5. **Jerarquía de Encabezados:**
   - `#` H1: Título principal (solo uno por documento)
   - `##` H2: Secciones principales
   - `###` H3: Subsecciones
   - `####` H4: Sub-subsecciones
   - Máximo recomendado: H4

6. **Listas:**
   - **Ordenadas:** `1. Item`
   - **No ordenadas:** `- Item` o `* Item`
   - **Checkboxes:** `- [ ] Tarea` o `- [x] Completada`

7. **Tablas:**
   ```markdown
   | Columna 1 | Columna 2 |
   |-----------|----------|
   | Dato 1    | Dato 2   |
   ```

8. **Código:**
   - **Inline:** `` `código` ``
   - **Bloque:** ` ```lenguaje` ... ` ``` `

9. **Énfasis:**
   - **Negrita:** `**texto**`
   - *Cursiva:* `*texto*`
   - ~~Tachado:~~ `~~texto~~`

10. **Enlaces:**
    - **Externo:** `[Texto](https://url.com)`
    - **Interno:** `[Sección](#sección)`

11. **Imágenes:**
    ```markdown
    ![Alt text](path/to/image.png)
    ```

12. **Citas:**
    ```markdown
    > Texto citado
    ```

13. **Apéndices y Referencias:**
    - Glosario
    - Referencias técnicas
    - Tabla de aprobación

**Este PRD sigue esta estructura completa para máxima claridad y navegabilidad.**