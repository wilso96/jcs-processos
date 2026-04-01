import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getTarefasByResponsavel } from '../database/TarefaRepository';
import { SyncService } from '../services/SyncService';
import { Tarefa, RootStackParamList, SyncStatus } from '../types';
import { getUsuario } from '../services/api';

type TarefasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function TarefasScreen({ navigation }: TarefasScreenProps) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const loadTarefas = useCallback(async () => {
    try {
      // Busca o usuário logado
      const usuario = await getUsuario();
      
      if (usuario && usuario.id) {
        // Busca tarefas do usuário logado, ordenadas por status (pendentes primeiro)
        const data = await getTarefasByResponsavel(usuario.id);
        setTarefas(data);
      } else {
        setTarefas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setTarefas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSyncStatus = useCallback(async () => {
    const status = await SyncService.getStatus();
    setSyncStatus(status);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTarefas();
      loadSyncStatus();
    }, [loadTarefas, loadSyncStatus])
  );

  useEffect(() => {
    // Adiciona listener para mudanças de sync
    SyncService.addListener(setSyncStatus);

    return () => {
      SyncService.removeListener(setSyncStatus);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await SyncService.fetchAndSaveTarefas();
    await loadTarefas();
    await loadSyncStatus();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return '#28a745';
      case 'em_andamento':
        return '#ffc107';
      default:
        return '#dc3545';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const renderTarefa = ({ item }: { item: Tarefa }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Checklist', { tarefaId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        {item.sincronizado === 0 && (
          <Ionicons name="cloud-offline" size={18} color="#ff6b6b" />
        )}
      </View>

      <Text style={styles.titulo}>{item.titulo}</Text>

      {item.modelo_nome && (
        <Text style={styles.subtitle}>{item.modelo_nome}</Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateText}>{formatDate(item.data_programada)}</Text>
        </View>

        {item.hora_programada && (
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>{item.hora_programada.slice(0, 5)}</Text>
          </View>
        )}

        <View style={styles.priorityBadge}>
          <Text
            style={[
              styles.priorityText,
              { color: item.prioridade === 'alta' ? '#dc3545' : '#666' },
            ]}
          >
            {item.prioridade}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
      <Text style={styles.emptySubtext}>
        Suas tarefas aparecerão aqui quando forem atribuídas a você
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Carregando tarefas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons
            name={syncStatus?.isOnline ? 'radio' : 'radio-outline'}
            size={20}
            color={syncStatus?.isOnline ? '#28a745' : '#dc3545'}
          />
          <Text style={styles.statusBarText}>
            {syncStatus?.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {syncStatus?.pendingCount > 0 && (
          <View style={styles.statusItem}>
            <Ionicons name="cloud-upload" size={20} color="#ffc107" />
            <Text style={styles.statusBarText}>
              {syncStatus.pendingCount} pendente(s)
            </Text>
          </View>
        )}

        {syncStatus?.isSyncing && (
          <ActivityIndicator size="small" color="#007bff" />
        )}
      </View>

      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTarefa}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBarText: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  priorityBadge: {
    marginLeft: 'auto',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
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
});
