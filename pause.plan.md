# Plano de Implementação: Pausa de Pipeline via Agent

## Objetivo
Adicionar funcionalidade para que o agent possa pausar uma pipeline através de um endpoint REST, permitindo que o usuário continue a execução posteriormente a partir do próximo step.

## Requisitos
1. Endpoint REST para pausar a pipeline (chamado pelo agent via CLI/curl)
2. Status "paused" para pipeline e run
3. Interface gráfica mostra botão "Run" quando pausada (não mostra visualização)
4. Ao rodar novamente, continua do próximo step

---

## Análise do Sistema Atual

### Fluxo de Execução Atual
1. `PipelineService.runPipeline()` cria run e seta status "running"
2. `PipelineStepService.executePipeline()` executa steps sequencialmente
3. Antes de cada step, verifica `isPipelineStopped(pipelineId)`
4. Após completar, atualiza status para "completed" ou "stopped"

### Mecanismo de Stop Atual (`PipelineStepService.java`)
- Usa `Set<Long> stoppedPipelines` para marcar pipelines interrompidas
- Verifica `isPipelineStopped()` antes e durante execução de cada step
- Processo é terminado com `process.destroyForcibly()`

### Step-by-Step Já Existente
- Já existe `pausedPipelines` (AtomicBoolean) para modo step-by-step
- Já existe `pendingStepOrders` para controlar próximo step
- Já existem endpoints `/continue` e `/paused` para step-by-step

---

## Implementação

### 1. Backend - Endpoint de Pausa

**Arquivo:** `backend/src/main/java/io/github/akumosstl/agentic/backend/controller/PipelineController.java`

Adicionar novo endpoint:
```java
@PostMapping("/{id}/pause")
public Map<String, Object> pausePipeline(@PathVariable Long projectId, @PathVariable Long id) {
    pipelineStepService.pausePipelineExecution(id);
    
    Pipeline pipeline = getPipelineById(id);
    pipeline.setStatus("paused");
    pipelineRepository.save(pipeline);
    
    // Update PipelineRun status
    List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(id);
    if (runs != null && !runs.isEmpty()) {
        PipelineRun run = runs.get(0);
        run.setStatus("paused");
        run.setCompletedAt(LocalDateTime.now());
        pipelineRunRepository.save(run);
    }
    
    // Enviar evento SSE de pausa
    sseService.sendPipelineComplete(id, "paused");
    
    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("message", "Pipeline paused successfully");
    return response;
}
```

### 2. Backend - Lógica de Pausa

**Arquivo:** `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineStepService.java`

Adicionar método `pausePipelineExecution()`:
```java
public void pausePipelineExecution(Long pipelineId) {
    stoppedPipelines.add(pipelineId);  // Para a execução
    pausedPipelines.putIfAbsent(pipelineId, new AtomicBoolean(true));  // Marca como pausada
    
    // Encontrar o step atual e salvar pending step order
    List<PipelineStep> steps = getStepsByPipeline(pipelineId);
    for (PipelineStep step : steps) {
        if ("running".equals(step.getStatus())) {
            step.setStatus("paused");
            pipelineStepRepository.save(step);
            setPendingStepOrder(pipelineId, step.getStepOrder() + 1);
            break;
        }
    }
    
    // Enviar evento SSE
    Optional<PipelineRun> runningRun = pipelineRunRepository.findAll().stream()
        .filter(r -> r.getPipeline() != null && r.getPipeline().getId().equals(pipelineId))
        .filter(r -> "running".equals(r.getStatus()))
        .findFirst();
    runningRun.ifPresent(run -> {
        run.setStatus("paused");
        pipelineRunRepository.save(run);
    });
    
    // Matar processo se estiver rodando
    Process process = runningProcesses.remove(pipelineId);
    if (process != null && process.isAlive()) {
        process.destroyForcibly();
    }
}
```

### 3. Backend - Modificar Resume para suportar "paused"

**Arquivo:** `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineStepService.java`

