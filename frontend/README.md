# JCS-Processos - Frontend

Frontend básico em HTML/CSS/JavaScript para o sistema JCS-Processos.

## Estrutura de Pastas

```
frontend/
├── index.html          # Tela de Login
├── dashboard.html      # Dashboard com estatísticas
├── usuarios.html       # Lista de usuários
├── tarefas.html        # Lista de tarefas
├── processos.html      # Processos (em desenvolvimento)
├── equipes.html        # Equipes (em desenvolvimento)
├── areas.html          # Áreas (em desenvolvimento)
├── unidades.html       # Unidades (em desenvolvimento)
├── css/
│   └── styles.css      # Estilos globais
├── js/
│   ├── api.js          # Módulo de integração com API
│   ├── auth.js         # Módulo de autenticação
│   ├── dashboard.js    # Lógica do Dashboard
│   ├── usuarios.js     # Lógica de Usuários
│   └── tarefas.js      # Lógica de Tarefas
└── README.md           # Este arquivo
```

## Como Executar

1. Certifique-se de que o backend está rodando em `http://localhost:3000`

2. Abra o arquivo `index.html` no navegador ou use um servidor HTTP:

   ```bash
   # Usando Python
   cd frontend
   python -m http.server 8080

   # Usando Node.js
   npx serve .
   ```

3. Acesse `http://localhost:8080` no navegador

## Rotas da API Utilizadas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login de usuário |
| GET | `/dashboard/estatisticas` | Estatísticas do dashboard |
| GET | `/usuarios` | Lista de usuários |
| GET | `/tarefas` | Lista de tarefas |

## Credenciais Padrão

O sistema é pré-carregado com usuários de teste. Verifique o arquivo `seed.js` no backend para as credenciais.

## Funcionalidades Implementadas

- ✅ Tela de Login com validação
- ✅ Dashboard com estatísticas (usuários, tarefas, processos)
- ✅ Lista de usuários com busca
- ✅ Lista de tarefas com status
- ✅ Menu de navegação lateral
- ✅ Sistema de autenticação via JWT
- ✅ Proteção de páginas (redirect se não autenticado)
- ✅ Notificações toast
- ✅ Design responsivo

## Próximos Passos

- Implementar CRUD completo de usuários
- Implementar CRUD completo de tarefas
- Implementar páginas de processos, equipes, áreas e unidades
- Adicionar gráficos ao dashboard
- Implementar filtros e ordenação nas tabelas
- Adicionar paginação
- Implementar modais para edição
