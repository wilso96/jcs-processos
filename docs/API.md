# API JCS-Processos - Documentação

## Autenticação

### Login
```
POST /auth/login
Content-Type: application/json

{
  "id_empresa": 1,
  "login": "admin",
  "senha": "123456"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "login": "admin",
    "perfil": "admin",
    "id_empresa": 1
  }
}
```

---

## Usuários

### Listar
```
GET /usuarios
Authorization: Bearer <token>
```

### Criar
```
POST /usuarios
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Novo Usuário",
  "login": "novo.usuario",
  "email": "novo@email.com",
  "senha": "123456",
  "id_perfil": 3,
  "id_unidade": 1,
  "id_funcao": 3,
  "id_turno": 1
}
```

---

## Unidades

### Listar
```
GET /unidades
Authorization: Bearer <token>
```

### Criar
```
POST /unidades
Authorization: Bearer <token>

{
  "nome": "Nova Filial",
  "endereco": "Rua XYZ, 100"
}
```

### Atualizar
```
PUT /unidades/:id
Authorization: Bearer <token>

{
  "nome": "Nome Atualizado",
  "ativo": true
}
```

### Excluir
```
DELETE /unidades/:id
Authorization: Bearer <token> (admin)
```

---

## Funções

### Listar
```
GET /funcoes
Authorization: Bearer <token>
```

### Criar
```
POST /funcoes
Authorization: Bearer <token>

{
  "nome": "Coordenador",
  "descricao": "Coordena equipe",
  "nivel_hierarquico": 2
}
```

---

## Turnos

### Listar
```
GET /turnos
Authorization: Bearer <token>
```

### Criar
```
POST /turnos
Authorization: Bearer <token>

{
  "nome": "Escala",
  "hora_inicio": "08:00",
  "hora_fim": "17:00"
}
```

---

## Equipes

### Listar
```
GET /equipes
Authorization: Bearer <token>
```

### Criar
```
POST /equipes
Authorization: Bearer <token>

{
  "nome": "Nova Equipe",
  "descricao": "Descrição da equipe",
  "id_unidade": 1,
  "id_lider": 2
}
```

### Adicionar Membro
```
POST /equipes/:id/membros
Authorization: Bearer <token>

{
  "id_usuario": 5
}
```

### Listar Membros
```
GET /equipes/:id/membros
Authorization: Bearer <token>
```

---

## Áreas

### Listar
```
GET /areas
Authorization: Bearer <token>
```

### Criar
```
POST /areas
Authorization: Bearer <token>

{
  "nome": "Nova Área",
  "descricao": "Descrição da área"
}
```

---

## Processos

### Listar
```
GET /processos
Authorization: Bearer <token>

# Filtros (opcionais)
?status=ativo
?id_area=1
?id_unidade=1
```

### Criar
```
POST /processos
Authorization: Bearer <token>

{
  "nome": "Novo Processo",
  "descricao": "Descrição do processo",
  "id_modelo": 1,
  "id_area": 1,
  "id_unidade": 1,
  "responsavel_id": 2,
  "data_inicio": "2024-01-01",
  "data_fim": "2024-12-31"
}
```

---

## Tarefas

### Listar
```
GET /tarefas
Authorization: Bearer <token>

# Filtros
?status=pendente
?prioridade=alta
?id_responsavel=3
?id_equipe=1
?id_area=1
?data_de=2024-01-01
?data_ate=2024-01-31
```

**Nota:** Colaboradores só veem suas próprias tarefas.

### Criar
```
POST /tarefas
Authorization: Bearer <token>

{
  "titulo": "Verificar Equipamento X",
  "descricao": "Fazer verificação completa",
  "id_modelo": 1,
  "id_processo": 1,
  "id_responsavel": 3,
  "id_equipe": 1,
  "id_area": 1,
  "id_unidade": 1,
  "prioridade": "alta",
  "data_programada": "2024-01-15",
  "hora_programada": "08:00",
  "prazo_limite": "2024-01-15T12:00:00"
}
```

### Buscar por ID
```
GET /tarefas/:id
Authorization: Bearer <token>
```

### Atualizar
```
PUT /tarefas/:id
Authorization: Bearer <token>

{
  "status": "em_andamento",
  "observacao_geral": "Em execução"
}
```

### Executar Item
```
POST /tarefas/:id/itens
Authorization: Bearer <token>

{
  "id_item_modelo": 1,
  "resposta": "sim",
  "observacao": "Motor em bom estado",
  "foto_url": "https://..."
}
```

### Adicionar Comentário
```
POST /tarefas/:id/comentarios
Authorization: Bearer <token>

{
  "comentario": "Encontrado problema no item 3"
}
```

### Listar Comentários
```
GET /tarefas/:id/comentarios
Authorization: Bearer <token>
```

### Listar Histórico
```
GET /tarefas/:id/historico
Authorization: Bearer <token>
```

### Excluir
```
DELETE /tarefas/:id
Authorization: Bearer <token> (admin)
```

---

## Dashboard (Supervisor/Admin)

### Estatísticas Gerais
```
GET /dashboard/estatisticas
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "total_tarefas": 150,
  "tarefas_pendentes": 45,
  "tarefas_andamento": 20,
  "tarefas_concluidas": 80,
  "tarefas_atrasadas": 5,
  "tarefas_hoje": 12,
  "tarefas_amanha": 8,
  "total_usuarios": 25,
  "total_equipes": 4,
  "processos_ativos": 10
}
```

### Tarefas por Status
```
GET /dashboard/tarefas/status
Authorization: Bearer <token>
```

### Tarefas por Prioridade
```
GET /dashboard/tarefas/prioridade
Authorization: Bearer <token>
```

### Tarefas por Área
```
GET /dashboard/tarefas/areas
Authorization: Bearer <token>
```

### Tarefas por Responsável
```
GET /dashboard/tarefas/responsaveis
Authorization: Bearer <token>
```

### Tarefas Recentes
```
GET /dashboard/tarefas/recentes?limite=10
Authorization: Bearer <token>
```

### Tarefas Atrasadas
```
GET /dashboard/tarefas/atrasadas
Authorization: Bearer <token>
```

### Produtividade Diária
```
GET /dashboard/produtividade?dias=7
Authorization: Bearer <token>
```

---

## Perfis e Permissões

| Perfil | Permissões |
|--------|------------|
| admin | Acesso total ao sistema |
| supervisor | Criar/editar tarefas, ver dashboard, gerenciar equipes |
| colaborador | Ver e executar tarefas atribuídas |

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Erro de validação |
| 401 | Não autenticado |
| 403 | Acesso negado |
| 404 | Não encontrado |
| 500 | Erro interno |
