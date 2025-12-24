"""
Motor de procesamiento de archivos Excel y CSV
Soporta lectura/escritura con pandas y automatización COM con pywin32
"""

import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
import pandas as pd

logger = logging.getLogger(__name__)


class ExcelEngineError(Exception):
    """Excepción base para errores del motor Excel"""
    pass


class FileNotFoundError(ExcelEngineError):
    """Archivo no encontrado"""
    pass


class InvalidFileFormatError(ExcelEngineError):
    """Formato de archivo inválido"""
    pass


class ExcelEngine:
    """
    Motor para procesamiento de archivos Excel y CSV
    Usa pandas para lectura/escritura eficiente
    Soporte para pywin32 COM automation cuando Excel está instalado
    """

    SUPPORTED_FORMATS = {'.xlsx', '.xls', '.xlsm', '.csv', '.tsv'}

    def __init__(self, use_com: bool = False):
        """
        Inicializa el motor Excel

        Args:
            use_com: Si True, intenta usar COM automation de Excel (requiere Excel instalado)
        """
        self.use_com = use_com
        self.com_excel = None

        if use_com:
            try:
                import win32com.client
                self.com_excel = win32com.client.Dispatch("Excel.Application")
                self.com_excel.Visible = False
                logger.info("ExcelEngine inicializado con COM automation")
            except Exception as e:
                logger.warning(f"No se pudo inicializar COM automation: {e}")
                self.use_com = False
                logger.info("ExcelEngine inicializado con pandas")
        else:
            logger.info("ExcelEngine inicializado con pandas")

    def _validate_file_path(self, file_path: str) -> Path:
        """
        Valida que el archivo exista y tenga formato soportado

        Args:
            file_path: Ruta del archivo

        Returns:
            Path object del archivo

        Raises:
            FileNotFoundError: Si el archivo no existe
            InvalidFileFormatError: Si el formato no es soportado
        """
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")

        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise InvalidFileFormatError(
                f"Formato no soportado: {path.suffix}. "
                f"Formatos válidos: {', '.join(self.SUPPORTED_FORMATS)}"
            )

        return path

    def read_file(self, file_path: str, sheet_name: Union[str, int] = 0,
                  header: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        Lee archivo Excel o CSV y retorna lista de diccionarios

        Args:
            file_path: Ruta del archivo
            sheet_name: Nombre o índice de la hoja (solo Excel)
            header: Fila que contiene los encabezados (0-indexed, None si no hay)

        Returns:
            Lista de diccionarios donde cada dict es una fila

        Raises:
            FileNotFoundError: Si el archivo no existe
            InvalidFileFormatError: Si el formato no es soportado
        """
        try:
            path = self._validate_file_path(file_path)

            # Leer según el formato
            if path.suffix.lower() == '.csv':
                df = pd.read_csv(path, header=header, encoding='utf-8-sig')
            elif path.suffix.lower() == '.tsv':
                df = pd.read_csv(path, sep='\t', header=header, encoding='utf-8-sig')
            else:
                # Excel (xlsx, xls, xlsm)
                df = pd.read_excel(path, sheet_name=sheet_name, header=header)

            # Convertir a lista de diccionarios
            data = df.to_dict('records')

            logger.info(f"Archivo leído: {file_path} ({len(data)} filas)")
            return data

        except (FileNotFoundError, InvalidFileFormatError):
            raise
        except Exception as e:
            logger.error(f"Error leyendo archivo: {e}")
            raise ExcelEngineError(f"Error leyendo archivo: {e}")

    def read_excel(self, file_path: str, sheet_name: Union[str, int] = 0,
                   header: Optional[int] = 0) -> List[Dict[str, Any]]:
        """
        Lee archivo Excel específicamente
        Alias de read_file para compatibilidad
        """
        return self.read_file(file_path, sheet_name, header)

    def read_csv(self, file_path: str, header: Optional[int] = 0,
                 delimiter: str = ',', encoding: str = 'utf-8-sig') -> List[Dict[str, Any]]:
        """
        Lee archivo CSV con opciones avanzadas

        Args:
            file_path: Ruta del archivo CSV
            header: Fila de encabezados (None si no hay)
            delimiter: Delimitador (por defecto coma)
            encoding: Codificación del archivo

        Returns:
            Lista de diccionarios
        """
        try:
            path = self._validate_file_path(file_path)
            df = pd.read_csv(path, header=header, delimiter=delimiter, encoding=encoding)
            data = df.to_dict('records')

            logger.info(f"CSV leído: {file_path} ({len(data)} filas)")
            return data

        except Exception as e:
            logger.error(f"Error leyendo CSV: {e}")
            raise ExcelEngineError(f"Error leyendo CSV: {e}")

    def write_file(self, file_path: str, data: List[Dict[str, Any]],
                   sheet_name: str = 'Sheet1', index: bool = False) -> None:
        """
        Escribe datos a archivo Excel o CSV

        Args:
            file_path: Ruta del archivo de salida
            data: Lista de diccionarios a escribir
            sheet_name: Nombre de la hoja (solo Excel)
            index: Si True, incluye índice en la salida

        Raises:
            InvalidFileFormatError: Si el formato no es soportado
        """
        try:
            path = Path(file_path)

            if path.suffix.lower() not in self.SUPPORTED_FORMATS:
                raise InvalidFileFormatError(
                    f"Formato no soportado: {path.suffix}. "
                    f"Formatos válidos: {', '.join(self.SUPPORTED_FORMATS)}"
                )

            # Convertir a DataFrame
            df = pd.DataFrame(data)

            # Crear directorio si no existe
            path.parent.mkdir(parents=True, exist_ok=True)

            # Escribir según formato
            if path.suffix.lower() == '.csv':
                df.to_csv(path, index=index, encoding='utf-8-sig')
            elif path.suffix.lower() == '.tsv':
                df.to_csv(path, sep='\t', index=index, encoding='utf-8-sig')
            else:
                # Excel
                df.to_excel(path, sheet_name=sheet_name, index=index)

            logger.info(f"Archivo escrito: {file_path} ({len(data)} filas)")

        except InvalidFileFormatError:
            raise
        except Exception as e:
            logger.error(f"Error escribiendo archivo: {e}")
            raise ExcelEngineError(f"Error escribiendo archivo: {e}")

    def write_excel(self, file_path: str, data: List[Dict[str, Any]],
                    sheet_name: str = 'Sheet1', index: bool = False) -> None:
        """
        Escribe datos a Excel específicamente
        Alias de write_file para compatibilidad
        """
        self.write_file(file_path, data, sheet_name, index)

    def write_csv(self, file_path: str, data: List[Dict[str, Any]],
                  index: bool = False, encoding: str = 'utf-8-sig') -> None:
        """
        Escribe datos a CSV

        Args:
            file_path: Ruta del archivo CSV de salida
            data: Lista de diccionarios
            index: Si True, incluye índice
            encoding: Codificación del archivo
        """
        try:
            path = Path(file_path)
            df = pd.DataFrame(data)

            path.parent.mkdir(parents=True, exist_ok=True)
            df.to_csv(path, index=index, encoding=encoding)

            logger.info(f"CSV escrito: {file_path} ({len(data)} filas)")

        except Exception as e:
            logger.error(f"Error escribiendo CSV: {e}")
            raise ExcelEngineError(f"Error escribiendo CSV: {e}")

    def get_sheet_names(self, file_path: str) -> List[str]:
        """
        Obtiene nombres de todas las hojas de un archivo Excel

        Args:
            file_path: Ruta del archivo Excel

        Returns:
            Lista de nombres de hojas

        Raises:
            FileNotFoundError: Si el archivo no existe
        """
        try:
            path = self._validate_file_path(file_path)

            if path.suffix.lower() == '.csv':
                return ['Sheet1']  # CSV solo tiene una "hoja"

            # Leer nombres de hojas sin cargar datos
            excel_file = pd.ExcelFile(path)
            sheet_names = excel_file.sheet_names

            logger.info(f"Hojas encontradas en {file_path}: {sheet_names}")
            return sheet_names

        except Exception as e:
            logger.error(f"Error obteniendo nombres de hojas: {e}")
            raise ExcelEngineError(f"Error obteniendo nombres de hojas: {e}")

    def get_column_names(self, file_path: str, sheet_name: Union[str, int] = 0) -> List[str]:
        """
        Obtiene nombres de columnas de un archivo

        Args:
            file_path: Ruta del archivo
            sheet_name: Nombre o índice de la hoja

        Returns:
            Lista de nombres de columnas
        """
        try:
            path = self._validate_file_path(file_path)

            if path.suffix.lower() == '.csv':
                df = pd.read_csv(path, nrows=0)
            else:
                df = pd.read_excel(path, sheet_name=sheet_name, nrows=0)

            columns = df.columns.tolist()
            logger.info(f"Columnas encontradas: {columns}")
            return columns

        except Exception as e:
            logger.error(f"Error obteniendo columnas: {e}")
            raise ExcelEngineError(f"Error obteniendo columnas: {e}")

    def filter_data(self, data: List[Dict[str, Any]],
                    column: str, value: Any) -> List[Dict[str, Any]]:
        """
        Filtra datos por columna y valor

        Args:
            data: Lista de diccionarios
            column: Nombre de columna a filtrar
            value: Valor a buscar

        Returns:
            Lista filtrada
        """
        try:
            df = pd.DataFrame(data)
            filtered_df = df[df[column] == value]
            result = filtered_df.to_dict('records')

            logger.info(f"Datos filtrados: {len(result)} de {len(data)} filas")
            return result

        except Exception as e:
            logger.error(f"Error filtrando datos: {e}")
            raise ExcelEngineError(f"Error filtrando datos: {e}")

    def close(self) -> None:
        """Cierra recursos (COM Excel si está abierto)"""
        if self.use_com and self.com_excel:
            try:
                self.com_excel.Quit()
                logger.info("COM Excel cerrado")
            except Exception as e:
                logger.error(f"Error cerrando COM Excel: {e}")

    def __del__(self):
        """Destructor - cierra recursos automáticamente"""
        self.close()
