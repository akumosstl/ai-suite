# Bug Fix Plan: Duplicate Output & Stop Button

## Bug 1: Duplicate Console Output

### Análise
O output está sendo duplicado devido a múltiplas fontes:
1. **SSE reconexões**: O `eventSource.onerror` (linhas 143-155 em runpipelines.component.ts) tenta reconectar após 3s, criando múltiplas conexões
2. **Polling conflita com SSE**: O `pollPipelineStatus` (linhas 187-221) também faz append de output e pode conflitar com SSE
3. **Nenhuma dedupicação**: Não há mekanisme para evitar duplicatas baseado em message IDs

### Causa Raiz
- `connectSse()` é chamado em `ngOnInit` com pipelineId
- Quando há erro SSE, `onerror` reconecta após 3s se `isRunning` ainda é true
- Mas `isRunning` só é setado para `false` no evento `pipeline-complete`
- Se o pipeline já completou mas `pipeline-complete` não foi recebido, a reconexão ainda acontece

### Solução
1. Adicionar deduplicação por message ID ou timestamp
2. Na função `handleStepOutput`, verificar se a message já foi processada
3. Adicionar flag para controlar se o output já foi completamente enviado

## Bug 2: Stop Button Não Fica Disabled

### Análise
A condição no template (linha 24) está incorretamente lógica:

```html
[disabled]="isStopping || (!isRunning && !isPaused && pipelineSteps.length > 0 && pipelineSteps.every(s => s.status === 'completed' || s.status === 'failed'))"
```

### Causa Raiz
A expressão `.every(s => s.status === 'completed' || s.status === 'failed')` 
não funciona como esperado porque:
- `.every()` retorna true se **cada** elemento satisfaz a condição
- A condição `s.status === 'completed' || s.status === 'failed'` verifica se **cada** step é completed OU **cada** step é failed (o que é impossível)
- Deveria ser `.every(s => s.status === 'completed' || s.status === 'failed')` -> isso significa "todos completed OU todos failed"

O problema é a precedência de operadores. A expressão correto seria:
`.every(s => s.status === 'completed' || s.status === 'failed')` 
mas isso significa que cada step individual precisa ser completed OU failed (impossível)

A expressão correta deveria verificar se todos os steps têm status terminal:
```typescript
// Todos os steps finalizados (cada step pode ser completed ou failed)
this.pipelineSteps.every(s => s.status === 'completed' || s.status === 'failed')
```

Ou ainda mais simples: verificar se não existe nenhum step "running" ou "pending":
```typescript
!this.pipelineSteps.some(s => s.status === 'running' || s.status === 'pending')
```

### Solução
1. Criar getter/função para verificar se pipeline está finalizada
2. Usar condição mais simples e explícita

## Correções Propostas

### 1. runpipelines.component.ts

```typescript
// Adicionar na classe
private processedStepOutputs = new Set<string>();

// Modificar handleStepOutput para dedup
handleStepOutput(data: { stepId: number; stepOrder: number; output: string; status: string }) {
  const step = this.pipelineSteps.find(s => s.id === data.stepId || s.stepOrder === data.stepOrder);
  if (!step) return;

  // Deduplicação por step ID + status
  const messageKey = `${data.stepId}-${data.stepOrder}-${data.status}`;
  if (this.processedStepOutputs.has(messageKey)) {
    return;
  }
  this.processedStepOutputs.add(messageKey);

  // ... resto da lógica
}

// Adicionar no pipeline-complete
this.eventSource.addEventListener('pipeline-complete', (event) => {
  // Limpar set de deduplicação
  this.processedStepOutputs.clear();
  this.isRunning = false;
  this.isPaused = false;
  this.stopPolling();
  this.cdr.detectChanges();
});
```

### 2. runpipelines.component.html

```html
<!-- Substituir a condição do button -->
<ng-container *ngIf="isPipelineFinished()">
  <button class="action-btn" disabled title="Pipeline finished">
</ng-container>
<ng-container *ngIf="!isPipelineFinished()">
  <button class="action-btn" (click)="stopPipeline()" title="Stop pipeline"
    [disabled]="isStopping">
</ng-container>
```

```typescript
// Adicionar getter
isPipelineFinished(): boolean {
  return !this.isRunning && 
         !this.isPaused && 
         this.pipelineSteps.length > 0 && 
         this.pipelineSteps.every(s => s.status === 'completed' || s.status === 'failed');
}
```

### 3. SseService.java (backend)

Adicionar deduplicação baseada em timestamp para não reenviar outputs antigos.

---

## Arquivos a Modificar
- `desktop-angular/src/app/screens/runpipelines/runpipelines.component.ts`
- `desktop-angular/src/app/screens/runpipelines/runpipelines.component.html`
- `backend/src/main/java/io/github/akumosstl/agentic/backend/service/SseService.java`

## Testes de Validação
1. Executar pipeline completa -> output não deve estar duplicado
2. Pipeline finalizada -> Stop button deve estar disabled
3. Recarregar página durante execução -> botão funciona corretamente