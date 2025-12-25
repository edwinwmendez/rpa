"""
Element Picker - Selector visual de elementos para automatización RPA
Permite capturar elementos de aplicaciones Windows mediante CTRL+Click

Compatible con Windows 7 (Python 3.8)
"""

import base64
import ctypes
import ctypes.wintypes
import io
import logging
import threading
import time
from typing import Dict, Optional, Any, Tuple

from PIL import Image, ImageGrab
from pywinauto import Desktop
from pywinauto.controls.uiawrapper import UIAWrapper

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)


# ==================== CONSTANTES WIN32 ====================

# Estilos de ventana
WS_EX_LAYERED = 0x00080000
WS_EX_TRANSPARENT = 0x00000020
WS_EX_TOPMOST = 0x00000008
WS_EX_TOOLWINDOW = 0x00000080
WS_POPUP = 0x80000000
WS_VISIBLE = 0x10000000

# Layered window
LWA_COLORKEY = 0x00000001
LWA_ALPHA = 0x00000002

# Colores
COLOR_RED = 0x0000FF  # BGR format

# Hooks
WH_KEYBOARD_LL = 13
WH_MOUSE_LL = 14
WM_KEYDOWN = 0x0100
WM_LBUTTONDOWN = 0x0201
VK_CONTROL = 0x11
VK_ESCAPE = 0x1B

# GDI
PS_SOLID = 0
SRCCOPY = 0x00CC0020

# Mensajes
WM_PAINT = 0x000F
WM_CLOSE = 0x0010
WM_DESTROY = 0x0002
WM_QUIT = 0x0012


# ==================== ESTRUCTURAS WIN32 ====================

class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]


class MSLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("pt", POINT),
        ("mouseData", ctypes.wintypes.DWORD),
        ("flags", ctypes.wintypes.DWORD),
        ("time", ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))
    ]


class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode", ctypes.wintypes.DWORD),
        ("scanCode", ctypes.wintypes.DWORD),
        ("flags", ctypes.wintypes.DWORD),
        ("time", ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))
    ]


# Definir el tipo de función para el procedimiento de ventana
WNDPROC = ctypes.WINFUNCTYPE(
    ctypes.c_long,
    ctypes.wintypes.HWND,
    ctypes.c_uint,
    ctypes.wintypes.WPARAM,
    ctypes.wintypes.LPARAM
)

class WNDCLASSW(ctypes.Structure):
    """Estructura WNDCLASSW para Windows (Unicode)"""
    _fields_ = [
        ("style", ctypes.wintypes.UINT),
        ("lpfnWndProc", WNDPROC),  # Tipo de función correcto
        ("cbClsExtra", ctypes.c_int),
        ("cbWndExtra", ctypes.c_int),
        ("hInstance", ctypes.wintypes.HANDLE),  # HINSTANCE es un HANDLE
        ("hIcon", ctypes.wintypes.HANDLE),      # HICON es un HANDLE
        ("hCursor", ctypes.wintypes.HANDLE),    # HCURSOR es un HANDLE
        ("hbrBackground", ctypes.wintypes.HANDLE),  # HBRUSH es un HANDLE
        ("lpszMenuName", ctypes.c_wchar_p),
        ("lpszClassName", ctypes.c_wchar_p)
    ]


# ==================== CLASE PRINCIPAL ====================

