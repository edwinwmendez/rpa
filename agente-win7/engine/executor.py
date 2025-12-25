"""
Ejecutor de workflows RPA
Procesa nodos y ejecuta acciones en orden
"""

import logging
import re
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from .desktop import DesktopEngine, DesktopEngineError
from .excel import ExcelEngine, ExcelEngineError

logger = logging.getLogger(__name__)


class WorkflowExecutorError(Exception):
    """Excepción base para errores del ejecutor"""
    pass


class InvalidWorkflowError(WorkflowExecutorError):
    """Workflow inválido o mal formado"""
    pass


class WorkflowExecutor:
    """
    Ejecutor principal de workflows RPA
    Procesa nodos, maneja loops, condicionales y variables
    """

    def __init__(self, desktop_engine: Optional[DesktopEngine] = None,
                 excel_engine: Optional[ExcelEngine] = None):
        """
        Inicializa el ejecutor

        Args:
            desktop_engine: Motor desktop (se crea uno si es None)
            excel_engine: Motor Excel (se crea uno si es None)
        """
        self.desktop = desktop_engine or DesktopEngine()
        self.excel = excel_engine or ExcelEngine()

        # Contexto de ejecución
        self.variables: Dict[str, Any] = {}
        self.current_row: Dict[str, Any] = {}
        self.execution_logs: List[str] = []
        self.execution_status: str = 'idle'

        logger.info("WorkflowExecutor inicializado (Desktop + Excel)")

    def execute(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta un workflow completo

        Args:
            workflow: Dict con la estructura del workflow
                {
                    "name": "Nombre del workflow",
                    "nodes": [...],  # Lista de nodos
                    "edges": [...],  # Conexiones entre nodos
                    "variables": {...}  # Variables globales opcionales
                }

        Returns:
            Dict con resultado de la ejecución
            {
                "status": "success" | "error" | "stopped",
                "executed_nodes": int,
                "logs": [str],
                "error": str (opcional),
                "duration_seconds": float
            }
        """
        start_time = time.time()
        self.execution_logs = []
        self.execution_status = 'running'

        try:
            # Validar workflow
            self._validate_workflow(workflow)

            # Inicializar variables globales
            if workflow.get('variables'):
                self.variables.update(workflow['variables'])

            # Obtener nodos ordenados (según edges)
            nodes = workflow.get('nodes', [])
            edges = workflow.get('edges', [])
            ordered_nodes = self._order_nodes(nodes, edges)

            self._log(f"Iniciando workflow: {workflow.get('name', 'Sin nombre')}")
            self._log(f"Total de nodos: {len(ordered_nodes)}")

            # Ejecutar cada nodo
            for i, node in enumerate(ordered_nodes, 1):
                self._log(f"\n--- Ejecutando nodo {i}/{len(ordered_nodes)}: {node.get('type')} ---")
                self._execute_node(node)
                self._log(f"✅ Nodo {i} completado")

            # Ejecución exitosa
            duration = time.time() - start_time
            self.execution_status = 'success'

            return {
                'status': 'success',
                'executed_nodes': len(ordered_nodes),
                'logs': self.execution_logs,
                'duration_seconds': round(duration, 2)
            }

        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Error en ejecución: {str(e)}"
            self._log(f"\n❌ {error_msg}")
            self.execution_status = 'error'

            logger.error(error_msg)

            return {
                'status': 'error',
                'error': str(e),
                'logs': self.execution_logs,
                'duration_seconds': round(duration, 2)
            }

    def _validate_workflow(self, workflow: Dict[str, Any]) -> None:
        """
        Valida estructura del workflow

        Raises:
            InvalidWorkflowError: Si el workflow es inválido
        """
        if not isinstance(workflow, dict):
            raise InvalidWorkflowError("El workflow debe ser un diccionario")

        if 'nodes' not in workflow:
            raise InvalidWorkflowError("El workflow debe tener 'nodes'")

        if not isinstance(workflow['nodes'], list):
            raise InvalidWorkflowError("'nodes' debe ser una lista")

        if len(workflow['nodes']) == 0:
            raise InvalidWorkflowError("El workflow debe tener al menos un nodo")

    def _order_nodes(self, nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
        """
        Ordena nodos según las conexiones (edges)
        Por ahora retorna en orden original, implementación simple

        Args:
            nodes: Lista de nodos
            edges: Lista de conexiones

        Returns:
            Lista de nodos ordenados
        """
        # TODO: Implementar ordenamiento topológico para workflows complejos
        # Por ahora retornamos en orden original
        return nodes

    def _execute_node(self, node: Dict[str, Any]) -> None:
        """
        Ejecuta un nodo individual

        Args:
            node: Nodo a ejecutar

        Raises:
            WorkflowExecutorError: Si hay error ejecutando el nodo
        """
        node_type = node.get('type')
        node_data = node.get('data', {})

        try:
            if node_type == 'action':
                self._execute_action_node(node_data)

            elif node_type == 'loop':
                self._execute_loop_node(node_data)

            elif node_type == 'ifElse':
                self._execute_if_else_node(node_data)

            else:
                logger.warning(f"Tipo de nodo desconocido: {node_type}")

        except Exception as e:
            raise WorkflowExecutorError(f"Error ejecutando nodo {node_type}: {e}")

    def _execute_action_node(self, data: Dict[str, Any]) -> None:
        """Ejecuta un nodo de acción (click, type, wait, etc.)"""
        action_type = data.get('actionType')
        params = data.get('params', {})

        if action_type == 'click':
            self._action_click(params)

        elif action_type == 'type':
            self._action_type(params)

        elif action_type == 'wait':
            self._action_wait(params)

        elif action_type == 'readText':
            self._action_read_text(params)

        elif action_type == 'extract':
            self._action_extract(params)

        elif action_type == 'navigate':
            # Acción no soportada
            pass

        else:
            logger.warning(f"Acción desconocida: {action_type}")

    def _execute_loop_node(self, data: Dict[str, Any]) -> None:
        """Ejecuta un nodo loop (iterar sobre Excel, N veces, etc.)"""
        loop_type = data.get('loopType')
        child_nodes = data.get('childNodes', [])
        child_edges = data.get('childEdges', [])

        if loop_type == 'excel':
            self._loop_excel(data, child_nodes, child_edges)

        elif loop_type == 'times':
            self._loop_times(data, child_nodes, child_edges)

        elif loop_type in ['while', 'until']:
            self._loop_conditional(data, child_nodes, child_edges)

        else:
            logger.warning(f"Tipo de loop desconocido: {loop_type}")

    def _execute_if_else_node(self, data: Dict[str, Any]) -> None:
        """Ejecuta un nodo condicional if/else"""
        condition = data.get('condition', '')
        true_nodes = data.get('trueNodes', [])
        false_nodes = data.get('falseNodes', [])

        # Evaluar condición (simplificado)
        condition_result = self._evaluate_condition(condition)

        if condition_result:
            self._log(f"Condición TRUE: {condition}")
            for node in true_nodes:
                self._execute_node(node)
        else:
            self._log(f"Condición FALSE: {condition}")
            for node in false_nodes:
                self._execute_node(node)

    # ==================== UTILIDADES DE SELECTOR ====================
    
    def _parse_selector(self, selector: Any) -> Dict[str, Any]:
        """
        Parsea un selector a formato dict para DesktopEngine.
        
        Soporta múltiples formatos:
        - String: "auto_id:btnGuardar" -> {"auto_id": "btnGuardar"}
        - String: "name:Aceptar|control_type:Button|found_index:0" -> {"title": "Aceptar", "control_type": "Button", "found_index": 0}
        - String: "coordinates:350,240" -> {"coordinates": [350, 240]}
        - Dict: Ya está en formato correcto -> se retorna tal cual
        
        Args:
            selector: Selector en formato string o dict
            
        Returns:
            Dict con criterios de búsqueda para DesktopEngine
        """
        # Si ya es un dict, retornarlo
        if isinstance(selector, dict):
            return selector
        
        # Si es string, parsearlo
        if isinstance(selector, str):
            selector_dict = {}
            
            # Caso especial: coordinates
            if selector.startswith('coordinates:'):
                coords_str = selector.replace('coordinates:', '')
                try:
                    x, y = map(int, coords_str.split(','))
                    return {'coordinates': [x, y]}
                except ValueError:
                    logger.warning(f"Formato de coordenadas inválido: {selector}")
                    return {}
            
            # Parsear formato "tipo:valor|tipo2:valor2"
            parts = selector.split('|')
            for part in parts:
                if ':' in part:
                    key, value = part.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Mapear keys del selector a keys de DesktopEngine
                    if key == 'auto_id':
                        selector_dict['auto_id'] = value
                    elif key == 'name':
                        selector_dict['title'] = value  # DesktopEngine usa 'title' no 'name'
                    elif key == 'class_name':
                        selector_dict['class_name'] = value
                    elif key == 'control_type':
                        selector_dict['control_type'] = value
                    elif key == 'found_index':
                        # found_index se maneja después si hay múltiples elementos
                        try:
                            selector_dict['found_index'] = int(value)
                        except ValueError:
                            pass
            
            return selector_dict
        
        # Tipo desconocido
        logger.warning(f"Tipo de selector no soportado: {type(selector)}")
        return {}

    # ==================== ACCIONES ====================

    def _action_click(self, params: Dict[str, Any]) -> None:
        """Acción: Click en elemento"""
        selector_raw = params.get('selector', {})
        selector = self._parse_selector(selector_raw)
        self._log(f"Click en: {selector}")
        self.desktop.click(selector)

    def _action_type(self, params: Dict[str, Any]) -> None:
        """Acción: Escribir texto"""
        selector_raw = params.get('selector', {})
        selector = self._parse_selector(selector_raw)
        text = params.get('text', '')

        # Reemplazar variables
        text = self._replace_variables(text)

        self._log(f"Escribir: '{text}' en {selector}")
        self.desktop.type_text(selector, text)

    def _action_wait(self, params: Dict[str, Any]) -> None:
        """Acción: Esperar"""
        wait_type = params.get('waitType', 'time')

        if wait_type == 'time':
            seconds = params.get('seconds', 1)
            self._log(f"Esperar {seconds} segundos")
            time.sleep(seconds)

        elif wait_type == 'element':
            selector_raw = params.get('selector', {})
            selector = self._parse_selector(selector_raw)
            timeout = params.get('timeout', 30)
            self._log(f"Esperar elemento: {selector}")
            self.desktop.wait_for_element(selector, timeout=timeout)

    def _action_read_text(self, params: Dict[str, Any]) -> None:
        """Acción: Leer texto de elemento"""
        selector_raw = params.get('selector', {})
        selector = self._parse_selector(selector_raw)
        var_name = params.get('variableName', 'text')

        text = self.desktop.read_text(selector)
        self.variables[var_name] = text
        self._log(f"Texto leído y guardado en '{var_name}': {text}")

    def _action_extract(self, params: Dict[str, Any]) -> None:
        """Acción: Extraer datos"""
        # Similar a read_text
        self._action_read_text(params)

    # ==================== LOOPS ====================

    def _loop_excel(self, data: Dict[str, Any],
                    child_nodes: List[Dict], child_edges: List[Dict]) -> None:
        """Loop sobre archivo Excel/CSV"""
        source = data.get('source', '')

        if not source:
            raise WorkflowExecutorError("Loop Excel requiere 'source' (nombre del archivo)")

        self._log(f"Loop Excel sobre: {source}")

        # Resolver ruta del archivo
        # Si es ruta relativa o solo nombre, buscar en excel_csv/
        file_path = Path(source)
        if not file_path.is_absolute():
            # Buscar en carpeta excel_csv/ relativa al proyecto
            # El proyecto está 2 niveles arriba del engine (agente-win7/engine/)
            base_dir = Path(__file__).parent.parent.parent
            excel_dir = base_dir / 'excel_csv'
            file_path = excel_dir / source

        # Si no tiene extensión, buscar con extensiones comunes
        if not file_path.suffix:
            for ext in ['.csv', '.xlsx', '.xls']:
                candidate = file_path.with_suffix(ext)
                if candidate.exists():
                    file_path = candidate
                    break

        # Leer archivo
        rows = self.excel.read_file(str(file_path))
        total_rows = len(rows)

        self._log(f"Total de filas: {total_rows}")

        # Iterar sobre cada fila
        for i, row in enumerate(rows, 1):
            self._log(f"\n  --- Iteración {i}/{total_rows} ---")
            self.current_row = row

            # Ejecutar nodos hijos
            ordered_children = self._order_nodes(child_nodes, child_edges)
            for node in ordered_children:
                self._execute_node(node)

        self._log(f"Loop Excel completado: {total_rows} iteraciones")

    def _loop_times(self, data: Dict[str, Any],
                    child_nodes: List[Dict], child_edges: List[Dict]) -> None:
        """Loop N veces"""
        iterations = data.get('iterations', 1)

        self._log(f"Loop {iterations} veces")

        for i in range(1, iterations + 1):
            self._log(f"\n  --- Iteración {i}/{iterations} ---")
            self.variables['iteration'] = i

            ordered_children = self._order_nodes(child_nodes, child_edges)
            for node in ordered_children:
                self._execute_node(node)

        self._log(f"Loop completado: {iterations} iteraciones")

    def _loop_conditional(self, data: Dict[str, Any],
                          child_nodes: List[Dict], child_edges: List[Dict]) -> None:
        """Loop while/until"""
        loop_type = data.get('loopType')
        condition = data.get('condition', '')
        max_iterations = 100  # Límite de seguridad

        self._log(f"Loop {loop_type}: {condition}")

        iteration = 0
        while iteration < max_iterations:
            iteration += 1

            condition_result = self._evaluate_condition(condition)

            # while: continuar si TRUE, until: continuar si FALSE
            should_continue = condition_result if loop_type == 'while' else not condition_result

            if not should_continue:
                break

            self._log(f"\n  --- Iteración {iteration} ---")

            ordered_children = self._order_nodes(child_nodes, child_edges)
            for node in ordered_children:
                self._execute_node(node)

        self._log(f"Loop {loop_type} completado: {iteration} iteraciones")

    # ==================== UTILIDADES ====================

    def _replace_variables(self, text: str) -> str:
        """
        Reemplaza variables en formato {{variable}} o {{fila.columna}}

        Args:
            text: Texto con variables

        Returns:
            Texto con variables reemplazadas
        """
        # Patrón para {{variable}} o {{fila.columna}}
        pattern = r'\{\{([^}]+)\}\}'

        def replacer(match):
            var_path = match.group(1).strip()

            # Si tiene punto, es acceso a propiedad: fila.columna
            if '.' in var_path:
                parts = var_path.split('.')
                if parts[0] == 'fila':
                    # Acceso a columna de fila actual
                    column = parts[1]
                    return str(self.current_row.get(column, match.group(0)))
                else:
                    # Variable anidada
                    value = self.variables
                    for part in parts:
                        value = value.get(part, {})
                    return str(value) if value != {} else match.group(0)
            else:
                # Variable simple
                return str(self.variables.get(var_path, match.group(0)))

        return re.sub(pattern, replacer, text)

    def _evaluate_condition(self, condition: str) -> bool:
        """
        Evalúa una condición simple
        Por ahora soporta comparaciones básicas

        Args:
            condition: Condición a evaluar (ej: "{{variable}} == 'valor'")

        Returns:
            True si la condición es verdadera
        """
        try:
            # Reemplazar variables
            condition = self._replace_variables(condition)

            # Evaluar expresión simple (CUIDADO: eval es peligroso)
            # En producción, usar un parser seguro
            # Por ahora, solo para comparaciones simples
            result = eval(condition)
            return bool(result)

        except Exception as e:
            logger.warning(f"Error evaluando condición '{condition}': {e}")
            return False

    def _log(self, message: str) -> None:
        """Agrega mensaje al log de ejecución"""
        self.execution_logs.append(message)
        logger.info(message)

    def get_logs(self) -> List[str]:
        """Retorna logs de ejecución"""
        return self.execution_logs.copy()

    def get_status(self) -> str:
        """Retorna estado actual de ejecución"""
        return self.execution_status

    def stop(self) -> None:
        """Detiene la ejecución (para implementación futura)"""
        self.execution_status = 'stopped'
        logger.info("Ejecución detenida por usuario")
