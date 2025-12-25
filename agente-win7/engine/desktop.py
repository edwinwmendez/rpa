"""
Motor de automatización Desktop con pywinauto
Soporta aplicaciones Win32, WinForms y WPF
"""

import logging
import time
from typing import Dict, Optional, Any
from pywinauto import Application, Desktop, findwindows
from pywinauto.controls.uiawrapper import UIAWrapper
from pywinauto.controls.win32_controls import ButtonWrapper

logger = logging.getLogger(__name__)


class DesktopEngineError(Exception):
    """Excepción base para errores del motor desktop"""
    pass


class ElementNotFoundError(DesktopEngineError):
    """El elemento no fue encontrado"""
    pass


class WindowNotFoundError(DesktopEngineError):
    """La ventana no fue encontrada"""
    pass


class DesktopEngine:
    """
    Motor de automatización para aplicaciones de escritorio Windows
    Usa pywinauto con backend UIA (UI Automation) por defecto
    """

    def __init__(self, backend: str = "uia", timeout: int = 30):
        """
        Inicializa el motor desktop

        Args:
            backend: Backend de pywinauto ('uia' o 'win32')
            timeout: Timeout por defecto en segundos para operaciones
        """
        self.backend = backend
        self.timeout = timeout
        self.current_app: Optional[Application] = None
        logger.info(f"DesktopEngine inicializado (backend: {backend}, timeout: {timeout}s)")

    def connect_to_window(self, window_title: Optional[str] = None,
                          process_id: Optional[int] = None,
                          class_name: Optional[str] = None) -> Application:
        """
        Conecta a una aplicación existente

        Args:
            window_title: Título de la ventana (puede ser parcial)
            process_id: ID del proceso
            class_name: Nombre de clase de la ventana

        Returns:
            Objeto Application conectado

        Raises:
            WindowNotFoundError: Si no se encuentra la ventana
        """
        try:
            criteria = {}
            if window_title:
                criteria['title_re'] = f".*{window_title}.*"
            if process_id:
                criteria['process'] = process_id
            if class_name:
                criteria['class_name'] = class_name

            if not criteria:
                raise ValueError("Debe proporcionar al menos un criterio de búsqueda")

            app = Application(backend=self.backend).connect(**criteria, timeout=self.timeout)
            self.current_app = app
            logger.info(f"Conectado a ventana: {window_title or process_id}")
            return app

        except findwindows.ElementNotFoundError as e:
            raise WindowNotFoundError(f"No se encontró la ventana: {e}")
        except Exception as e:
            logger.error(f"Error conectando a ventana: {e}")
            raise

    def launch_app(self, path: str, wait_for_idle: bool = True) -> Application:
        """
        Lanza una aplicación

        Args:
            path: Ruta completa al ejecutable
            wait_for_idle: Esperar a que la app esté lista

        Returns:
            Objeto Application lanzado
        """
        try:
            app = Application(backend=self.backend).start(path, timeout=self.timeout)

            if wait_for_idle:
                app.wait_cpu_usage_lower(threshold=5, timeout=self.timeout)

            self.current_app = app
            logger.info(f"Aplicación lanzada: {path}")
            return app

        except Exception as e:
            logger.error(f"Error lanzando aplicación: {e}")
            raise

    def find_element(self, selector: Dict[str, Any]) -> UIAWrapper:
        """
        Encuentra un elemento en la ventana actual

        Args:
            selector: Dict con criterios de búsqueda
                - auto_id: AutomationId del elemento
                - title: Título/nombre del elemento
                - control_type: Tipo de control (Button, Edit, etc.)
                - class_name: Nombre de clase del control
                - found_index: Índice del elemento si hay múltiples (0-based)
                - coordinates: [x, y] para click directo por coordenadas

        Returns:
            Elemento encontrado

        Raises:
            ElementNotFoundError: Si no se encuentra el elemento
        """
        # Caso especial: coordenadas (no requiere app conectada)
        if selector.get('coordinates'):
            coords = selector['coordinates']
            if isinstance(coords, list) and len(coords) == 2:
                # Retornar un wrapper especial para coordenadas
                # El método click() manejará esto
                return {'type': 'coordinates', 'x': coords[0], 'y': coords[1]}
        
        if not self.current_app:
            raise DesktopEngineError("No hay aplicación conectada. Use connect_to_window() primero")

        try:
            # Construir criterios de búsqueda
            criteria = {}
            found_index = selector.get('found_index', 0)

            if selector.get('auto_id'):
                criteria['auto_id'] = selector['auto_id']
            if selector.get('title'):
                criteria['title'] = selector['title']
            if selector.get('control_type'):
                criteria['control_type'] = selector['control_type']
            if selector.get('class_name'):
                criteria['class_name'] = selector['class_name']

            if not criteria:
                raise ValueError("Selector vacío. Proporcione al menos un criterio")

            # Buscar elemento
            window = self.current_app.window()
            
            # Si hay found_index especificado, buscar todos los elementos que coincidan
            if found_index is not None and found_index >= 0:
                try:
                    # Buscar todos los elementos descendientes que coincidan con los criterios
                    # Usar child_window() para obtener hijos directos primero
                    all_matches = []
                    
                    # Buscar en hijos directos
                    try:
                        children = window.children()
                        for child in children:
                            if self._matches_criteria(child, criteria):
                                all_matches.append(child)
                    except Exception:
                        pass
                    
                    # Si no encontramos suficientes, buscar en descendientes más profundos
                    if len(all_matches) <= found_index:
                        try:
                            # Buscar en todos los descendientes
                            all_descendants = window.descendants()
                            for desc in all_descendants:
                                if self._matches_criteria(desc, criteria):
                                    # Evitar duplicados
                                    if desc not in all_matches:
                                        all_matches.append(desc)
                        except Exception:
                            pass
                    
                    # Seleccionar elemento por índice
                    if found_index < len(all_matches):
                        element = all_matches[found_index]
                    else:
                        raise ElementNotFoundError(
                            f"Índice {found_index} fuera de rango. "
                            f"Solo se encontraron {len(all_matches)} elementos que coinciden"
                        )
                except ElementNotFoundError:
                    raise
                except Exception as e:
                    # Si falla la búsqueda por índice, intentar sin índice como fallback
                    logger.warning(f"Error buscando por índice {found_index}, intentando sin índice: {e}")
                    element = window.child_window(**criteria)
            else:
                # Buscar primer elemento (sin índice)
                element = window.child_window(**criteria)
            
            element.wait('exists', timeout=self.timeout)

            logger.info(f"Elemento encontrado: {criteria} (found_index={found_index})")
            return element

        except findwindows.ElementNotFoundError as e:
            raise ElementNotFoundError(f"Elemento no encontrado: {selector}")
        except Exception as e:
            logger.error(f"Error buscando elemento: {e}")
            raise

    def click(self, selector: Dict[str, Any], double: bool = False) -> None:
        """
        Hace click en un elemento

        Args:
            selector: Criterios para encontrar el elemento
            double: Si True, hace doble click

        Raises:
            ElementNotFoundError: Si no se encuentra el elemento
        """
        try:
            element = self.find_element(selector)

            # Caso especial: click por coordenadas
            if isinstance(element, dict) and element.get('type') == 'coordinates':
                import pywinauto.mouse as mouse
                x, y = element['x'], element['y']
                if double:
                    mouse.double_click(coords=(x, y))
                    logger.info(f"Doble click en coordenadas: ({x}, {y})")
                else:
                    mouse.click(coords=(x, y))
                    logger.info(f"Click en coordenadas: ({x}, {y})")
                time.sleep(0.5)
                return

            # Asegurar que el elemento esté habilitado y visible
            element.wait('enabled', timeout=10)
            element.set_focus()

            if double:
                element.double_click_input()
                logger.info(f"Doble click en: {selector}")
            else:
                element.click_input()
                logger.info(f"Click en: {selector}")

            time.sleep(0.5)  # Pequeña pausa para que la UI responda

        except Exception as e:
            logger.error(f"Error haciendo click: {e}")
            raise

    def type_text(self, selector: Dict[str, Any], text: str, clear_first: bool = True) -> None:
        """
        Escribe texto en un elemento

        Args:
            selector: Criterios para encontrar el elemento
            text: Texto a escribir
            clear_first: Si True, limpia el campo antes de escribir

        Raises:
            ElementNotFoundError: Si no se encuentra el elemento
        """
        try:
            element = self.find_element(selector)
            element.wait('enabled', timeout=10)
            element.set_focus()

            if clear_first:
                element.set_text('')

            element.type_keys(text, with_spaces=True, pause=0.05)
            logger.info(f"Texto escrito: '{text}' en {selector}")

            time.sleep(0.3)

        except Exception as e:
            logger.error(f"Error escribiendo texto: {e}")
            raise

    def read_text(self, selector: Dict[str, Any]) -> str:
        """
        Lee el texto de un elemento

        Args:
            selector: Criterios para encontrar el elemento

        Returns:
            Texto del elemento

        Raises:
            ElementNotFoundError: Si no se encuentra el elemento
        """
        try:
            element = self.find_element(selector)
            text = element.window_text()
            logger.info(f"Texto leído: '{text}' de {selector}")
            return text

        except Exception as e:
            logger.error(f"Error leyendo texto: {e}")
            raise

    def wait_for_element(self, selector: Dict[str, Any],
                         condition: str = 'exists',
                         timeout: Optional[int] = None) -> bool:
        """
        Espera a que un elemento cumpla una condición

        Args:
            selector: Criterios para encontrar el elemento
            condition: Condición a esperar ('exists', 'visible', 'enabled')
            timeout: Timeout en segundos (usa self.timeout si es None)

        Returns:
            True si la condición se cumple, False si timeout
        """
        timeout = timeout or self.timeout

        try:
            element = self.find_element(selector)
            element.wait(condition, timeout=timeout)
            logger.info(f"Condición '{condition}' cumplida para {selector}")
            return True

        except Exception as e:
            logger.warning(f"Timeout esperando condición '{condition}': {e}")
            return False

    def is_element_exists(self, selector: Dict[str, Any]) -> bool:
        """
        Verifica si un elemento existe

        Args:
            selector: Criterios para encontrar el elemento

        Returns:
            True si existe, False si no
        """
        try:
            self.find_element(selector)
            return True
        except ElementNotFoundError:
            return False

    def get_window_list(self) -> list:
        """
        Obtiene lista de ventanas abiertas

        Returns:
            Lista de dict con info de ventanas (title, handle, class_name)
        """
        try:
            desktop = Desktop(backend=self.backend)
            windows = desktop.windows()

            window_list = []
            for win in windows:
                try:
                    window_list.append({
                        'title': win.window_text(),
                        'handle': win.handle,
                        'class_name': win.class_name(),
                        'is_visible': win.is_visible()
                    })
                except:
                    continue

            logger.info(f"Encontradas {len(window_list)} ventanas")
            return window_list

        except Exception as e:
            logger.error(f"Error obteniendo lista de ventanas: {e}")
            return []

    def close_current_app(self) -> None:
        """Cierra la aplicación actual"""
        if self.current_app:
            try:
                self.current_app.kill()
                logger.info("Aplicación cerrada")
                self.current_app = None
            except Exception as e:
                logger.error(f"Error cerrando aplicación: {e}")

    def _matches_criteria(self, element: UIAWrapper, criteria: Dict[str, Any]) -> bool:
        """
        Verifica si un elemento coincide con los criterios dados.
        
        Args:
            element: Elemento a verificar
            criteria: Criterios de búsqueda
            
        Returns:
            True si coincide con TODOS los criterios especificados, False si no
        """
        try:
            # AutomationId (debe coincidir exactamente)
            if criteria.get('auto_id'):
                try:
                    element_auto_id = element.automation_id()
                    if element_auto_id != criteria['auto_id']:
                        return False
                except Exception:
                    # Si el elemento no tiene automation_id pero lo requerimos, no coincide
                    return False
            
            # Title/Name (búsqueda parcial - contiene el texto)
            if criteria.get('title'):
                try:
                    element_text = element.window_text()
                    if criteria['title'] not in element_text:
                        return False
                except Exception:
                    # Si no podemos obtener el texto pero lo requerimos, no coincide
                    return False
            
            # Control Type (debe coincidir exactamente)
            if criteria.get('control_type'):
                try:
                    element_type = element.element_info.control_type
                    if element_type != criteria['control_type']:
                        return False
                except Exception:
                    # Si no podemos obtener el tipo pero lo requerimos, no coincide
                    return False
            
            # Class Name (debe coincidir exactamente)
            if criteria.get('class_name'):
                try:
                    element_class = element.class_name()
                    if element_class != criteria['class_name']:
                        return False
                except Exception:
                    # Si no podemos obtener la clase pero lo requerimos, no coincide
                    return False
            
            # Si llegamos aquí, todos los criterios especificados coinciden
            return True
        except Exception as e:
            logger.debug(f"Error verificando criterios: {e}")
            return False

    def take_screenshot(self, path: str) -> bool:
        """
        Toma captura de pantalla

        Args:
            path: Ruta donde guardar la captura

        Returns:
            True si éxito, False si error
        """
        try:
            if self.current_app:
                self.current_app.top_window().capture_as_image().save(path)
            else:
                Desktop(backend=self.backend).top_window().capture_as_image().save(path)

            logger.info(f"Screenshot guardado: {path}")
            return True

        except Exception as e:
            logger.error(f"Error tomando screenshot: {e}")
            return False
