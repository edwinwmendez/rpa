"""
Motor de automatización RPA para Windows 7
"""

__version__ = '1.0.0-win7'

from .desktop import DesktopEngine
from .excel import ExcelEngine
from .executor import WorkflowExecutor
from .element_picker import ElementPicker

__all__ = [
    'DesktopEngine',
    'ExcelEngine',
    'WorkflowExecutor',
    'ElementPicker'
]
