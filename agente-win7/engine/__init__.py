"""
Motor de automatización RPA para Windows 7
"""

__version__ = '1.0.0-win7'

from .desktop import DesktopEngine
from .excel import ExcelEngine
from .executor import WorkflowExecutor

__all__ = [
    'DesktopEngine',
    'ExcelEngine',
    'WorkflowExecutor'
]
