# 🔍 Diagnóstico de Conexión Agente-Frontend

## Problema Actual
- Frontend muestra "Agente desconectado"
- No se ve nada en pantalla (probablemente el overlay del picker)

## Pasos de Diagnóstico

### 1️⃣ Verificar que el agente esté corriendo en Windows 7

En Windows 7, ejecuta:
```cmd
cd C:\rpa\agente-win7
venv\Scripts\activate
python app.py
```

**Verifica que veas:**
```
🤖 Agente RPA - Windows 7 (Versión Ligera)
==========================================
Python: 3.8.x
OS: Windows 7
Servidor: http://localhost:5000
==========================================
```

### 2️⃣ Obtener la IP de Windows 7

En Windows 7, abre CMD y ejecuta:
```cmd
ipconfig
```

**Busca la IP en:**
- "IPv4 Address" bajo "Adaptador de LAN inalámbrica" o "Adaptador de Ethernet"
- Ejemplo: `192.168.1.100` o `10.36.238.XXX`

**Anota esta IP:** `_________________`

### 3️⃣ Verificar que el agente escucha en todas las interfaces

En `agente-win7/app.py`, línea 746 debe decir:
```python
app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
```

✅ Si dice `host='0.0.0.0'` → Correcto
❌ Si dice `host='127.0.0.1'` → Necesita cambio

### 4️⃣ Verificar CORS en el agente

En `agente-win7/app.py`, líneas 31-40, debe incluir la IP del MacBook:
```python
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5173',
    'http://10.36.238.114:3000',    # ← IP del MacBook
    'http://10.36.238.114:5173',
    # ...
], supports_credentials=True)
```

### 5️⃣ Configurar el frontend para usar la IP de Windows 7

**Opción A: Crear archivo .env en el frontend**

Crea `frontend/.env` con:
```env
VITE_AGENT_URL=http://[IP_DE_WINDOWS_7]:5000
```

**Ejemplo:**
```env
VITE_AGENT_URL=http://192.168.1.100:5000
```

**Opción B: Usar localhost (si accedes desde Windows 7)**

Si abres el navegador EN Windows 7 y accedes a `http://localhost:3000` o `http://127.0.0.1:3000`, entonces:
```env
VITE_AGENT_URL=http://localhost:5000
```

### 6️⃣ Reiniciar el frontend

Después de crear/modificar `.env`:
```bash
cd frontend
pnpm run dev --host
```

### 7️⃣ Probar conexión manualmente

En el navegador (Windows 7), abre la consola (F12) y ejecuta:
```javascript
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Si funciona:** Verás un JSON con información del agente
**Si falla:** Verás un error de CORS o conexión

### 8️⃣ Verificar firewall de Windows 7

El firewall puede estar bloqueando el puerto 5000:

1. Abre "Firewall de Windows" → "Configuración avanzada"
2. "Reglas de entrada" → "Nueva regla"
3. Puerto → TCP → 5000 → Permitir conexión
4. Aplica a todos los perfiles

## Escenarios Comunes

### Escenario 1: Frontend en MacBook, Agente en Windows 7, Navegador en Windows 7
- **Frontend URL:** `http://10.36.238.114:3000` (MacBook)
- **Agente debe estar en:** `http://[IP_WINDOWS_7]:5000`
- **Frontend .env:** `VITE_AGENT_URL=http://[IP_WINDOWS_7]:5000`

### Escenario 2: Todo en Windows 7
- **Frontend URL:** `http://localhost:3000`
- **Agente URL:** `http://localhost:5000`
- **Frontend .env:** `VITE_AGENT_URL=http://localhost:5000`

### Escenario 3: Frontend en MacBook, Agente en Windows 7, Navegador en MacBook
- **Frontend URL:** `http://localhost:3000` (MacBook)
- **Agente debe estar en:** `http://[IP_WINDOWS_7]:5000`
- **Frontend .env:** `VITE_AGENT_URL=http://[IP_WINDOWS_7]:5000`

## Comandos Rápidos de Diagnóstico

### En Windows 7 (CMD):
```cmd
# Ver IP
ipconfig | findstr IPv4

# Probar que el agente responde localmente
curl http://localhost:5000/health

# Ver procesos en puerto 5000
netstat -ano | findstr :5000
```

### En MacBook (Terminal):
```bash
# Probar conexión al agente en Windows 7
curl http://[IP_WINDOWS_7]:5000/health

# Ver si el puerto está abierto
nc -zv [IP_WINDOWS_7] 5000
```

