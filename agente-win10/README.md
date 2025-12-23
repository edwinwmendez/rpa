# Agente RPA - Windows 10/11

Agente local Python con automatización desktop y web

## 📋 Requisitos

- Python 3.10+
- Windows 10/11 (64-bit)
- Visual C++ Redistributable 2015-2022
- .NET Framework 4.8

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

## 🔧 Características

- ✅ Automatización desktop (pywinauto)
- ✅ Automatización web (Playwright)
- ✅ Procesamiento Excel/CSV
- ✅ API REST con Flask

## 📦 Compilar ejecutable

```bash
nuitka --standalone --windows-disable-console --enable-plugin=pyqt5 app.py
```
