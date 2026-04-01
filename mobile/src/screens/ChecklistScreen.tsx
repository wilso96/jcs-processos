import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Tarefa, ItemChecklist, RootStackParamList } from '../types';
import { getTarefaById } from '../database/TarefaRepository';
import {
  getItensByTarefaId,
  updateItemResposta,
  updateTarefaStatus,
} from '../database/TarefaRepository';
import { addToSyncQueue } from '../database/SyncRepository';
import { SyncService } from '../services/SyncService';

type ChecklistScreenRouteProp = RouteProp<RootStackParamList, 'Checklist'>;

export default function ChecklistScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChecklistScreenRouteProp>();
  const { tarefaId } = route.params;

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [itens, setItens] = useState<ItemChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Observação modal
  const [obsModalVisible, setObsModalVisible] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');

  // Câmera modal
  const [cameraVisible, setCameraVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const tarefaData = await getTarefaById(tarefaId);
      setTarefa(tarefaData);

      // Tenta buscar da API primeiro
      await SyncService.fetchAndSaveItens(tarefaId);

      // Depois carrega do local
      const itensData = await getItensByTarefaId(tarefaId);
      setItens(itensData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  }, [tarefaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleResposta = async (item: ItemChecklist) => {
    const newResposta = item.resposta === 'sim' ? null : 'sim';

    // Atualiza localmente
    setItens(prev =>
      prev.map(i =>
        i.id === item.id ? { ...i, resposta: newResposta } : i
      )
    );

    // Salva no SQLite local
    await updateItemResposta(item.id, newResposta, item.observacao, 0);

    // Adiciona na fila de sync
    await addToSyncQueue({
      tabela: 'item_checklist',
      acao: 'update',
      registro_id: item.id,
      dados: {
        id_item_modelo: item.id_item_modelo,
        resposta: newResposta,
        observacao: item.observacao,
      },
    });

    // Tenta sync imediato se online
    const status = await SyncService.getStatus();
    if (status.isOnline) {
      SyncService.syncPendingData();
    }
  };

  const toggleNao = async (item: ItemChecklist) => {
    const newResposta = item.resposta === 'nao' ? null : 'nao';

    setItens(prev =>
      prev.map(i =>
        i.id === item.id ? { ...i, resposta: newResposta } : i
      )
    );

    await updateItemResposta(item.id, newResposta, item.observacao, 0);

    await addToSyncQueue({
      tabela: 'item_checklist',
      acao: 'update',
      registro_id: item.id,
      dados: {
        id_item_modelo: item.id_item_modelo,
        resposta: newResposta,
        observacao: item.observacao,
      },
    });
  };

  const openObservacao = (itemId: number) => {
    const item = itens.find(i => i.id === itemId);
    setCurrentItemId(itemId);
    setObservacao(item?.observacao || '');
    setObsModalVisible(true);
  };

  const saveObservacao = async () => {
    if (currentItemId === null) return;

    setItens(prev =>
      prev.map(i =>
        i.id === currentItemId ? { ...i, observacao } : i
      )
    );

    const item = itens.find(i => i.id === currentItemId);
    await updateItemResposta(currentItemId, item?.resposta || null, observacao, 0);

    await addToSyncQueue({
      tabela: 'item_checklist',
      acao: 'update',
      registro_id: currentItemId,
      dados: {
        id_item_modelo: item?.id_item_modelo,
        resposta: item?.resposta,
        observacao,
      },
    });

    setObsModalVisible(false);
  };

  const finalizarTarefa = async () => {
    Alert.alert(
      'Finalizar Tarefa',
      'Deseja marcar esta tarefa como concluída?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            setSaving(true);
            try {
              await updateTarefaStatus(tarefaId, 'concluida', 0);

              await addToSyncQueue({
                tabela: 'tarefa_status',
                acao: 'update',
                registro_id: tarefaId,
                dados: {
                  tarefa_id: tarefaId,
                  status: 'concluida',
                },
              });

              const status = await SyncService.getStatus();
              if (status.isOnline) {
                await SyncService.syncPendingData();
              }

              Alert.alert('Sucesso', 'Tarefa finalizada com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível finalizar a tarefa');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const getProgress = () => {
    const total = itens.length;
    const respondidos = itens.filter(i => i.resposta !== null).length;
    return total > 0 ? Math.round((respondidos / total) * 100) : 0;
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'sim':
        return '#28a745';
      case 'nao':
        return '#dc3545';
      default:
        return '#ccc';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Carregando checklist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{tarefa?.titulo || 'Checklist'}</Text>
          {tarefa?.modelo_nome && (
            <Text style={styles.headerSubtitle}>{tarefa.modelo_nome}</Text>
          )}
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${getProgress()}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{getProgress()}% concluído</Text>
      </View>

      {/* Lista de Itens */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {itens.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View
                style={[
                  styles.itemNumber,
                  { backgroundColor: getStatusColor(item.resposta) },
                ]}
              >
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.itemDescricao}>{item.descricao}</Text>
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.simButton,
                  item.resposta === 'sim' && styles.actionButtonActive,
                ]}
                onPress={() => toggleResposta(item)}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={item.resposta === 'sim' ? '#fff' : '#28a745'}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: item.resposta === 'sim' ? '#fff' : '#28a745' },
                  ]}
                >
                  Sim
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.naoButton,
                  item.resposta === 'nao' && styles.actionButtonActive,
                ]}
                onPress={() => toggleNao(item)}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={item.resposta === 'nao' ? '#fff' : '#dc3545'}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: item.resposta === 'nao' ? '#fff' : '#dc3545' },
                  ]}
                >
                  Não
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.obsButton,
                  item.observacao && styles.obsButtonActive,
                ]}
                onPress={() => openObservacao(item.id)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={item.observacao ? '#007bff' : '#999'}
                />
              </TouchableOpacity>
            </View>

            {item.observacao && (
              <View style={styles.obsPreview}>
                <Text style={styles.obsPreviewText}>{item.observacao}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer com Finalizar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.finalizarButton, saving && styles.buttonDisabled]}
          onPress={finalizarTarefa}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.finalizarText}>Finalizar Tarefa</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Observação */}
      <Modal
        visible={obsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setObsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Observação</Text>
            <TextInput
              style={styles.obsInput}
              placeholder="Digite uma observação (opcional)"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setObsModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveObservacao}
              >
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'right',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemDescricao: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    flex: 1,
    gap: 6,
  },
  simButton: {
    borderColor: '#28a745',
    backgroundColor: 'transparent',
  },
  naoButton: {
    borderColor: '#dc3545',
    backgroundColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: 'currentColor',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  obsButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  obsButtonActive: {
    borderColor: '#007bff',
    backgroundColor: '#e6f0ff',
  },
  obsPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  obsPreviewText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  finalizarButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  finalizarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  obsInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