class ElementPicker:
    """
    Selector visual de elementos para automatización RPA.
    
    Permite al usuario seleccionar elementos de aplicaciones Windows
    mediante un overlay visual y captura con CTRL+Click.
    
    Uso:
        picker = ElementPicker()
        picker.start()
        # Usuario selecciona elemento...
        result = picker.get_result()
        picker.stop()
    """
    
    # Estados posibles
    STATUS_IDLE = 'idle'
    STATUS_WAITING = 'waiting'
    STATUS_CAPTURED = 'captured'
    STATUS_ERROR = 'error'
    
    # Instancia singleton
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Implementación del patrón Singleton."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        """Inicializa el picker si no ha sido inicializado."""
        if self._initialized:
            return
        
        self._initialized = True
        self._status = self.STATUS_IDLE
        self._mode = 'desktop'
        self._error_message = None
        
        # Elemento capturado
        self._captured_element = None
        self._captured_selector = None
        self._captured_properties = None
        self._captured_screenshot = None
        
        # Threading
        self._picker_thread = None
        self._stop_event = threading.Event()
        
        # Hooks
        self._keyboard_hook = None
        self._mouse_hook = None
        self._ctrl_pressed = False
        
        # Overlay
        self._overlay_hwnd = None
        self._current_element_rect = None
        
        # Win32 API
        self._user32 = ctypes.windll.user32
        self._gdi32 = ctypes.windll.gdi32
        self._kernel32 = ctypes.windll.kernel32
        
        # Desktop para pywinauto (UIA como primario, win32 como fallback)
        self._desktop_uia = Desktop(backend='uia')
        self._desktop_win32 = Desktop(backend='win32')
        
        logger.info("ElementPicker inicializado")
    
    # ==================== API PÚBLICA ====================
    
    def start(self, mode: str = 'desktop') -> bool:
        """
        Inicia el selector de elementos.
        
        Args:
            mode: Modo de captura ('desktop' o 'web')
            
        Returns:
            True si se inició correctamente, False en caso de error
        """
        try:
            # Si ya está corriendo, detener primero
            if self._status == self.STATUS_WAITING:
                self.stop()
            
            self._mode = mode
            self._status = self.STATUS_WAITING
            self._error_message = None
            self._clear_captured_data()
            self._stop_event.clear()
            
            # Iniciar thread del picker
            self._picker_thread = threading.Thread(
                target=self._picker_loop,
                name="ElementPickerThread",
                daemon=True
            )
            self._picker_thread.start()
            
            logger.info("ElementPicker iniciado en modo: %s", mode)
            return True
            
        except Exception as e:
            self._status = self.STATUS_ERROR
            self._error_message = str(e)
            logger.error("Error iniciando ElementPicker: %s", e)
            return False
    
    def stop(self) -> None:
        """Detiene el selector de elementos y limpia recursos."""
        try:
            self._stop_event.set()
            
            # Esperar a que el thread termine
            if self._picker_thread and self._picker_thread.is_alive():
                self._picker_thread.join(timeout=2.0)
            
            self._cleanup_hooks()
            self._destroy_overlay()
            
            if self._status != self.STATUS_CAPTURED:
                self._status = self.STATUS_IDLE
            
            logger.info("ElementPicker detenido")
            
        except Exception as e:
            logger.error("Error deteniendo ElementPicker: %s", e)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Obtiene el estado actual del picker.
        
        Returns:
            Dict con 'status' y opcionalmente 'error'
        """
        result = {'status': self._status}
        
        if self._status == self.STATUS_ERROR and self._error_message:
            result['error'] = self._error_message
        
        return result
    
    def get_result(self) -> Dict[str, Any]:
        """
        Obtiene el resultado de la captura.
        
        Returns:
            Dict con selector, properties y screenshot si hay elemento capturado,
            o error si no hay captura disponible
        """
        if self._status != self.STATUS_CAPTURED:
            return {
                'status': 'error',
                'error': 'No hay elemento capturado'
            }
        
        return {
            'status': 'success',
            'selector': self._captured_selector,
            'properties': self._captured_properties,
            'screenshot': self._captured_screenshot
        }
    
    def reset(self) -> None:
        """Reinicia el picker a estado idle."""
        self.stop()
        self._clear_captured_data()
        self._status = self.STATUS_IDLE
        self._error_message = None
    
    # ==================== LOOP PRINCIPAL ====================
    
    def _picker_loop(self) -> None:
        """Loop principal del picker que corre en thread separado."""
        try:
            logger.info("Iniciando picker loop...")
            
            # Instalar hooks
            logger.info("Instalando hooks de teclado y mouse...")
            self._install_hooks()
            
            if not self._keyboard_hook or not self._mouse_hook:
                raise Exception("No se pudieron instalar los hooks. ¿Ejecutaste como administrador?")
            
            logger.info("Hooks instalados correctamente. Overlay activo.")
            
            # Loop de detección de elementos
            loop_count = 0
            while not self._stop_event.is_set():
                try:
                    # Obtener posición del mouse
                    point = POINT()
                    self._user32.GetCursorPos(ctypes.byref(point))
                    
                    # Obtener elemento bajo el cursor
                    element = self._get_element_at_point(point.x, point.y)
                    
                    if element:
                        # Obtener rectángulo del elemento
                        try:
                            rect = element.rectangle()
                            new_rect = (rect.left, rect.top, rect.right, rect.bottom)
                            
                            # Solo actualizar overlay si el rectángulo cambió
                            if new_rect != self._current_element_rect:
                                self._current_element_rect = new_rect
                                self._update_overlay(new_rect)
                                if loop_count % 20 == 0:  # Log cada segundo aprox
                                    logger.debug("Overlay actualizado: %s", new_rect)
                        except Exception as e:
                            logger.debug("Error obteniendo rectángulo: %s", e)
                    else:
                        # Si no hay elemento, ocultar overlay
                        if self._overlay_hwnd:
                            self._user32.ShowWindow(self._overlay_hwnd, 0)  # SW_HIDE
                    
                    # Procesar mensajes de Windows (necesario para hooks)
                    msg = ctypes.wintypes.MSG()
                    while self._user32.PeekMessageW(ctypes.byref(msg), None, 0, 0, 1):  # PM_REMOVE
                        self._user32.TranslateMessage(ctypes.byref(msg))
                        self._user32.DispatchMessageW(ctypes.byref(msg))
                    
                    # Pequeña pausa para no saturar CPU
                    time.sleep(0.05)
                    loop_count += 1
                    
                except Exception as e:
                    logger.warning("Error en picker loop: %s", e)
                    time.sleep(0.1)
            
            logger.info("Picker loop terminado")
            
        except Exception as e:
            self._status = self.STATUS_ERROR
            self._error_message = str(e)
            logger.error("Error crítico en picker loop: %s", e, exc_info=True)
        finally:
            logger.info("Limpiando recursos del picker...")
            self._cleanup_hooks()
            self._destroy_overlay()
    
    # ==================== DETECCIÓN DE ELEMENTOS ====================
    
    def _get_element_at_point(self, x: int, y: int) -> Optional[UIAWrapper]:
        """
        Obtiene el elemento UI bajo las coordenadas especificadas.
        
        Intenta primero con backend UIA (más moderno), luego fallback a win32
        (mejor compatibilidad con aplicaciones antiguas de Windows 7).
        
        Args:
            x: Coordenada X del mouse
            y: Coordenada Y del mouse
            
        Returns:
            Elemento UIAWrapper o None
        """
        # Intento 1: Backend UIA (preferido para apps modernas)
        element = None
        try:
            element = self._desktop_uia.from_point(x, y)
            if element:
                return element
        except Exception as e:
            logger.debug("UIA backend falló en (%d, %d): %s", x, y, e)
        
        # Intento 2: Fallback a win32 (mejor para apps antiguas Win7)
        # Solo intentar si UIA no retornó elemento (None o exception)
        if not element:
            try:
                element = self._desktop_win32.from_point(x, y)
                if element:
                    logger.debug("Usando win32 backend para elemento en (%d, %d)", x, y)
                    return element
            except Exception as e:
                logger.debug("win32 backend también falló: %s", e)
        
        return None
    
    def _capture_element(self, x: int, y: int) -> bool:
        """
        Captura el elemento bajo las coordenadas especificadas.
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            
        Returns:
            True si la captura fue exitosa
        """
        try:
            element = self._get_element_at_point(x, y)
            
            if not element:
                self._error_message = "No se encontró elemento en la posición"
                self._status = self.STATUS_ERROR
                return False
            
            self._captured_element = element
            
            # Extraer propiedades (incluyendo coordenadas para fallback)
            self._captured_properties = self._extract_properties(element, x, y)
            
            # Generar selector
            self._captured_selector = self._generate_selector(self._captured_properties)
            
            # Capturar screenshot
            self._captured_screenshot = self._capture_screenshot(element)
            
            self._status = self.STATUS_CAPTURED
            logger.info("Elemento capturado: %s", self._captured_selector)
            logger.debug("Propiedades: %s", self._captured_properties)
            
            return True
            
        except Exception as e:
            self._error_message = str(e)
            self._status = self.STATUS_ERROR
            logger.error("Error capturando elemento: %s", e)
            return False
    
    def _extract_properties(self, element: UIAWrapper, x: int = 0, y: int = 0) -> Dict[str, Any]:
        """
        Extrae las propiedades relevantes del elemento.
        
        Incluye todos los campos necesarios para Windows 7 y apps antiguas:
        - auto_id, name, class_name, control_type (identificación)
        - found_index (crucial para apps sin AutomationId)
        - process_name, window_title (conexión con pywinauto)
        - coordinates (fallback)
        
        Args:
            element: Elemento UIAWrapper
            x: Coordenada X donde se capturó (para fallback)
            y: Coordenada Y donde se capturó (para fallback)
            
        Returns:
            Dict con propiedades del elemento
        """
        properties = {}
        
        try:
            # ==================== IDENTIFICADORES PRINCIPALES ====================
            
            # AutomationId (prioridad alta - identificador preferido)
            try:
                auto_id = element.automation_id()
                if auto_id:
                    properties['auto_id'] = auto_id
            except Exception:
                pass
            
            # Nombre/Texto del control
            try:
                name = element.window_text()
                if name:
                    properties['name'] = name
            except Exception:
                pass
            
            # Clase Win32 (importante para apps antiguas)
            try:
                class_name = element.class_name()
                if class_name:
                    properties['class_name'] = class_name
            except Exception:
                pass
            
            # Tipo de control UIA
            try:
                control_type = element.element_info.control_type
                if control_type:
                    properties['control_type'] = control_type
            except Exception:
                pass
            
            # ==================== POSICIÓN Y GEOMETRÍA ====================
            
            # Rectángulo del elemento
            try:
                rect = element.rectangle()
                properties['rectangle'] = {
                    'left': rect.left,
                    'top': rect.top,
                    'right': rect.right,
                    'bottom': rect.bottom
                }
            except Exception:
                pass
            
            # Coordenadas como fallback (crucial para apps problemáticas)
            if x > 0 or y > 0:
                properties['coordinates'] = [x, y]
            
            # ==================== ESTADOS ====================
            
            try:
                properties['is_enabled'] = element.is_enabled()
            except Exception:
                properties['is_enabled'] = True
            
            try:
                properties['is_visible'] = element.is_visible()
            except Exception:
                properties['is_visible'] = True
            
            # ==================== INFORMACIÓN DE VENTANA/PROCESO ====================
            
            # Título de la ventana padre
            try:
                parent = element.top_level_parent()
                if parent:
                    properties['window_title'] = parent.window_text()
                    
                    # Obtener process_name desde la ventana padre
                    try:
                        process_id = parent.element_info.process_id
                        if process_id and PSUTIL_AVAILABLE:
                            process = psutil.Process(process_id)
                            properties['process_name'] = process.name()
                    except Exception:
                        pass
            except Exception:
                pass
            
            # ==================== FOUND_INDEX (CRÍTICO PARA WIN7) ====================
            # Calcula la posición del elemento entre hermanos del mismo tipo
            # Esencial para apps antiguas que no tienen AutomationId
            
            properties['found_index'] = self._calculate_found_index(element)
            
        except Exception as e:
            logger.error("Error extrayendo propiedades: %s", e)
        
        return properties
    
    def _calculate_found_index(self, element: UIAWrapper) -> int:
        """
        Calcula el found_index del elemento entre sus hermanos del mismo tipo.
        
        Este valor es CRÍTICO para identificar elementos en aplicaciones antiguas
        de Windows 7 que no exponen AutomationId. Permite distinguir entre
        múltiples controles iguales (ej: varios botones "Aceptar").
        
        Args:
            element: Elemento UIAWrapper
            
        Returns:
            Índice del elemento (0-based) o 0 si no se puede calcular
        """
        try:
            # Obtener tipo de control del elemento actual
            try:
                element_control_type = element.element_info.control_type
            except Exception:
                return 0
            
            if not element_control_type:
                return 0
            
            # Obtener el padre
            try:
                parent = element.parent()
            except Exception:
                return 0
            
            if not parent:
                return 0
            
            # Buscar hermanos del mismo tipo de control
            try:
                siblings = parent.children()
            except Exception:
                return 0
            
            # Contar hermanos del mismo tipo hasta encontrar el elemento actual
            index = 0
            for sibling in siblings:
                try:
                    sibling_type = sibling.element_info.control_type
                    if sibling_type == element_control_type:
                        # Comparar si es el mismo elemento
                        if self._is_same_element(element, sibling):
                            return index
                        index += 1
                except Exception:
                    continue
            
            return 0
            
        except Exception as e:
            logger.debug("Error calculando found_index: %s", e)
            return 0
    
    def _is_same_element(self, elem1: UIAWrapper, elem2: UIAWrapper) -> bool:
        """
        Compara si dos elementos son el mismo.
        
        Args:
            elem1: Primer elemento
            elem2: Segundo elemento
            
        Returns:
            True si son el mismo elemento
        """
        try:
            # Comparar por rectángulo (posición exacta)
            rect1 = elem1.rectangle()
            rect2 = elem2.rectangle()
            
            return (rect1.left == rect2.left and 
                    rect1.top == rect2.top and
                    rect1.right == rect2.right and 
                    rect1.bottom == rect2.bottom)
        except Exception:
            return False
    
    def _generate_selector(self, properties: Dict[str, Any]) -> str:
        """
        Genera un selector único basado en las propiedades del elemento.
        
        Prioridad para Windows 7 y apps antiguas:
        1. auto_id (más confiable, pero apps antiguas no lo tienen)
        2. name + control_type + found_index
        3. class_name + control_type + found_index
        4. control_type + found_index
        5. coordinates (fallback absoluto)
        
        El found_index se agrega cuando hay riesgo de ambigüedad
        (nombres genéricos, sin auto_id).
        
        Args:
            properties: Dict con propiedades del elemento
            
        Returns:
            Selector en formato "tipo:valor" o "tipo1:valor1|tipo2:valor2"
        """
        found_index = properties.get('found_index', 0)
        
        # Prioridad 1: AutomationId (el más confiable, no necesita found_index)
        if properties.get('auto_id'):
            return "auto_id:{}".format(properties['auto_id'])
        
        # Prioridad 2: Nombre + tipo de control + found_index si es necesario
        if properties.get('name'):
            name = properties['name']
            control_type = properties.get('control_type', '')
            
            # Nombres genéricos o cortos necesitan más contexto
            is_generic = (
                len(name) < 5 or 
                name.lower() in ['ok', 'no', 'si', 'yes', 'cancel', 'cancelar', 
                                 'aceptar', 'guardar', 'save', 'abrir', 'open',
                                 'cerrar', 'close', 'salir', 'exit', 'buscar',
                                 'search', 'find', 'nuevo', 'new', 'editar', 'edit']
            )
            
            selector_parts = ["name:{}".format(name)]
            
            if control_type:
                selector_parts.append("control_type:{}".format(control_type))
            
            # Agregar found_index si el nombre es genérico o hay índice > 0
            if is_generic or found_index > 0:
                selector_parts.append("found_index:{}".format(found_index))
            
            return "|".join(selector_parts)
        
        # Prioridad 3: Clase + tipo de control + found_index
        if properties.get('class_name'):
            class_name = properties['class_name']
            control_type = properties.get('control_type', '')
            
            selector_parts = ["class_name:{}".format(class_name)]
            
            if control_type:
                selector_parts.append("control_type:{}".format(control_type))
            
            # Siempre agregar found_index cuando no hay auto_id ni name
            selector_parts.append("found_index:{}".format(found_index))
            
            return "|".join(selector_parts)
        
        # Prioridad 4: Solo tipo de control + found_index
        if properties.get('control_type'):
            return "control_type:{}|found_index:{}".format(
                properties['control_type'], 
                found_index
            )
        
        # Fallback absoluto: Coordenadas
        if properties.get('coordinates'):
            coords = properties['coordinates']
            return "coordinates:{},{}".format(coords[0], coords[1])
        
        return "unknown"
    
    def _capture_screenshot(self, element: UIAWrapper) -> Optional[str]:
        """
        Captura screenshot del elemento.
        
        Args:
            element: Elemento UIAWrapper
            
        Returns:
            Screenshot en base64 o None si falla
        """
        try:
            rect = element.rectangle()
            
            # Agregar un pequeño margen
            margin = 5
            bbox = (
                max(0, rect.left - margin),
                max(0, rect.top - margin),
                rect.right + margin,
                rect.bottom + margin
            )
            
            # Capturar región
            screenshot = ImageGrab.grab(bbox=bbox)
            
            # Limitar tamaño máximo (500x500)
            max_size = (500, 500)
            if screenshot.width > max_size[0] or screenshot.height > max_size[1]:
                screenshot.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Convertir a base64
            buffer = io.BytesIO()
            screenshot.save(buffer, format='PNG')
            buffer.seek(0)
            
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
            
        except Exception as e:
            logger.error("Error capturando screenshot: %s", e)
            return None
    
    # ==================== OVERLAY VISUAL ====================
    
    def _update_overlay(self, rect: Tuple[int, int, int, int]) -> None:
        """
        Actualiza o crea el overlay visual sobre el elemento.
        
        Args:
            rect: Tupla (left, top, right, bottom) del rectángulo
        """
        try:
            left, top, right, bottom = rect
            width = right - left
            height = bottom - top
            
            # Mínimo tamaño visible
            if width < 2 or height < 2:
                return
            
            if self._overlay_hwnd is None:
                self._create_overlay()
            
            if self._overlay_hwnd:
                # Mover y redimensionar overlay
                # SWP_NOACTIVATE = 0x0010, SWP_SHOWWINDOW = 0x0040
                self._user32.SetWindowPos(
                    self._overlay_hwnd,
                    -1,  # HWND_TOPMOST
                    left, top, width, height,
                    0x0010 | 0x0040
                )
                
                # Forzar repintado
                self._user32.InvalidateRect(self._overlay_hwnd, None, True)
                self._user32.UpdateWindow(self._overlay_hwnd)
                
        except Exception as e:
            logger.debug("Error actualizando overlay: %s", e)
    
    def _create_overlay(self) -> None:
        """Crea la ventana overlay transparente."""
        try:
            logger.info("Creando ventana overlay...")
            
            # Registrar clase de ventana
            wnd_class_name = "RPAElementPickerOverlay"
            
            # Crear callback para el procedimiento de ventana usando el tipo definido
            wnd_proc = WNDPROC(self._overlay_wnd_proc)
            
            # Crear estructura WNDCLASSW
            wnd_class = WNDCLASSW()
            wnd_class.style = 0
            wnd_class.lpfnWndProc = wnd_proc
            wnd_class.cbClsExtra = 0
            wnd_class.cbWndExtra = 0
            wnd_class.hInstance = self._kernel32.GetModuleHandleW(None)
            wnd_class.hIcon = None
            wnd_class.hCursor = None
            wnd_class.hbrBackground = self._gdi32.CreateSolidBrush(COLOR_RED)
            wnd_class.lpszMenuName = None
            wnd_class.lpszClassName = wnd_class_name
            
            # Intentar registrar (puede fallar si ya existe)
            result = self._user32.RegisterClassW(ctypes.byref(wnd_class))
            if result == 0:
                error_code = self._kernel32.GetLastError()
                if error_code != 1410:  # ERROR_CLASS_ALREADY_EXISTS
                    logger.warning("Error registrando clase de ventana: %d", error_code)
            
            # Crear ventana
            ex_style = WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW
            style = WS_POPUP | WS_VISIBLE
            
            self._overlay_hwnd = self._user32.CreateWindowExW(
                ex_style,
                wnd_class_name,
                "RPA Overlay",
                style,
                0, 0, 100, 100,
                None, None,
                self._kernel32.GetModuleHandleW(None),
                None
            )
            
            if self._overlay_hwnd:
                # Hacer ventana semi-transparente (30% opacidad = 76/255)
                self._user32.SetLayeredWindowAttributes(
                    self._overlay_hwnd,
                    0,
                    76,  # Alpha (30%)
                    LWA_ALPHA
                )
                
                logger.info("✅ Overlay creado exitosamente: %s", self._overlay_hwnd)
            else:
                error_code = self._kernel32.GetLastError()
                raise Exception(f"No se pudo crear overlay. Error: {error_code}")
            
        except Exception as e:
            logger.error("❌ Error creando overlay: %s", e, exc_info=True)
            self._overlay_hwnd = None
            raise
    
    def _overlay_wnd_proc(self, hwnd, msg, wparam, lparam):
        """Procedimiento de ventana para el overlay."""
        if msg == WM_PAINT:
            # Pintar borde rojo
            try:
                ps = ctypes.create_string_buffer(68)  # PAINTSTRUCT
                hdc = self._user32.BeginPaint(hwnd, ps)
                
                rect = ctypes.wintypes.RECT()
                self._user32.GetClientRect(hwnd, ctypes.byref(rect))
                
                # Crear pen rojo para el borde
                pen = self._gdi32.CreatePen(PS_SOLID, 3, COLOR_RED)
                old_pen = self._gdi32.SelectObject(hdc, pen)
                
                # Brush transparente
                null_brush = self._gdi32.GetStockObject(5)  # NULL_BRUSH
                old_brush = self._gdi32.SelectObject(hdc, null_brush)
                
                # Dibujar rectángulo
                self._gdi32.Rectangle(hdc, 0, 0, rect.right, rect.bottom)
                
                # Restaurar
                self._gdi32.SelectObject(hdc, old_pen)
                self._gdi32.SelectObject(hdc, old_brush)
                self._gdi32.DeleteObject(pen)
                
                self._user32.EndPaint(hwnd, ps)
            except Exception:
                pass
            return 0
        
        return self._user32.DefWindowProcW(hwnd, msg, wparam, lparam)
    
    def _destroy_overlay(self) -> None:
        """Destruye la ventana overlay."""
        try:
            if self._overlay_hwnd:
                self._user32.DestroyWindow(self._overlay_hwnd)
                self._overlay_hwnd = None
                self._current_element_rect = None
                logger.debug("Overlay destruido")
        except Exception as e:
            logger.debug("Error destruyendo overlay: %s", e)
    
    # ==================== HOOKS DE TECLADO/MOUSE ====================
    
    def _install_hooks(self) -> None:
        """Instala los hooks de teclado y mouse."""
        try:
            logger.info("Preparando callbacks de hooks...")
            
            # Callback para keyboard hook
            HOOKPROC = ctypes.WINFUNCTYPE(
                ctypes.c_long,
                ctypes.c_int,
                ctypes.wintypes.WPARAM,
                ctypes.wintypes.LPARAM
            )
            
            self._keyboard_callback = HOOKPROC(self._keyboard_hook_proc)
            self._mouse_callback = HOOKPROC(self._mouse_hook_proc)
            
            logger.info("Instalando keyboard hook...")
            # Instalar keyboard hook
            self._keyboard_hook = self._user32.SetWindowsHookExW(
                WH_KEYBOARD_LL,
                self._keyboard_callback,
                self._kernel32.GetModuleHandleW(None),
                0
            )
            
            logger.info("Instalando mouse hook...")
            # Instalar mouse hook
            self._mouse_hook = self._user32.SetWindowsHookExW(
                WH_MOUSE_LL,
                self._mouse_callback,
                self._kernel32.GetModuleHandleW(None),
                0
            )
            
            if self._keyboard_hook and self._mouse_hook:
                logger.info("✅ Hooks instalados correctamente (keyboard: %s, mouse: %s)", 
                           self._keyboard_hook, self._mouse_hook)
            else:
                error_msg = "No se pudieron instalar todos los hooks"
                if not self._keyboard_hook:
                    error_msg += " (keyboard hook falló)"
                if not self._mouse_hook:
                    error_msg += " (mouse hook falló)"
                logger.error("❌ %s. ¿Ejecutaste como administrador?", error_msg)
                raise Exception(error_msg)
            
        except Exception as e:
            logger.error("Error instalando hooks: %s", e, exc_info=True)
            raise
    
    def _process_messages(self) -> None:
        """Procesa mensajes de Windows para los hooks."""
        try:
            msg = ctypes.wintypes.MSG()
            while not self._stop_event.is_set():
                # PeekMessage sin bloquear
                if self._user32.PeekMessageW(
                    ctypes.byref(msg), None, 0, 0, 1  # PM_REMOVE
                ):
                    self._user32.TranslateMessage(ctypes.byref(msg))
                    self._user32.DispatchMessageW(ctypes.byref(msg))
                else:
                    time.sleep(0.01)
        except Exception as e:
            logger.debug("Error en message loop: %s", e)
    
    def _keyboard_hook_proc(self, nCode: int, wParam: int, lParam: int) -> int:
        """Callback para el hook de teclado."""
        try:
            if nCode >= 0:
                kb_struct = ctypes.cast(lParam, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents
                
                if wParam == WM_KEYDOWN:
                    # Detectar CTRL
                    if kb_struct.vkCode == VK_CONTROL:
                        self._ctrl_pressed = True
                    
                    # ESC cancela
                    elif kb_struct.vkCode == VK_ESCAPE:
                        self._stop_event.set()
                
                elif wParam == 0x0101:  # WM_KEYUP
                    if kb_struct.vkCode == VK_CONTROL:
                        self._ctrl_pressed = False
        except Exception:
            pass
        
        return self._user32.CallNextHookEx(self._keyboard_hook, nCode, wParam, lParam)
    
    def _mouse_hook_proc(self, nCode: int, wParam: int, lParam: int) -> int:
        """Callback para el hook de mouse."""
        try:
            if nCode >= 0 and wParam == WM_LBUTTONDOWN:
                # CTRL + Click izquierdo
                if self._ctrl_pressed:
                    mouse_struct = ctypes.cast(lParam, ctypes.POINTER(MSLLHOOKSTRUCT)).contents
                    
                    # Capturar elemento
                    self._capture_element(mouse_struct.pt.x, mouse_struct.pt.y)
                    
                    # Detener picker
                    self._stop_event.set()
                    
                    # Consumir el evento (no propagar)
                    return 1
        except Exception:
            pass
        
        return self._user32.CallNextHookEx(self._mouse_hook, nCode, wParam, lParam)
    
    def _cleanup_hooks(self) -> None:
        """Limpia los hooks instalados."""
        try:
            if self._keyboard_hook:
                self._user32.UnhookWindowsHookEx(self._keyboard_hook)
                self._keyboard_hook = None
            
            if self._mouse_hook:
                self._user32.UnhookWindowsHookEx(self._mouse_hook)
                self._mouse_hook = None
            
            self._ctrl_pressed = False
            logger.debug("Hooks limpiados")
            
        except Exception as e:
            logger.debug("Error limpiando hooks: %s", e)
    
    # ==================== UTILIDADES ====================
    
    def _clear_captured_data(self) -> None:
        """Limpia los datos del elemento capturado."""
        self._captured_element = None
        self._captured_selector = None
        self._captured_properties = None
        self._captured_screenshot = None

