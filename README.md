# Sistema de Fechamento — CIA CAP

Sistema web para digitalizar o processo de fechamento de rotas da distribuidora CIA CAP, substituindo o uso de papel e calculadora por uma aplicação com CRUD completo e persistência de dados em banco SQLite.

---

## Sumário

- [Objetivo](#objetivo)
- [Ambiente de desenvolvimento](#ambiente-de-desenvolvimento)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Requisitos do sistema](#requisitos-do-sistema)
- [Instalação e execução](#instalação-e-execução)
- [Funcionalidades CRUD](#funcionalidades-crud)
- [Testes automatizados](#testes-automatizados)
- [Práticas de código limpo](#práticas-de-código-limpo)
- [Padrão de projeto aplicado](#padrão-de-projeto-aplicado)
- [Como contribuir](#como-contribuir)

---

## Objetivo

A distribuidora CIA CAP realizava todos os seus fechamentos de rotas manualmente, usando papel e calculadora para somar valores recebidos, calcular totais e controlar a quantidade de cartelas vendidas e devolvidas.

Este sistema substitui esse processo por uma aplicação web que permite registrar, consultar, editar e excluir fechamentos, com cálculo automático de valores, controle de despesas e indicação de sobra ou falta de dinheiro por rota.

---

## Ambiente de desenvolvimento

| Item | Especificação |
|---|---|
| Sistema operacional | Windows 10/11 ou Linux |
| Editor de código | Visual Studio Code |
| Terminal | PowerShell (Windows) ou Bash (Linux) |
| Versionamento | Git + GitHub |
| Gerenciador de pacotes | npm |
| Banco de dados | SQLite (arquivo local — sem servidor separado) |

---

## Tecnologias utilizadas

| Camada | Tecnologia | Versão |
|---|---|---|
| Front-end | HTML5 | — |
| Front-end | CSS3 | — |
| Front-end | JavaScript (Vanilla ES6+) | — |
| Back-end | Node.js | v18 ou superior |
| Back-end | Express.js | ^4.18 |
| Banco de dados | SQLite via sql.js | ^1.12 |
| Utilitário | cors | ^2.8 |

> `sql.js` é uma versão do SQLite compilada em WebAssembly puro, sem necessidade de compilação nativa. Escolhida por compatibilidade com qualquer versão do Node.js no Windows.

---

## Estrutura do projeto

```
cia-cap-fechamento/
├── backend/
│   ├── server.js           # Servidor Express: rotas CRUD e banco de dados
│   ├── server.test.js      # Testes automatizados das rotas
│   ├── fechamentos.db      # Banco SQLite (gerado automaticamente na 1ª execução)
│   └── package.json        # Dependências e scripts do projeto
├── frontend/
│   └── index.html          # Interface completa (HTML + CSS + JavaScript)
└── README.md
```

---

## Requisitos do sistema

- Node.js v18 ou superior
- npm v9 ou superior
- Navegador moderno: Chrome, Firefox ou Edge (atualizado)
- Conexão com internet apenas para carregar a fonte (Google Fonts) — opcional

---

## Instalação e execução

**1. Clone o repositório**

```bash
git clone https://github.com/seu-usuario/cia-cap-fechamento.git
cd cia-cap-fechamento
```

**2. Instale as dependências**

```bash
cd backend
npm install
```

**3. Inicie o servidor**

```bash
npm start
```

**4. Acesse a aplicação**

Abra o navegador em:

```
http://localhost:3000
```

> O servidor Express já serve o front-end automaticamente a partir da pasta `frontend/`. Não é necessário abrir o `index.html` separadamente.

> O arquivo `fechamentos.db` é criado automaticamente na primeira execução. Nenhuma configuração de banco de dados é necessária.

---

## Funcionalidades CRUD

| Operação | Método | Rota | Descrição |
|---|---|---|---|
| Create | POST | `/fechamentos` | Registra um novo fechamento |
| Read | GET | `/fechamentos` | Lista todos os fechamentos |
| Read | GET | `/fechamentos/:id` | Retorna um fechamento específico |
| Update | PUT | `/fechamentos/:id` | Edita um fechamento existente |
| Delete | DELETE | `/fechamentos/:id` | Remove um fechamento permanentemente |

**Campos persistidos por fechamento:**

- Nome da rota
- Valor unitário da cartela
- Quantidade de cartelas vendidas e devolvidas
- Valores recebidos por modalidade: Dinheiro, Pix, Depósito e Moedas
- Lista de despesas (descrição e valor)
- Total recebido, total de despesas, saldo final
- Valor a pagar (vendidas × valor da cartela)
- Diferença (saldo − valor a pagar): indica sobra ou falta
- Data e hora do registro

---

## Testes automatizados

O projeto inclui uma suíte de testes automatizados que cobre todas as operações do CRUD, validações e casos de erro.

**Como executar os testes:**

Com o servidor rodando (`npm start`), abra outro terminal e execute:

```bash
cd backend
node server.test.js
```

**O que é testado:**

| # | Teste | O que valida |
|---|---|---|
| 1 | POST válido | Status 201, retorno do id, nome e despesas |
| 2 | POST sem nome | Status 400 e mensagem de erro |
| 3 | GET todos | Status 200, retorno em array |
| 4 | GET por id | Status 200, dados corretos |
| 5 | GET id inexistente | Status 404 |
| 6 | PUT atualizar | Status 200, dados atualizados |
| 7 | PUT id inexistente | Status 404 |
| 8 | DELETE | Status 200, mensagem de confirmação |
| 9 | GET após DELETE | Status 404 (confirmação de exclusão) |
| 10 | DELETE id inexistente | Status 404 |

Os testes não dependem de nenhuma biblioteca externa — utilizam apenas o módulo nativo `http` do Node.js.

---

## Práticas de código limpo

As seguintes práticas foram aplicadas ao longo do desenvolvimento:

**Separação de responsabilidades**
Front-end e back-end estão em pastas distintas. O servidor cuida exclusivamente da persistência e das regras de negócio; a interface cuida exclusivamente da apresentação e da interação com o usuário.

**Funções pequenas e com propósito único**
Cada função realiza uma única tarefa: `calcular()` apenas recalcula os totais, `renderDespesas()` apenas renderiza a lista, `toast()` apenas exibe notificações. Nenhuma função acumula responsabilidades.

**Nomes descritivos**
Variáveis e funções têm nomes que deixam claro o que fazem: `valorAPagar`, `totalDesp`, `atualizarStatus`, `carregarHistorico`, `fecharModal`. Não há abreviações ambíguas.

**Validação no servidor**
Os dados são validados no back-end antes de qualquer operação no banco. O campo `nome_rota` é obrigatório e retorna HTTP 400 com mensagem clara em caso de falha.

**Respostas HTTP semânticas**
O servidor usa os códigos corretos: 201 para criação, 200 para sucesso, 400 para dados inválidos, 404 para recurso não encontrado.

**Feedback ao usuário**
Toda operação (salvar, editar, excluir, erro) exibe um feedback visual via toast com cor e mensagem adequadas.

**Sem repetição de lógica**
A função `atualizarStatus()` é compartilhada entre o formulário principal e o modal de edição, evitando duplicação de código.

**Eventos por addEventListener**
Todos os eventos de interface são registrados via `addEventListener`, evitando o uso de `onclick` inline no HTML, que é considerado má prática de segurança e manutenção.

---

## Padrão de projeto aplicado

**Repository Pattern (adaptado)**

O back-end centraliza toda a lógica de acesso ao banco de dados no arquivo `server.js`, em funções dedicadas como `rowsToObjects()` e `saveDB()`. Essas funções atuam como uma camada de abstração entre as rotas da API e o banco SQLite.

Com isso, se o banco de dados precisar ser trocado no futuro (por exemplo, de SQLite para PostgreSQL), apenas essas funções precisariam ser alteradas — as rotas e a lógica de negócio permaneceriam intactas.

Esse isolamento da camada de dados é o princípio central do Repository Pattern.

---

## Como contribuir

1. Faça um fork do repositório no GitHub
2. Crie uma branch para sua melhoria:
```bash
git checkout -b minha-melhoria
```
3. Faça as alterações e commit:
```bash
git commit -m "Descrição objetiva da melhoria"
```
4. Envie para o seu fork:
```bash
git push origin minha-melhoria
```
5. Abra um Pull Request descrevendo o que foi alterado e por quê

---

## Status do projeto

Versão 1.0 — funcional e pronto para uso em produção.