Modificar `executePipeline()` para continuar do ponto de pausa:
```java
public void executePipeline(Long pipelineId, String workingDir, String runDir, String outputExtension) {
    // Remover de stoppedPipelines para permitir execução
    stoppedPipelines.remove(pipelineId);
    
    // Verificar se está no estado paused e recuperar pending step
    Integer pendingStepOrder = pendingStepOrders.get(pipelineId);
    int startIndex = 0;
    if (pendingStepOrder != null && pendingStepOrder > 1) {
        startIndex = pendingStepOrder - 1;
    }
    
    // Se pipeline está "paused", marcar status como "running" novamente
    Pipeline pipeline = pipelineService.getPipelineById(pipelineId);
    if ("paused".equals(pipeline.getStatus())) {
        pipeline.setStatus("running");
        pipelineService.getPipelineRepository().save(pipeline);
        
        // Atualizar run também
        List<PipelineRun> runs = pipelineRunRepository.findByPipeline_IdOrderByCreatedAtDesc(pipelineId);
        if (runs != null && !runs.isEmpty()) {
            PipelineRun run = runs.get(0);
            if ("paused".equals(run.getStatus())) {
                run.setStatus("running");
                run.setCompletedAt(null);
                pipelineRunRepository.save(run);
            }
        }
    }
    
    // Resto da lógica existente...
}
```

### 4. Frontend - Detectar Status Paused

**Arquivo:** `desktop-angular/src/app/screens/project/project.component.ts`

Modificar `refreshPipelineStatus()` para tratar status "paused":
```typescript
refreshPipelineStatus() {
  this.apiService.getLatestPipelineRun(this.selectedPipeline.id).subscribe({
    next: (run) => {
      if (run) {
        if (run.status === 'running' || run.status === 'pending') {
          this.isRunningPipeline = true;
          this.pipelineStatus = 'running';
        } else if (run.status === 'paused') {
          this.isRunningPipeline = false;
          this.pipelineStatus = 'paused';  // Mostrar botão Run, não visualização
        } else {
          this.isRunningPipeline = false;
          this.pipelineStatus = run.status;
        }
      }
    }
  });
}
```

### 5. Frontend - Botão Run para Paused

**Arquivo:** `desktop-angular/src/app/screens/project/project.component.ts`

Modificar visibilidade do botão:
```typescript
// No template: mostrar Run quando:
// - pipeline.status !== 'running' E run.status !== 'running'
// - OU run.status === 'paused'

get showRunButton(): boolean {
  return this.pipelineStatus !== 'running' && 
         this.pipelineStatus !== 'pending' &&
         !this.isRunningPipeline;
}
```

### 6. Documentação para o Agent

Criar documentação de como o agent deve chamar o endpoint:
```
Para pausar a pipeline, o agent deve executar:
curl -X POST http://localhost:8080/api/projects/{projectId}/pipelines/{pipelineId}/pause

O agent pode incluir isso no seu output, por exemplo:
"Estou pausando a pipeline para que o usuário possa continuar depois..."
[PAUSE]
```

---

## Fluxo de Execução

### Cenário: Agent pausa a pipeline

```
1. Agent executa step1
2. Agent decide pausar → executa curl POST /pause
3. Backend:
   - Para o processo em execução
   - Salva pendingStepOrder = 2 (próximo step)
   - Set status = "paused" (pipeline e run)
   - Envia SSE "paused"
4. Frontend project.component:
   - Recebe evento (ou polling detecta)
   - Define isRunningPipeline = false
   - Status = "paused"
   - Botão Run disponível, botão Visualizar NÃO disponível
```

### Cenário: Usuário clica Run para continuar

```
1. Usuário clica Run
2. API runPipeline() é chamada
3. Backend:
   - Cria novo run (ou reutiliza existente com status "paused")
   - Chama executePipeline()
   - executePipeline() detecta status "paused"
   - Usa pendingStepOrder para continuar do step2
4. Frontend:
   - Abre aba de visualização
   - Reconecta ao SSE
   - Mostra step2 executando
```

---

## Testes

1. **Teste Unitário**: Pausar pipeline via curl e verificar status
2. **Teste de Integração**: Agent chama endpoint, pipeline pausa, usuário continua
3. **Teste UI**: Verificar que botão Run aparece quando pausado, Visualizar não aparece

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Agent não consegue fazer curl | Documentar endpoint claramente |
| Pausa durante step sem agent (script) | Suportar pausa em qualquer tipo de step |
| Concurrent access (dois agentes pausando) | Lock já existe no executePipeline |

---

## Arquivos a Modificar

1. `backend/src/main/java/io/github/akumosstl/agentic/backend/controller/PipelineController.java` - Adicionar endpoint `/pause`
2. `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineStepService.java` - Adicionar método `pausePipelineExecution()` e modificar `executePipeline()`
3. `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineService.java` - Pode precisar de ajuste para suportar "paused"
4. `desktop-angular/src/app/screens/project/project.component.ts` - Tratar status "paused" na UI