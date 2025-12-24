// Workflows Service - CRUD operations con Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Node, Edge } from '@xyflow/react';

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  excelFiles?: Array<{
    id: string;
    name: string;
    filePath: string;
    headers: string[];
    totalRows: number;
    firstRowAsHeaders: boolean;
    delimiter?: string;
  }>; // Archivos Excel globales del workflow
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastExecutedAt?: Timestamp;
  executionCount: number;
  successCount: number;
  failureCount: number;
  isPublic: boolean;
  tags: string[];
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  excelFiles?: Array<{
    id: string;
    name: string;
    filePath: string;
    headers: string[];
    totalRows: number;
    firstRowAsHeaders: boolean;
    delimiter?: string;
  }>;
  tags?: string[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  nodes?: Node[];
  edges?: Edge[];
  excelFiles?: Array<{
    id: string;
    name: string;
    filePath: string;
    headers: string[];
    totalRows: number;
    firstRowAsHeaders: boolean;
    delimiter?: string;
  }>;
  tags?: string[];
}

class WorkflowsService {
  private getWorkflowsCollection() {
    return collection(db, 'workflows');
  }

  private getWorkflowDoc(id: string) {
    return doc(db, 'workflows', id);
  }

  // Crear nuevo workflow
  async createWorkflow(userId: string, input: CreateWorkflowInput): Promise<string> {
    const workflowsRef = this.getWorkflowsCollection();
    
    const workflowData = {
      userId,
      name: input.name.trim() || 'Workflow sin nombre',
      description: input.description?.trim() || '',
      nodes: input.nodes,
      edges: input.edges,
      excelFiles: input.excelFiles || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      isPublic: false,
      tags: input.tags || [],
    };

    const docRef = await addDoc(workflowsRef, workflowData);
    return docRef.id;
  }

  // Obtener workflow por ID
  async getWorkflow(id: string): Promise<Workflow | null> {
    const docRef = this.getWorkflowDoc(id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Workflow;
  }

  // Obtener todos los workflows de un usuario
  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    const workflowsRef = this.getWorkflowsCollection();
    const q = query(
      workflowsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Workflow[];
  }

  // Obtener workflows recientes
  async getRecentWorkflows(userId: string, count: number = 5): Promise<Workflow[]> {
    const workflowsRef = this.getWorkflowsCollection();
    const q = query(
      workflowsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Workflow[];
  }

  // Actualizar workflow
  async updateWorkflow(id: string, input: UpdateWorkflowInput): Promise<void> {
    const docRef = this.getWorkflowDoc(id);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name.trim() || 'Workflow sin nombre';
    }
    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || '';
    }
    if (input.nodes !== undefined) {
      updateData.nodes = input.nodes;
    }
    if (input.edges !== undefined) {
      updateData.edges = input.edges;
    }
    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }
    if (input.excelFiles !== undefined) {
      updateData.excelFiles = input.excelFiles;
    }

    await updateDoc(docRef, updateData);
  }

  // Eliminar workflow
  async deleteWorkflow(id: string): Promise<void> {
    const docRef = this.getWorkflowDoc(id);
    await deleteDoc(docRef);
  }

  // Incrementar contador de ejecución
  async incrementExecutionCount(id: string, success: boolean): Promise<void> {
    const docRef = this.getWorkflowDoc(id);
    const workflow = await this.getWorkflow(id);
    
    if (!workflow) return;

    await updateDoc(docRef, {
      executionCount: workflow.executionCount + 1,
      successCount: success ? workflow.successCount + 1 : workflow.successCount,
      failureCount: success ? workflow.failureCount : workflow.failureCount + 1,
      lastExecutedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export const workflowsService = new WorkflowsService();

