# 🚀 Guía de Primeros Pasos - Sistema RPA

## ✅ Estado Actual
- ✅ Agente conectado: Windows 7, Python 3.8.10, v1.0.0-win7
- ✅ Frontend funcionando en MacBook
- ✅ Conexión establecida entre frontend y agente

## 🎯 Próximos Pasos: Probar el Element Picker

### Paso 1: Abrir una aplicación en Windows 7

Abre cualquier aplicación en Windows 7 para probar el Element Picker:
- Bloc de notas (Notepad)
- Calculadora
- Cualquier aplicación que quieras automatizar

### Paso 2: Crear un nuevo workflow

1. En el navegador (Windows 7), ve a: `http://10.36.238.114:3000`
2. Si no estás logueado, inicia sesión
3. Haz clic en **"Nuevo Workflow"** o **"Crear Workflow"**

### Paso 3: Agregar una acción "Click"

1. En el editor de workflows, busca el panel de acciones (lado izquierdo)
2. Arrastra la acción **"Click"** al canvas
3. Haz clic en el nodo "Click" para abrir el panel de propiedades

### Paso 4: Usar el Element Picker

1. En el panel de propiedades del nodo "Click", verás un campo **"Selector"**
2. Haz clic en el botón **"🎯 Seleccionar Elemento"** o **"Target"**
3. Se abrirá un modal con instrucciones

### Paso 5: Capturar un elemento

**Instrucciones en pantalla:**
1. El modal te dirá: "Presiona CTRL + Click en el elemento que deseas seleccionar"
2. **NO cierres el modal todavía**
3. Presiona **CTRL** y mantén presionado
4. Mueve el mouse sobre la aplicación que abriste (Notepad, Calculadora, etc.)
5. Verás un **resaltado rojo** sobre los elementos cuando pases el mouse
6. Haz **Click** (mientras mantienes CTRL presionado) sobre el elemento que quieres capturar
7. El modal mostrará:
   - ✅ "Elemento capturado"
   - Una vista previa del elemento
   - Las propiedades del elemento (AutomationId, Nombre, Tipo, etc.)
   - Un screenshot del elemento

### Paso 6: Confirmar la selección

1. Revisa la información mostrada en el modal
2. Si es correcto, haz clic en **"Confirmar Selección"**
3. El selector se llenará automáticamente en el formulario
4. El modal se cerrará

### Paso 7: Guardar el workflow

1. Haz clic en **"Guardar"** o **"Save"** en el editor
2. Dale un nombre al workflow (ej: "Prueba Click")

## 🧪 Prueba Completa: Workflow Simple

### Crear un workflow de prueba con Notepad

1. **Abre Notepad** en Windows 7
2. **Crea un nuevo workflow** llamado "Prueba Notepad"
3. **Agrega acción "Click"**:
   - Usa Element Picker para seleccionar el área de texto de Notepad
   - Confirma la selección
4. **Agrega acción "Type"**:
   - Haz clic en el nodo "Type"
   - En el campo "Texto", escribe: `Hola desde RPA!`
   - Usa Element Picker para seleccionar el mismo área de texto
5. **Guarda el workflow**

### Ejecutar el workflow

1. Haz clic en **"Ejecutar"** o **"Play"** en el editor
2. El agente ejecutará las acciones en orden
3. Deberías ver que:
   - Se hace click en el área de texto
   - Se escribe "Hola desde RPA!" en Notepad

## 🔍 Verificar que todo funciona

### Checklist de verificación:

- [ ] El Element Picker se activa al hacer clic en "Seleccionar Elemento"
- [ ] Se ve el resaltado rojo al pasar el mouse sobre elementos
- [ ] CTRL+Click captura el elemento correctamente
- [ ] El modal muestra la información del elemento
- [ ] El screenshot se muestra correctamente
- [ ] Al confirmar, el selector se llena en el formulario
- [ ] El workflow se guarda correctamente
- [ ] El workflow se ejecuta sin errores

## 🐛 Si algo no funciona

### El Element Picker no se activa:
- Verifica que el agente esté corriendo en Windows 7
- Revisa la consola del navegador (F12) por errores
- Verifica que no haya otro proceso usando los hooks de teclado

### No se ve el resaltado rojo:
- Asegúrate de que el modal esté abierto
- Verifica que la aplicación objetivo esté visible (no minimizada)
- Prueba con otra aplicación más simple (Notepad, Calculadora)

### El elemento no se captura:
- Asegúrate de mantener CTRL presionado mientras haces click
- Verifica que estés haciendo click en un elemento interactivo
- Prueba con elementos más grandes (botones, campos de texto)

### El workflow no se ejecuta:
- Verifica que el agente esté conectado (banner verde)
- Revisa los logs del agente en la terminal de Windows 7
- Verifica que la aplicación objetivo esté abierta

## 📝 Notas Importantes

1. **El Element Picker funciona mejor con:**
   - Aplicaciones modernas (Windows 7+)
   - Elementos con AutomationId
   - Botones y campos de texto

2. **Para aplicaciones antiguas:**
   - El sistema usa `found_index` para distinguir elementos similares
   - Puede usar coordenadas como fallback
   - El `process_name` ayuda a identificar la aplicación

3. **Siempre prueba primero:**
   - Crea workflows simples antes de hacerlos complejos
   - Prueba cada acción individualmente
   - Guarda frecuentemente

## 🎉 ¡Listo para automatizar!

Ahora puedes:
- Crear workflows complejos con loops
- Usar archivos Excel/CSV para datos
- Automatizar tareas repetitivas
- Combinar múltiples acciones

¡Disfruta automatizando! 🚀

