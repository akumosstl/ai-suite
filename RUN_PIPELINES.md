# Guia Pratico: Criando e Executando Pipelines

Este tutorial cobre o fluxo completo de criacao, configuracao e execucao de pipelines no sistema Agentic.

---

## Sumario

1. [Visao Geral](#1-visao-geral)
2. [Prerequisitos](#2-prerequisitos)
3. [Criando um Projeto](#3-criando-um-projeto)
4. [Configurando o Project Target](#4-configurando-o-project-target)
5. [Criando uma Pipeline](#5-criando-uma-pipeline)
6. [Adicionando Steps a Pipeline](#6-adicionando-steps-a-pipeline)
7. [Configurando Steps - Modal Step Settings](#7-configurando-steps---modal-step-settings)
   - [Aba Input](#aba-input)
   - [Aba Output](#aba-output)
   - [Aba CLI](#aba-cli)
   - [Aba Engine](#aba-engine)
   - [Aba Prompt](#aba-prompt)
8. [Executando a Pipeline](#8-executando-a-pipeline)
9. [Acompanhando a Execucao em Tempo Real](#9-acompanhando-a-execucao-em-tempo-real)
10. [Historico de Execucoes](#10-historico-de-execucoes)
11. [Placeholders e Referencias Dinamicas](#11-placeholders-e-referencias-dinamicas)
12. [Configurando o AI Engine (API Keys)](#12-configurando-o-ai-engine-api-keys)
13. [Atalhos de Teclado Uteis](#13-atalhos-de-teclado-uteis)

---

## 1. Visao Geral

O sistema Agentic permite criar **pipelines sequenciais** compostas por **steps**. Cada step pode ser executado por:

- **Agentes** (via LLM nativo com langchain4j ou via CLI externo como opencode/copilot/claude)
- **Scripts** (executados localmente com runtime configuravel: cmd, node, java, py)

A execucao acontece em ordem sequencial: step 1 -> step 2 -> step 3 -> ... O output de cada step pode ser referenciado pelo proximo via placeholders.

**Fluxo resumido:**
```
Criar Projeto -> Configurar Target -> Criar Pipeline -> Adicionar Steps -> Configurar Steps -> Executar
```

---

## 2. Prerequisitos

- Backend rodando na porta **1488** (`mvn spring-boot:run` no diretorio `backend/`)
- Frontend rodando (`npm start` no diretorio `desktop-angular/`)
- API Keys configuradas (se for usar o engine langchain4j) - veja secao [12](#12-configurando-o-ai-engine-api-keys)

---

## 3. Criando um Projeto

1. Na tela inicial, clique em **New Project** (ou use o menu)
2. Preencha os campos:
   - **Project Name** (obrigatorio): nome do projeto
   - **Description**: descricao opcional
   - **Project Location**: caminho absoluto no sistema de arquivos (ex: `C:\Projects\MyApp`). Este e o diretorio de trabalho onde os steps serao executados.
   - **Target**: selecione um target existente (veja secao 4)
3. Clique **Create Project** (ou `Ctrl+Enter`)

Voce sera redirecionado para a tela do projeto.

---

## 4. Configurando o Project Target

### O que e um Target?

Um **Target** e uma configuracao que define:
- O **CLI padrao** que sera usado pelos steps de agente (quando nao houver CLI explicito no step)
- O caminho base para **agents** no sistema de arquivos (`agentsPath`)

### Para que serve?

O target do projeto atua como **fallback global** para a execucao dos steps. Quando um step de agente nao tem um CLI explicitamente configurado, o sistema busca o CLI do target associado ao projeto.

**Exemplo:** Se o target do projeto tem CLI = `opencode`, todos os steps de agente que nao tiverem CLI proprio usarao o `opencode` como ferramenta de execucao.

### Como configurar

#### Opcao A: Ao criar o projeto
No dialogo **New Project**, o campo **Target** ja aparece com a lista de targets disponiveis. O primeiro target e selecionado automaticamente.

#### Opcao B: Editando o projeto existente
1. Na tela do projeto, clique no botao **Edit** (icone de lapis) no cabecalho "Project Information"
2. No campo **Target**, selecione um target na lista dropdown
3. Clique **Save** (icone de disquete)

### Criando e gerenciando Targets

Acesse **Settings** (menu lateral) -> **Target**:

1. **Lista de Targets**: mostra todos os targets com nome e agents path
2. **Criar Target**: clique no botao **+** e preencha:
   - **Name**: nome do target (ex: `opencode`, `copilot`, `claude`)
   - **Agents Path**: caminho relativo para os agentes (ex: `.opencode\agents`)
3. **Editar Target**: clique na linha do target para editar
4. **Deletar Target**: clique no icone de lixeira

> **Target padrao**: Se nao houver nenhum target, o sistema cria automaticamente um target `opencode` com `agentsPath: .opencode\agents`.

### Resolucao do CLI em runtime

Quando um step de agente e executado, o sistema resolve o CLI nesta ordem:

1. **CLI do step** (configurado na aba CLI do Step Settings) - se estiver preenchido
2. **CLI do target do projeto** (via `targetId` ou campo `target`) - se o step nao tiver CLI
3. **Fallback**: `opencode` (se nenhum dos anteriores existir)

---

## 5. Criando uma Pipeline

1. Na tela do projeto, clique no botao **+** no painel "Pipelines" (lado esquerdo)
2. Preencha o formulario:
   - **Pipeline Name** (obrigatorio): nome da pipeline
   - **Description**: descricao opcional
   - **Output Extension**: formato do output (json, yml, text)
3. Clique **Save Pipeline**

A pipeline aparecera na lista do painel esquerdo. Clique nela para seleciona-la.

---

## 6. Adicionando Steps a Pipeline

1. Com a pipeline selecionada, clique em **Add Step** (botao com icone `+` e texto "Add Step")
2. O dialogo **Add Step to Pipeline** abre com duas abas:
   - **Agents**: lista paginada de agentes disponiveis. Use a busca para filtrar.
   - **Scripts**: lista paginada de scripts disponiveis. Use a busca para filtrar.
3. Selecione um ou mais items usando os checkboxes
4. Clique **Add** para adicionar os steps

Os steps aparecem na secao "Pipeline Steps" em ordem. Voce pode **reordenar** arrastando (drag-and-drop).

### Tipos de Step

| Tipo | Descricao | Motor de execucao |
|------|-----------|-------------------|
| **Agent** | Executa o prompt de um agente | langchain4j (padrao) ou CLI |
| **Script** | Executa um script local | Runtime configurado (cmd, node, java, py) |

---

## 7. Configurando Steps - Modal Step Settings

Cada step tem um botao de **settings** (icone de engrenagem). Ao clicar, abre o modal **Step Settings** com 4 ou 5 abas (a aba Engine aparece apenas para steps de agente).

### Aba Input

Configura o conteudo de entrada que sera injetado no prompt do step via placeholder `{{agentic-input:file}}`.

| Campo | Descricao |
|-------|-----------|
| **File Type** | Tipo/formato do conteudo: YML, JSON, CMD, TXT |
| **Input Content** | Texto do conteudo de entrada (editor com tab support) |

**Como funciona:** O conteudo digitado aqui substitui o placeholder `{{agentic-input:file}}` no prompt do agente. Por exemplo, se o prompt do agente for:

```
Analise os dados: {{agentic-input:file}}
```

E o Input Content for:
```json
{"nome": "Joao", "idade": 30}
```

O prompt final sera: `Analise os dados: {"nome": "Joao", "idade": 30}`

> **Tab no editor:** A tecla Tab insere 2 espacos ao inves de mudar de campo.

---

### Aba Output

Configura o template de saida esperado que sera injetado no prompt via placeholder `{{agentic-output:file}}`.

| Campo | Descricao |
|-------|-----------|
| **File Type** | Tipo/formato do template: YML, JSON, CMD, TXT |
| **Output Content** | Template/estrutura de saida desejada |

**Como funciona:** O conteudo aqui substitui o placeholder `{{agentic-output:file}}` no prompt. Use para definir o formato de saida esperado. Por exemplo:

```json
{
  "resumo": "",
  "pontos_chave": [],
  "recomendacoes": []
}
```

Se o prompt do agente for `Gere o relatorio no formato: {{agentic-output:file}}`, o agente recebera o template como guia de formatacao.

---

### Aba CLI

Configura como o step sera executado externamente. O conteudo varia entre steps de **agente** e **script**.

#### Para Steps de Agente

| Campo | Descricao |
|-------|-----------|
| **CLI** | Ferramenta CLI que executara o prompt. Opcoes: valores dos targets cadastrados, `opencode`, `copilot`, ou `Custom...` |
| **Custom CLI** | Aparece ao selecionar "Custom..." - digite o nome do CLI (ex: `claude`) |
| **Parameters** | Parametros extras passados ao CLI |
| **Arguments** | Argumentos extras passados ao CLI |

**Comportamento por CLI:**
- **`opencode`**: Executa `opencode run [parameters] [arguments] "<prompt>"`
- **`copilot`**: Executa `copilot --allow-all-paths --allow-all-tools -p "<prompt>"`
- **`claude`**: Executa `claude -p "<prompt>"`
- **Custom**: Executa `<cli> [parameters] [arguments] "<prompt>"`

> **Importante:** Ao selecionar um CLI (exceto "Custom..."), o Engine sera automaticamente alterado para `CLI (External Tool)`.

#### Para Steps de Script

| Campo | Descricao |
|-------|-----------|
| **Runtime** | Runtime para executar o script: `cmd`, `node`, `java`, `py`, ou `Custom...` |
| **Custom CLI** | Aparece ao selecionar "Custom..." - digite o comando runtime |
| **Parameters** | Parametros passados ao runtime |
| **Arguments** | Argumentos passados ao script |

**Comportamento por Runtime:**
- **`cmd`**: `cmd /c <script_content>` (no Windows) ou `bash -c <script_content>` (no Linux)
- **`node`**: `node <script_content>`
- **`java`**: `java <script_content>`
- **`py`**: `py <script_content>`
- **Custom**: `<runtime> [parameters] [arguments] <script_content>`

> **Nota:** Para steps de script, o conteudo do script (campo `content` da entidade Script) e executado diretamente como comando.

---

### Aba Engine

> **Apenas para steps de Agente** (nao aparece para steps de Script)

Configura o motor de execucao do step. Esta e a escolha mais importante: determina se o agente roda via **LLM nativo** (API direta) ou via **CLI externo**.

| Campo | Descricao |
|-------|-----------|
| **Engine** | `langchain4j (Native LLM)` ou `CLI (External Tool)` |
| **LLM Provider** | (Apenas se engine = langchain4j) Provedor: OpenAI, Google Gemini, Anthropic |
| **Model** | (Apenas se engine = langchain4j) Nome do modelo. Vazio = usa o default do provedor |

**Modelos default por provedor:**
| Provedor | Modelo Default |
|----------|---------------|
| OpenAI | gpt-4o-mini |
| Google Gemini | gemini-2.0-flash |
| Anthropic | claude-3-5-haiku-20241022 |

**Logica de resolucao do Engine em runtime:**

```
1. Se o step tem campo "engine" preenchido -> usa esse engine
2. Senao, se o step tem campo "cli" preenchido -> usa engine CLI
3. Senao -> usa engine langchain4j (padrao)
```

**langchain4j (Native LLM):**
- Chama a API do provedor diretamente via biblioteca langchain4j
- Suporta streaming de resposta em tempo real via SSE
- Retry automatico (ate 3 tentativas) em erros transientes (timeout, rate limit, 429, 503...)
- API keys configuradas em **Settings > AI Engine**
- Timeout de 5 minutos por step

**CLI (External Tool):**
- Executa o comando CLI no sistema operacional
- O prompt do agente e passado como argumento
- O output do processo e capturado e transmitido via SSE
- Working directory = `project.path`

> **Dica:** Se voce quer usar um agente com API direta (mais rapido, sem necessidade de CLI instalado), escolha `langchain4j`. Se voce quer usar uma ferramenta CLI ja instalada (opencode, copilot, claude), escolha `CLI`.

---

### Aba Prompt

Exibe o **prompt do agente** ou o **conteudo do script** associado ao step (somente leitura informativa).

| Campo | Descricao |
|-------|-----------|
| **Type** | Mostra se e `Agent` ou `Script` (nao editavel) |
| **Prompt Content** | Conteudo do prompt do agente ou do script |

> **Importante:** O prompt exibido aqui e o conteudo original do agente/script. Em runtime, o sistema aplica as substituicoes de placeholders (veja secao [11](#11-placeholders-e-referencias-dinamicas)). Para editar o prompt do agente, va na tela de Agents.

---

### Salvando as configuracoes

Ao clicar **Save All** (ou `Ctrl+Enter`), todas as abas sao salvas sequencialmente:
1. Input (conteudo + tipo)
2. Output (conteudo + tipo)
3. CLI (cli, parameters, arguments, runtime)
4. Engine (engine, llmProvider, llmModel) - apenas para steps de agente

---

## 8. Executando a Pipeline

### Via Interface Web

1. Na tela do projeto, com a pipeline selecionada, clique no botao **Run** (icone de play)
2. Uma nova janela/aba do navegador abre com a tela de execucao da pipeline
3. A execucao inicia automaticamente

### Via API REST

```bash
# Iniciar execucao
curl -X POST http://localhost:1488/api/pipelines/{pipelineId}/runs

# Verificar status
curl http://localhost:1488/api/pipelines/{pipelineId}/runs?page=0&size=20

# Parar execucao
curl -X POST http://localhost:1488/api/projects/{projectId}/pipelines/{pipelineId}/stop
```

### O que acontece ao executar

1. O sistema cria um **PipelineRun** (snapshot de todos os steps no momento da execucao)
2. Cada step e executado sequencialmente na ordem configurada
3. O resultado de cada step e salvo em arquivo no diretorio de run: `~/.agentic/pipelines/<pipeline-name>/<timestamp>/stepN-result.<extension>`
4. Updates em tempo real sao enviados via SSE

---

## 9. Acompanhando a Execucao em Tempo Real

A tela de execucao (`/runpipelines`) mostra:

### Painel Esquerdo - Lista de Steps
- Cada step com status visual: pending (numero), running (spinner), completed (check verde), failed (X vermelho)

### Painel Central - Pipeline Flow
- Visualizacao horizontal dos steps com conectores de seta
- Cores por status: verde (completed), laranja (running), cinza (pending), vermelho (failed)

### Painel Direito - Step Details
Ao clicar em um step:
- **Input**: visualiza o conteudo de entrada do step
- **Output**: visualiza o conteudo de saida do step
- **Console Output**: visualizacao completa do output em dialogo expandivel
- **Copy**: copia o output para clipboard

### SSE (Server-Sent Events)

A tela conecta automaticamente ao endpoint SSE:
```
GET http://localhost:1488/api/pipeline-runs/{runId}/stream
```

Eventos recebidos:
- `connected`: conexao estabelecida
- `step-output`: output parcial de um step (streaming em tempo real)
- `step-error`: erro em um step
- `pipeline-complete`: pipeline finalizada

> **Fallback:** Se o SSE falhar, o sistema ativa polling automatico a cada 3 segundos.

### Parar a Execucao

Clique no botao **Stop** na barra superior. O step atual sera interrompido e os subsequentes nao executarao.

---

## 10. Historico de Execucoes

Acesse a tela **Pipeline Executions** (pelo menu ou pelo botao de historico na tela do projeto):

- **Painel esquerdo**: lista paginada de todas as execucoes, com busca por nome de projeto
- **Painel direito**: visualizacao da execucao selecionada, com Pipeline Flow e step details
- **Output**: visualiza o output do step
- **File Output**: visualiza o conteudo do arquivo de resultado gerado em disco
- **Cleanup**: botao para limpar historico (mantem execucoes em andamento)

> **Diretorio de run**: Mostra o caminho no filesystem onde os arquivos da execucao foram salvos (ex: `C:\Users\USER\.agentic\pipelines\minha-pipeline\2026-05-13T10-30-00\`)

---

## 11. Placeholders e Referencias Dinamicas

No prompt dos agentes e nos campos de Input/Output, voce pode usar placeholders que sao resolvidos em runtime:

| Placeholder | Descricao | Exemplo |
|-------------|-----------|---------|
| `{{step:N:output}}` | Output do step N (1-indexed) | `{{step:1:output}}` |
| `{{previous-output-file}}` | Caminho do arquivo de resultado do step anterior | `C:\...\.agentic\...\step1-result.json` |
| `{{agentic-input:file}}` | Conteudo do campo Input do step atual | Substituido pelo conteudo da aba Input |
| `{{agentic-output:file}}` | Conteudo do campo Output do step atual | Substituido pelo conteudo da aba Output |
| `{{file:path}}` | Conteudo de um arquivo no filesystem | `{{file:C:\data\config.json}}` |
| `{{env:VAR}}` | Valor de variavel de ambiente | `{{env:JAVA_HOME}}` |

**Ordem de resolucao:**
1. `{{step:N:output}}` - referencias a outros steps
2. `{{file:path}}` - leitura de arquivos
3. `{{env:VAR}}` - variaveis de ambiente
4. `{{previous-output-file}}` - caminho do arquivo anterior
5. `{{agentic-input:file}}` - input do step atual
6. `{{agentic-output:file}}` - output template do step atual

> **Atencao:** Referencias a steps futuros (ex: `{{step:5:output}}` no step 2) nao serao resolvidas e aparecerão como texto literal.

---

## 12. Configurando o AI Engine (API Keys)

Para usar o engine **langchain4j**, configure as API keys em **Settings > AI Engine**:

### Provedores suportados

| Provedor | Chave de Config | Modelo Default | Base URL |
|----------|----------------|----------------|----------|
| OpenAI | `openai.api.key` | gpt-4o-mini | Suporta (ex: endpoint NVIDIA) |
| Google Gemini | `google.api.key` | gemini-2.0-flash | Nao |
| Anthropic | `anthropic.api.key` | claude-3-5-haiku-20241022 | Nao |

### Como configurar

1. Acesse **Settings** > **AI Engine**
2. Na tabela de provedores, preencha:
   - **API Key**: cole sua chave de API
   - **Base URL**: (apenas OpenAI) URL alternativa se usar endpoint compativel
   - **Default Model**: modelo a ser usado por padrao (pode ser vazio para usar o default)
3. Clique no botao **Save** (disquete) na linha do provedor
4. Opcionalmente, clique no botao **Test** (wifi) para verificar a conexao

### Default Provider

No topo da secao AI Engine, ha um seletor **Default Provider**. Este define qual provedor e usado quando um step nao especifica um provedor explicitamente.

> **Seguranca:** As API keys sao armazenadas no banco H2 local e mascaradas (`****`) nas respostas da API. Nunca sao expostas em texto limpo nos endpoints GET.

---

## 13. Atalhos de Teclado Uteis

| Atalho | Acao |
|--------|------|
| `Ctrl+Shift+R` | Executar pipeline |
| `Ctrl+Enter` | Salvar/confirmar em qualquer dialogo |
| `Ctrl+Shift+P` | Voltar da tela de pipelines |
| `Ctrl+Shift+U` | Atualizar historico de execucoes |
| `Ctrl+Shift+Q` | Abrir dialogo de atalhos |

---

## Fluxo Completo - Exemplo Passo a Passo

### Cenario: Pipeline de analise de codigo

1. **Configure API Keys**: Settings > AI Engine > Cole sua OpenAI API Key > Save
2. **Crie um Target**: Settings > Target > + > Nome: `opencode`, Agents Path: `.opencode\agents` > Create
3. **Crie um Projeto**: New Project > Nome: "Code Reviewer" > Path: `C:\Projects\my-app` > Target: `opencode` > Create
4. **Crie uma Pipeline**: No projeto > + no painel Pipelines > Nome: "review-pipeline" > Output Extension: `json` > Save
5. **Adicione Steps**:
   - Add Step > Aba Agents > Selecione "Code Analyzer" > Add
   - Add Step > Aba Agents > Selecione "Report Generator" > Add
6. **Configure o Step 1** (Code Analyzer):
   - Settings > Aba Input > File Type: TXT > Content: `Revise o arquivo src/main.py`
   - Settings > Aba Engine > Engine: langchain4j > Provider: OpenAI > Model: gpt-4o-mini
   - Save All
7. **Configure o Step 2** (Report Generator):
   - Settings > Aba Input > File Type: JSON > Content: `{"formato": "markdown"}`
   - Settings > Aba Engine > Engine: langchain4j > Provider: Google Gemini
   - Save All
8. **Execute**: Clique Run > A janela de execucao abre > Acompanhe o progresso em tempo real
9. **Veja os resultados**: Pipeline Executions > Selecione a run > Clique em Output ou File Output

---

## Arquitetura de Execucao - Referencia Tecnica

```
Usuario clica "Run"
       |
       v
POST /api/pipelines/{id}/runs
       |
       v
PipelineRun criado (snapshot dos steps)
       |
       v
Thread separada executa steps sequencialmente
       |
       +-- Step tipo "script"? --> Executa via ProcessBuilder (runtime configurado)
       |
       +-- Step tipo "agent"?
             |
             +-- Engine = "langchain"? --> LangchainEngineService.executeStreaming()
             |                                   |
             |                                   +-- Cria StreamingChatModel (OpenAI/Google/Anthropic)
             |                                   +-- Envia prompt via API
             |                                   +-- Streaming SSE para o frontend
             |                                   +-- Retry automatico em erros transientes
             |
             +-- Engine = "cli"? --> ProcessBuilder com CLI do step ou do target do projeto
                                       |
                                       +-- opencode: "opencode run [params] [args] \"<prompt>\""
                                       +-- copilot: "copilot --allow-all-paths --allow-all-tools -p \"<prompt>\""
                                       +-- claude: "claude -p \"<prompt>\""
                                       +-- custom: "<cli> [params] [args] \"<prompt>\""
```
