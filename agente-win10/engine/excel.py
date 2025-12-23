# Excel Automation Engine
# Motor de procesamiento de archivos Excel/CSV

import pandas as pd
import logging

class ExcelEngine:
    """Motor para procesamiento de Excel/CSV"""
    
    def __init__(self):
        logging.info("ExcelEngine inicializado")
    
    def read_excel(self, file_path: str, sheet_name: str = 'Sheet1') -> list:
        """
        Lee archivo Excel y retorna lista de diccionarios
        
        Args:
            file_path: Ruta del archivo
            sheet_name: Nombre de la hoja
        
        Returns:
            Lista de diccionarios (cada fila es un dict)
        """
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            data = df.to_dict('records')
            logging.info(f"Excel leído: {len(data)} filas")
            return data
        except Exception as e:
            logging.error(f"Error leyendo Excel: {e}")
            raise
    
    def read_csv(self, file_path: str) -> list:
        """Lee archivo CSV"""
        try:
            df = pd.read_csv(file_path)
            data = df.to_dict('records')
            logging.info(f"CSV leído: {len(data)} filas")
            return data
        except Exception as e:
            logging.error(f"Error leyendo CSV: {e}")
            raise
    
    def write_excel(self, file_path: str, data: list, sheet_name: str = 'Sheet1') -> None:
        """Escribe datos a Excel"""
        try:
            df = pd.DataFrame(data)
            df.to_excel(file_path, sheet_name=sheet_name, index=False)
            logging.info(f"Excel escrito: {file_path}")
        except Exception as e:
            logging.error(f"Error escribiendo Excel: {e}")
            raise
