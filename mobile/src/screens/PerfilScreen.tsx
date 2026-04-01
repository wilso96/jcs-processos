import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/AuthService';
import { SyncService } from '../services/SyncService';
import { getUsuario } from '../services/api';
import { clearAllData } from '../database/TarefaRepository';
import { RootStackParamList, SyncStatus } from '../types';

type PerfilScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function PerfilScreen({ navigation }: PerfilScreenProps) {
  const [usuario, setUsuario] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSyncStatus();

    // Listener para sync
    SyncService.addListener(setSyncStatus);

    return () => {
      SyncService.removeListener(setSyncStatus);
    };
  }, []);

  const loadUserData = async () => {
    const user = await getUsuario();
    setUsuario(user);
  };

  const loadSyncStatus = async () => {
    const status = await SyncService.getStatus();
    setSyncStatus(status);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const success = await SyncService.syncPendingData();
      if (success) {
        Alert.alert('Sucesso', 'Dados sincronizados com sucesso!');
      } else {
        Alert.alert('Aviso', 'Não há dados para sincronizar ou você está offline.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao sincronizar dados.');
    } finally {
      setSyncing(false);
      loadSyncStatus();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              await clearAllData();
              SyncService.stopAutoSync();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.nome}>{usuario?.nome || 'Usuário'}</Text>
        <Text style={styles.perfil}>{usuario?.perfil || 'Colaborador'}</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Login:</Text>
          <Text style={styles.infoValue}>{usuario?.login || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{usuario?.email || '-'}</Text>
        </View>
      </View>

      {/* Sync Status */}
      <View style={styles.syncCard}>
        <Text style={styles.sectionTitle}>Sincronização</Text>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
          <Ionicons
            name={syncStatus?.isOnline ? 'radio' : 'radio-outline'}
            size={24}
            color={syncStatus?.isOnline ? '#28a745' : '#dc3545'}
          />
            <Text style={styles.statusLabel}>
              {syncStatus?.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons
              name="cloud-upload"
              size={24}
              color={syncStatus?.pendingCount > 0 ? '#ffc107' : '#28a745'}
            />
            <Text style={styles.statusLabel}>
              {syncStatus?.pendingCount || 0} pendente(s)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.buttonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sync" size={20} color="#fff" />
              <Text style={styles.syncButtonText}>Sincronizar Agora</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>JCS Colaborador</Text>
        <Text style={styles.appVersion}>Versão 1.0.0</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#dc3545" />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  perfil: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  syncCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  syncButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b0d4ff',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  appName: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  appVersion: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
  },
});
