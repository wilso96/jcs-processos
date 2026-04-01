import api from './api';
import { Tarefa, ItemChecklist } from '../types';

export interface TarefasResponse {
  tarefas: Tarefa[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TarefaService = {
  async listarTarefas(
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Promise<TarefasResponse> {
    try {
      const params: any = { page, limit };
      if (status) params.status = status;

      const response = await api.get<TarefasResponse>('/tarefas', { params });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao buscar tarefas';
      throw new Error(message);
    }
  },

  async buscarTarefa(id: number): Promise<Tarefa> {
    try {
      const response = await api.get<Tarefa>(`/tarefas/${id}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao buscar tarefa';
      throw new Error(message);
    }
  },

  async buscarItens(tarefaId: number): Promise<ItemChecklist[]> {
    try {
      const response = await api.get<ItemChecklist[]>(`/tarefas/${tarefaId}/itens`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao buscar itens do checklist';
      throw new Error(message);
    }
  },

  async executarItem(
    tarefaId: number,
    itemId: number,
    data: { resposta: string; observacao?: string; foto_url?: string }
  ): Promise<any> {
    try {
      const response = await api.post(`/tarefas/${tarefaId}/itens`, {
        id_item_modelo: itemId,
        ...data,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao salvar item';
      throw new Error(message);
    }
  },

  async atualizarStatus(
    tarefaId: number,
    status: string,
    observacao?: string
  ): Promise<Tarefa> {
    try {
      const data: any = { status };
      if (observacao) data.observacao_geral = observacao;

      const response = await api.put<Tarefa>(`/tarefas/${tarefaId}`, data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao atualizar tarefa';
      throw new Error(message);
    }
  },
};

export default TarefaService;
