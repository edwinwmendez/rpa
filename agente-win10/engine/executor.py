# Workflow Executor
# Ejecuta workflows paso a paso

import logging
import re

class WorkflowExecutor:
    """Ejecutor de workflows"""
    
    def __init__(self, desktop_engine, web_engine, excel_engine):
        self.desktop = desktop_engine
        self.web = web_engine
        self.excel = excel_engine
        self.variables = {}
    
    def execute(self, workflow: dict) -> dict:
        """
        Ejecuta un workflow completo
        
        Args:
            workflow: Dict con estructura del workflow
        
        Returns:
            Resultado de la ejecución
        """
        steps = workflow.get('steps', [])
        total_steps = len(steps)
        
        logging.info(f"Iniciando ejecución de workflow: {total_steps} pasos")
        
        results = {
            'status': 'running',
            'currentStep': 0,
            'totalSteps': total_steps,
            'logs': []
        }
        
        try:
            for i, step in enumerate(steps):
                self._execute_step(step)
                results['currentStep'] = i + 1
                results['logs'].append(f"✅ Paso {i+1} completado")
            
            results['status'] = 'completed'
            logging.info("Workflow completado exitosamente")
            
        except Exception as e:
            results['status'] = 'error'
            results['error'] = str(e)
            logging.error(f"Error ejecutando workflow: {e}")
        
        return results
    
    def _execute_step(self, step: dict) -> None:
        """Ejecuta un paso individual"""
        step_type = step.get('type')
        
        if step_type == 'desktop_click':
            self.desktop.click(step['selector'])
        
        elif step_type == 'desktop_type':
            text = self._replace_variables(step['text'])
            self.desktop.type_text(step['selector'], text)
        
        elif step_type == 'web_navigate':
            url = self._replace_variables(step['url'])
            self.web.navigate(url)
        
        elif step_type == 'web_click':
            self.web.click(step['selector'])
        
        elif step_type == 'excel_read':
            data = self.excel.read_excel(step['file_path'])
            var_name = step.get('variable_name', 'data')
            self.variables[var_name] = data
        
        else:
            logging.warning(f"Tipo de paso desconocido: {step_type}")
    
    def _replace_variables(self, text: str) -> str:
        """Reemplaza {{variable}} con su valor"""
        pattern = r'\{\{(\w+)\}\}'
        
        def replacer(match):
            var_name = match.group(1)
            return str(self.variables.get(var_name, match.group(0)))
        
        return re.sub(pattern, replacer, text)
