# =============================================================================
# RECIPE TEMPLATE - Agentic Pipeline Execution System
# =============================================================================
# Um recipe é um arquivo YAML declarativo que pode:
# - Criar projetos, agentes, scripts, targets, templates
# - Criar pipelines e adicionar steps
# - Executar pipelines (existentes ou recém-criadas)
# - Parar pipelines
# - Declarar dependências entre tarefas
# - Repetir pipelines N vezes ou em loop
# - Parametrizar valores com {{param}} syntax
# =============================================================================

recipe:
  name: "nome-do-recipe"                    # Obrigatório. Nome identificador
  version: "1.0"                            # Opcional. Versão do recipe
  description: "Descrição do que este recipe faz"  # Opcional
  
  # ------------------------------------------------------------------
  # PARÂMETROS: Valores parametrizados reutilizáveis com {{param}}
  # Podem ser sobrescritos na execução via MCP tool ou REST API
  # ------------------------------------------------------------------
  parameters:
    project_name: "meu-projeto"
    agent_prompt: "Analise o código e sugira melhorias"
    script_content: "echo hello"
    namespace: "default"
    repeat_count: 1
    retry_max: 0
    retry_delay_seconds: 5
    output_extension: "json"

  # ------------------------------------------------------------------
  # VARIÁVEIS DE AMBIENTE: Injetadas no contexto de execução
  # ------------------------------------------------------------------
  env:
    MY_VAR: "valor"
    ANOTHER: "{{param:namespace}}"

  # ------------------------------------------------------------------
  # TARGETS: Configurações de target (CLI, paths)
  # ------------------------------------------------------------------
  targets:
    - name: "meu-target"                     # Obrigatório. Nome único
      agents_path: "/path/to/agents"         # Opcional
      scripts_path: "/path/to/scripts"       # Opcional
      cli: "opencode"                        # Opcional (opencode|copilot|claude|custom)

  # ------------------------------------------------------------------
  # PROJECTS: Criação de projetos
  # ------------------------------------------------------------------
  projects:
    - id: "proj1"                            # Obrigatório. ID interno para referência
      name: "{{param:project_name}}"         # Obrigatório. Nome do projeto
      description: "Descrição do projeto"    # Opcional
      path: "/caminho/do/projeto"            # Opcional. Path do projeto
      target: "meu-target"                   # Opcional. Nome do target (resolve ID)
      status: "active"                       # Opcional (default: active)
      readme: "# Meu Projeto"                # Opcional. Conteúdo do README
      agents:                                # Opcional. Lista de IDs de agentes para associar
        - "agent1"
        - "agent2"
      scripts:                               # Opcional. Lista de IDs de scripts para associar
        - "script1"

  # ------------------------------------------------------------------
  # AGENTS: Criação de agentes
  # ------------------------------------------------------------------
  agents:
    - id: "agent1"                           # Obrigatório. ID interno para referência
      name: "code-reviewer"                  # Obrigatório. Nome do agente
      namespace: "{{param:namespace}}"       # Opcional (default: "")
      category: "review"                     # Opcional
      description: "Agente de review"        # Opcional
      prompt: "{{param:agent_prompt}}"       # Opcional. Prompt do agente
      path: "/path/to/agent.md"              # Opcional. Path do arquivo

  # ------------------------------------------------------------------
  # SCRIPTS: Criação de scripts
  # ------------------------------------------------------------------
  scripts:
    - id: "script1"                          # Obrigatório. ID interno para referência
      name: "hello-script"                   # Obrigatório. Nome do script
      namespace: "{{param:namespace}}"       # Opcional (default: "")
      category: "utility"                    # Opcional
      description: "Script de exemplo"       # Opcional
      content: "{{param:script_content}}"    # Opcional. Conteúdo do script
      scope: "global"                        # Opcional (global|project, default: global)
      path: "/path/to/script.sh"             # Opcional. Path do arquivo

  # ------------------------------------------------------------------
  # TEMPLATES: Criação de templates
  # ------------------------------------------------------------------
  templates:
    - id: "tpl1"                             # Obrigatório. ID interno para referência
      name: "review-template"                # Obrigatório
      type: "agents"                         # Obrigatório (agents|skills|commands|scripts)
      description: "Template para review"    # Opcional
      template: "Você é um revisor..."       # Opcional. Conteúdo do template

  # ------------------------------------------------------------------
  # PIPELINES: Criação de pipelines com steps
  # ------------------------------------------------------------------
  pipelines:
    - id: "pipe1"                            # Obrigatório. ID interno para referência
      project: "proj1"                       # Obrigatório. Ref para ID de projeto (acima)
      name: "pipeline-review"                # Obrigatório. Nome da pipeline
      description: "Pipeline de review"      # Opcional
      type: "sequential"                     # Opcional (sequential|step_by_step)
      output_extension: "{{param:output_extension}}"  # Opcional
      steps:
        - order: 1                           # Obrigatório. Ordem do step
          agent: "agent1"                    # Opcional. Ref para ID de agente (OU script)
          script: "script1"                  # Opcional. Ref para ID de script (OU agent)
          prompt: "Prompt override para este step"  # Opcional. SOBRESCREVE o prompt do agente/script
          type: "agent"                      # Opcional (agent|script). Inferring automático se omitido
          runtime: "cmd"                     # Opcional (cmd|node|java|py|custom). Só para script steps
          cli: "opencode"                    # Opcional. CLI override para este step
          parameters: "--model gpt4"         # Opcional. Parâmetros CLI
          arguments: "--verbose"             # Opcional. Argumentos CLI
          input:                             # Opcional. Input do step
            content: "{{step:0:output}}"     # Suporta: {{step:N:output}}, {{file:path}}, {{env:VAR}}, {{param:X}}
            type: "text"                     # Tipo do content
          output:                            # Opcional. Output esperado do step
            content: ""
            type: "text"

  # ------------------------------------------------------------------
  # TASKS: Ações a executar (criar E/OU rodar pipelines, etc)
  # Cada task tem um ID para referência em depends_on
  # ------------------------------------------------------------------
  tasks:
    # === TIPO: create ===
    # Cria um recurso sem rodá-lo
    - id: "create_project"
      type: "create"                         # Obrigatório (create|run|stop|call)
      resource: "project"                    # Obrigatório (project|agent|script|pipeline|target|template)
      ref: "proj1"                           # Opcional. Ref para ID declarado acima (para associar)
      # Se resource=project, usa dados de projects[id=proj1]
      # Se resource=agent, usa dados de agents[id=ref]
      # etc.

    - id: "create_agents"
      type: "create"
      resource: "agent"
      ref: "agent1"                          # Cria o agente agent1

    - id: "create_scripts"
      type: "create"
      resource: "script"
      ref: "script1"

    - id: "create_pipeline"
      type: "create"
      resource: "pipeline"
      ref: "pipe1"                           # Cria a pipeline pipe1 com todos os steps

    # === TIPO: run ===
    # Roda uma pipeline (existente no sistema OU criada neste recipe)
    - id: "run_pipeline"
      type: "run"
      depends_on:                            # Opcional. Lista de task IDs que devem completar com sucesso
        - "create_pipeline"
      pipeline_ref: "pipe1"                  # Opção 1: Ref para pipeline declarado acima
      # OU referência por nome/projeto:
      # project: "proj1"                     # Opção 2: Pipeline existente por nome
      # pipeline_name: "pipeline-review"
      # OU referência por ID do banco:
      # pipeline_id: 42                      # Opção 3: Pipeline existente por ID
      repeat: "{{param:repeat_count}}"       # Opcional. Repetir N vezes (default: 1)
      retry:                                 # Opcional. Configuração de retry
        max_attempts: "{{param:retry_max}}"  # Número máximo de tentativas (default: 0 = sem retry)
        delay_seconds: "{{param:retry_delay_seconds}}"  # Delay entre tentativas
        on_status:                           # Em quais status deve retentar
          - "failed"
      wait: true                             # Opcional. Aguardar conclusão antes de prosseguir (default: false)
      stop_on_failure: true                  # Opcional. Parar recipe se pipeline falhar (default: true)

    # === TIPO: stop ===
    # Para uma pipeline em execução
    - id: "stop_pipeline"
      type: "stop"
      pipeline_ref: "pipe1"                  # Ref para pipeline declarada
      # OU: pipeline_id: 42

    # === TIPO: call ===
    # Chama uma pipeline existente no sistema (sem criá-la)
    - id: "call_existing"
      type: "call"
      depends_on:
        - "run_pipeline"
      project: "proj1"                       # Ref para projeto declarado OU nome
      pipeline_name: "pipeline-review"       # Nome da pipeline existente
      repeat: 3                              # Repetir 3 vezes
      wait: true
      stop_on_failure: false

    # === TIPO: loop ===
    # Executa em loop infinito até condição de parada
    - id: "loop_pipeline"
      type: "run"
      pipeline_ref: "pipe1"
      loop:                                  # Opcional. Loop infinito com condição
        condition: "always"                  # always|until_success|until_failure|custom
        max_iterations: 10                   # Opcional. Limite de iterações
        delay_seconds: 30                    # Opcional. Delay entre iterações
      wait: true