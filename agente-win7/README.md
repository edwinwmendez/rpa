# Agente RPA - Windows 7

Agente local Python LIGERO para Windows 7 (sin automatización web)

## 📋 Requisitos

- Python 3.8 (última versión compatible con Win7)
- Windows 7 SP1 (32 o 64-bit)
- Visual C++ Redistributable 2015
- .NET Framework 4.5+

## ⚠️ Limitaciones

Este agente es una **versión ligera** para Windows 7:

- ✅ Automatización desktop (pywinauto)
- ✅ Procesamiento Excel/CSV  
- ❌ **SIN automatización web** (usa Windows 10/11 para web)

**Razón:** Python 3.8 y Windows 7 tienen limitaciones que impiden 
usar Playwright. Para automatización web, use Windows 10/11.

## 🚀 Instalación

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## ▶️ Ejecutar

```bash
python app.py
```

El agente escuchará en `http://localhost:5000`

## 📦 Diferencias con agente Win10/11

| Feature | Win7 | Win10/11 |
|---------|------|----------|
| Desktop automation | ✅ | ✅ |
| Web automation | ❌ | ✅ |
| Excel/CSV | ✅ | ✅ |
| Python | 3.8 | 3.10 |
| Tamaño | ~150MB | ~200MB |
