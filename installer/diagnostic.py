"""
Instalador con Diagnóstico - Sistema RPA
Versión: 1.0.0

Este script diagnóstica el sistema antes de instalar el agente RPA.
Detecta problemas comunes y ofrece soluciones específicas.
"""

import sys
import platform
import subprocess
import ctypes
import os
import winreg
from pathlib import Path
import shutil
from datetime import datetime
import json

class SystemDiagnostic:
    """Diagnóstico completo del sistema"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.system_info = {}
        self.checks_passed = 0
        self.checks_total = 8
    
    def run_full_diagnostic(self) -> bool:
        """
        Ejecuta diagnóstico completo.
        Retorna True si todo está OK para instalar.
        """
        print("\n" + "="*60)
        print("🔍 DIAGNÓSTICO DEL SISTEMA RPA")
        print("="*60 + "\n")
        
        # Ejecutar checks
        checks = [
            ("Sistema Operativo", self.check_os),
            ("Arquitectura", self.check_architecture),
            ("Visual C++ Redistributable", self.check_vcredist),
            (".NET Framework", self.check_dotnet),
            ("Permisos", self.check_permissions),
            ("Antivirus", self.check_antivirus),
            ("Conectividad", self.check_connectivity),
            ("Espacio en Disco", self.check_disk_space)
        ]
        
        for name, check_func in checks:
            if check_func():
                self.checks_passed += 1
        
        # Mostrar resumen
        self.print_summary()
        
        # Guardar reporte
        self.save_report()
        
        # Retornar si puede proceder
        return len(self.errors) == 0
    
    def check_os(self) -> bool:
        """Verifica sistema operativo compatible"""
        print("📋 Verificando sistema operativo...", end=" ")
        
        system = platform.system()
        release = platform.release()
        
        self.system_info['os'] = f"{system} {release}"
        
        if system != "Windows":
            self.errors.append({
                'code': 'OS_NOT_WINDOWS',
                'message': f"Sistema operativo no compatible: {system}",
                'solution': "Este software solo funciona en Windows 7 o superior."
            })
            print("❌")
            return False
        
        # Detectar versión de Windows
        version_map = {
            '7': 7, '8': 8, '8.1': 8, '10': 10, '11': 11
        }
        win_version = version_map.get(release, 0)
        
        if win_version < 7:
            self.errors.append({
                'code': 'OS_TOO_OLD',
                'message': f"Windows {release} no es compatible",
                'solution': "Se requiere Windows 7 o superior."
            })
            print("❌")
            return False
        
        if win_version == 7:
            self.warnings.append({
                'code': 'OS_WIN7',
                'message': "Windows 7 detectado - Funcionalidades limitadas",
                'note': "No habrá automatización web (Playwright). Se recomienda Windows 10/11."
            })
        
        print(f"✅ {system} {release}")
        return True
