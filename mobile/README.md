# JCS Colaborador - App Mobile

Aplicativo mobile para colaboradores marcarem checklists de tarefas. Funciona **online e offline**.

## Características

- ✅ Login com email e senha
- ✅ Lista de tarefas atribuídas ao colaborador
- ✅ Execução de checklists com items Sim/Não
- ✅ Campo de observação por item
- ✅ Funciona offline (dados salvos localmente)
- ✅ Sincronização automática quando online
- ✅ Indicador de status de conexão
- ✅ Interface mobile-friendly

## Tecnologias

- **React Native** + **Expo** (iOS e Android)
- **SQLite** (persistência offline)
- **Axios** (comunicação com API)
- **TypeScript**

## Instalação

### 1. Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Para emulador Android: Android Studio
- Para emulador iOS: Xcode (macOS)

### 2. Instalar dependências

```bash
cd jcs-processos/mobile
npm install
```

### 3. Configurar URL da API

Edite o arquivo `src/config/api.ts` e altere a URL do backend:

```typescript
// Para desenvolvimento (emulador Android)
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Para dispositivo físico (substitua pelo IP da sua máquina)
export const API_BASE_URL = 'http://192.168.1.100:3000/api';

// Para produção
export const API_BASE_URL = 'https://api.suaempresa.com/api';
```

### 4. Rodar o projeto

```bash
# Development
npm start

# Android (emulador)
npm run android

# iOS (macOS)
npm run ios
```

### 5. Gerar APK para distribuição

```bash
# Pré-requisito: criar conta no expo.io
expo login

# Build Android
expo build:android --release

# Build iOS (requer Xcode)
expo build:ios --release
```

## Estrutura do Projeto

```
mobile/
├── App.tsx                    # Entry point
├── src/
│   ├── config/
│   │   └── api.ts            # Configuração da API
│   ├── database/
│   │   ├── Database.ts       # Conexão SQLite
│   │   ├── schema.ts         # DDL das tabelas
│   │   ├── TarefaRepository.ts
│   │   └── SyncRepository.ts
│   ├── screens/
│   │   ├── LoginScreen.tsx   # Tela de login
│   │   ├── TarefasScreen.tsx # Lista de tarefas
│   │   ├── ChecklistScreen.tsx # Execução do checklist
│   │   └── PerfilScreen.tsx  # Perfil e configurações
│   ├── services/
│   │   ├── api.ts           # Cliente Axios
│   │   ├── AuthService.ts   # Autenticação
│   │   ├── TarefaService.ts # Tarefas/Itens
│   │   └── SyncService.ts   # Sincronização
│   └── types/
│       └── index.ts         # Tipagens TypeScript
```

## Funcionamento Offline

O app funciona completamente offline:

1. **Ao fazer login**: Baixa todas as tarefas e salva no SQLite local
2. **Ao marcar um item**: Salva no SQLite e adiciona na fila de sincronização
3. **Quando volta a ficar online**: Sincroniza automaticamente
4. **Indicador visual**: Badge "pendente" nas tarefas não sincronizadas

## API Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /auth/login | Autenticação |
| GET | /tarefas | Lista tarefas do colaborador |
| GET | /tarefas/:id | Detalhes da tarefa |
| GET | /tarefas/:id/itens | Itens do checklist |
| POST | /tarefas/:id/itens | Executar item |
| PUT | /tarefas/:id | Atualizar status |

## Permissões Android

O app solicita as seguintes permissões:
- `INTERNET` - Conexão com servidor
- `ACCESS_NETWORK_STATE` - Detectar online/offline
- `CAMERA` - Tirar fotos (futuro)

## Configuração do Backend

O backend precisa ter CORS configurado para aceitar requisições do app. No `backend/src/app.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: '*', // Ou especifique a origem do app
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
