# Web Automation Engine
# Motor de automatización web usando Playwright

from playwright.sync_api import sync_playwright, Page
import logging

class WebEngine:
    """Motor de automatización web usando Playwright"""
    
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
        logging.info("WebEngine inicializado (Playwright)")
    
    def start(self):
        """Inicia Playwright y navegador"""
        if not self.playwright:
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(headless=False)
            self.page = self.browser.new_page()
            logging.info("Playwright iniciado")
    
    def stop(self):
        """Detiene Playwright"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        logging.info("Playwright detenido")
    
    def navigate(self, url: str) -> None:
        """Navega a una URL"""
        self.start()
        self.page.goto(url)
        logging.info(f"Navegado a: {url}")
    
    def click(self, selector: str) -> None:
        """Hace click en elemento web"""
        self.page.click(selector)
        logging.info(f"Click en: {selector}")
    
    def fill(self, selector: str, text: str) -> None:
        """Llena un campo de formulario"""
        self.page.fill(selector, text)
        logging.info(f"Campo llenado: {selector}")
    
    def read_text(self, selector: str) -> str:
        """Lee texto de elemento web"""
        text = self.page.inner_text(selector)
        logging.info(f"Texto leído: {text}")
        return text
