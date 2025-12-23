# Desktop Automation Engine
# Motor de automatización para aplicaciones de escritorio

from pywinauto import Application, Desktop
import logging

class DesktopEngine:
    """Motor de automatización desktop usando pywinauto"""
    
    def __init__(self):
        self.backend = "uia"  # Default: UI Automation
        logging.info("DesktopEngine inicializado (backend: uia)")
    
    def click(self, selector: dict) -> None:
        """
        Hace click en un elemento
        
        Args:
            selector: Dict con propiedades del elemento
                - window_title: Título de la ventana
                - auto_id: AutomationId del elemento
                - name: Nombre del elemento
                - control_type: Tipo de control
        """
        try:
            # Conectar a la aplicación
            app = Application(backend=self.backend).connect(
                title=selector['window_title']
            )
            
            # Encontrar elemento
            if selector.get('auto_id'):
                element = app.window(auto_id=selector['auto_id'])
            elif selector.get('name'):
                element = app.window(title=selector['name'])
            else:
                raise ValueError("Selector inválido")
            
            # Hacer click
            element.click_input()
            logging.info(f"Click exitoso en: {selector}")
            
        except Exception as e:
            logging.error(f"Error en click: {e}")
            raise
    
    def type_text(self, selector: dict, text: str) -> None:
        """Escribe texto en un elemento"""
        try:
            app = Application(backend=self.backend).connect(
                title=selector['window_title']
            )
            
            element = app.window(auto_id=selector['auto_id'])
            element.set_text(text)
            
            logging.info(f"Texto escrito: {text}")
        except Exception as e:
            logging.error(f"Error escribiendo texto: {e}")
            raise
    
    def read_text(self, selector: dict) -> str:
        """Lee texto de un elemento"""
        try:
            app = Application(backend=self.backend).connect(
                title=selector['window_title']
            )
            
            element = app.window(auto_id=selector['auto_id'])
            text = element.window_text()
            
            logging.info(f"Texto leído: {text}")
            return text
        except Exception as e:
            logging.error(f"Error leyendo texto: {e}")
            raise
