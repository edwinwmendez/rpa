// Hook para manejar historial de cambios (Undo/Redo) en el workflow editor
import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY_SIZE = 50;

export function useWorkflowHistory(initialNodes: Node[], initialEdges: Edge[]) {
  const [history, setHistory] = useState<HistoryState[]>(() => [
    { nodes: [...initialNodes], edges: [...initialEdges] }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);
  const lastSavedStateRef = useRef<string>('');

  const saveState = useCallback((nodes: Node[], edges: Edge[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Serializar estado para comparar (evitar guardar estados duplicados)
    const stateKey = JSON.stringify({ nodes, edges });
    if (stateKey === lastSavedStateRef.current) {
      return;
    }
    lastSavedStateRef.current = stateKey;

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      const newState = { 
        nodes: nodes.map(n => ({ ...n })), 
        edges: edges.map(e => ({ ...e })) 
      };
      
      newHistory.push(newState);
      
      // Limitar tamaño del historial
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= MAX_HISTORY_SIZE ? MAX_HISTORY_SIZE - 1 : newIndex;
    });
  }, [historyIndex]);

  const undo = useCallback((): HistoryState | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      isUndoRedoRef.current = true;
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback((): HistoryState | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      isUndoRedoRef.current = true;
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const resetHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    const newState = { 
      nodes: nodes.map(n => ({ ...n })), 
      edges: edges.map(e => ({ ...e })) 
    };
    setHistory([newState]);
    setHistoryIndex(0);
    lastSavedStateRef.current = JSON.stringify(newState);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}

