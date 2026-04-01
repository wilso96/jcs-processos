# Plano do App Mobile JCS - Colaborador

## Visão Geral
Aplicativo mobile para colaboradores executarem checklists de tarefas, funcionando **online e offline**.

## Tecnologia Escolhida
- **React Native + Expo**: Um código para iOS e Android
- **SQLite Local**: Persistência offline
- **Axios**: Comunicação com API
- **AsyncStorage**: Token JWT e configurações

## Arquitetura - Fluxo Online/Offline

```mermaid
flowchart TB
    subgraph App[App Mobile]
        UI[Telas React Native]
        DB[(SQLite Local)]
        SYNC[Sincronizador]
    end
    
    subgraph API[Backend JCS]
        AUTH[/auth/login]
        TAREFAS[/tarefas]
        ITENS[/tarefas/:id/itens]
    end
    
    UI <-->|1. Grava Local| DB
    UI <-->|2. Envia Fila| SYNC
    SYNC <-->|3. Sync quando online| API
    
    style DB fill:#f9f,stroke:#333
    style SYNC fill:#bbf,stroke:#333
```

## Estrutura de Pastas

```
jcs-processos/mobile/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ChecklistItem.tsx
│   │   ├── SyncBadge.tsx
│   │   └── Loading.tsx
│   ├── screens/             # Telas do app
│   │   ├── LoginScreen.tsx
│   │   ├── TarefasScreen.tsx
│   │   ├── ChecklistScreen.tsx
│   │   └── PerfilScreen.tsx
│   ├── services/            # Comunicação com API
│   │   ├── api.ts
│   │   ├── AuthService.ts
│   │   └── TarefaService.ts
│   ├── database/            # Banco local SQLite
│   │   ├── schema.ts        # DDL das tabelas
│   │   ├── Database.ts      # Conexão
│   │   ├── TarefaRepository.ts
│   │   └── SyncRepository.ts
│   ├── hooks/               # Custom hooks
│   │   ├── useSync.ts
│   │   └── useNetInfo.ts
│   └── types/               # Tipagens TypeScript
│       └── index.ts
├── App.tsx                  # Entry point
└── app.json                 # Config Expo
```

## Schema SQLite Local

### tarefas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | ID da API |
| titulo | TEXT | Nome da tarefa |
| status | TEXT | pendente/concluida |
| data_programada | TEXT | ISO date |
| sincronizado | INTEGER | 0=pending, 1=synced |

### itens_checklist
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | ID do item modelo |
| tarefa_id | INTEGER | FK |
| descricao | TEXT | Texto do item |
| resposta | TEXT | sim/nao/nulo |
| observacao | TEXT | Comentário |
| sincronizado | INTEGER | Status sync |

### sync_queue
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | PK auto |
| tabela | TEXT | tarefa/item |
| acao | TEXT | insert/update |
| dados_json | TEXT | Payload |
| tentativas | INTEGER | Retry count |

## Fluxo de Uso

1. **Login**: Valida na API → salva token → busca tarefas
2. **Lista Tarefas**: Mostra do SQLite (funciona offline)
3. **Abrir Checklist**: Busca itens da API ou SQLite
4. **Marcar Item**: Salva no SQLite → adiciona na sync_queue
5. **Finalizar**: Marca tarefa concluída local
6. **Sincronização**: Quando online, envia fila para API

## Telas

### 1. Login
- Email e senha
- Botão entrar
- Indicador de loading

### 2. Minhas Tarefas
- Lista scrollable
- Card com: título, data, status (cor)
- Badge de "pendente sync" (se offline)
- Pull-to-refresh

### 3. Checklist
- Header com título da tarefa
- Lista de itens com checkbox
- Campo observação por item (opcional)
- Botão foto (opcional)
- Botão "Finalizar" no footer

### 4. Perfil
- Nome do usuário
- Botão sincronizar manual
- Botão logout

## Dependências a Instalar

```bash
# Core
npx create-expo-app mobile

# Navegação
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# Banco e Storage
npx expo install expo-sqlite
npx expo install @react-native-async-storage/async-storage

# API e Utilidades
npm install axios
npx expo install @react-native-community/netinfo
npx expo install expo-camera

# Icones
npx expo install @expo/vector-icons
```

## Configuração API

Criar arquivo `src/config/api.ts`:
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
// ou URL do servidor na nuvem

export default API_BASE_URL;
```

## Próximos Passos

1. Aprovar este plano
2. Iniciar setup do projeto Expo
3. Implementar camada de dados (SQLite)
4. Criar telas na ordem: Login → Tarefas → Checklist
5. Implementar sincronização
6. Testes e build

---
**Observação**: O app funcionará totalmente offline. Quando o colaborador marcar itens sem internet, os dados ficam na fila de sincronização e são enviados automaticamente quando a conexão voltar.
