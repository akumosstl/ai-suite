# Plano de Implementação: Console Output em Tempo Real (Estilo Jenkins)

## Visão Geral

Adaptar o mecanismo de console output do Jenkins para o projeto existente, permitindo que o usuário visualize a saída do step em tempo real durante a execução da pipeline.

**Arquitetura atual**: SSE (Server-Sent Events) já existe para notificações de status, mas a saída do step é enviada em blocos (não streaming em tempo real).

**Abordagem proposta**: Melhorar o SSE existente para enviar saída do processo linha a linha durante a execução, e atualizar o frontend para acumular/exibir essa saída incrementalmente.

---

## Tasks

### Task 1: Backend - Streaming de Output em Tempo Real via SSE

**Objetivo**: Modificar o serviço de execução de steps para enviar cada linha de output do processo subprocesso instantaneamente via SSE.

**Arquitetura existente**:
- `PipelineStepService.executeStep()` executa o processo e aguardam completação
- `SseService` já tem `emitStepOutput()` que envía output via SSE

**Modificações necessárias**:

1. **Arquivo**: `backend/src/main/java/com/agentic/service/PipelineStepService.java`

   - No método `executeStep()`, criar um mecanismo de callback para enviar output linha a linha
   - Substituir a leitura blocking por reading em tempo real do `InputStream` do processo

   ```java
   // Novo método ou modificação no executeStep()
   private void streamProcessOutput(Process process, Long pipelineId, int stepOrder, Long stepId) {
       BufferedReader reader = new BufferedReader(
           new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
       
       String line;
       while ((line = reader.readLine()) != null) {
           // Emitir via SSE para cada linha
           sseService.emitStepOutput(pipelineId, stepOrder, stepId, line, "running");
       }
   }
   ```

2. **Arquivo**: `backend/src/main/java/com/agentic/service/SseService.java`

   - Modificar `emitStepOutput()` para aceitar um parâmetro `append` ou `isPartial` para indicar que o output está sendo acumulado
   - Adicionar método para enviar output sem sobrescrever o anterior

3. **Arquivo**: `backend/src/main/java/com/agentic/controller/SseController.java` (se necessário)

   - Garantir que o endpoint `/api/pipelines/{id}/stream` suporte o tipo de evento de output incremental

**Critério de aceite**: Ao executar um step, o backend envia cada linha de output via SSE imediatamente após ser gerada.

---

### Task 2: Backend - Captura de stderr Separadamente

**Objetivo**: Capturar também a saída de erro (stderr) do processo, não apenas stdout.

**Modificações necessárias**:

1. No `PipelineStepService`, configurar `ProcessBuilder` para:
   - Redirecionar `stderr` para `stdout` (usando `redirectErrorStream(true)`) para output combinado
   - OU manter separados e enviar ambos via SSE com distinção (stdout vs stderr)

**Recomendação**: Usar `redirectErrorStream(true)` para simplificar - todo output vai para o mesmo fluxo.

**Critério de aceite**: Erros de processo são visíveis no console em tempo real.

---

### Task 3: Backend - Armazenamento Incremental de Output

**Objetivo**: Persistir o output incrementalmente no banco de dados durante a execução, não apenas ao final.

**Modificações necessárias**:

1. **Arquivo**: `backend/src/main/java/com/agentic/model/PipelineStep.java`

   - Garantir que o campo `outputContent` aceite texto longo (usar `@Lob` ou `CLOB`)

2. **Arquivo**: `PipelineStepService`

   - Ao receber cada linha de output, fazer append ao `outputContent` existente no banco de dados
   - Implementar append usando `StringBuilder` em memória e persistir periodicamente (a cada N linhas) para evitar muitas escritaBD

**Critério de aceite**: Se a página for recarregada, o output já executado persiste.

---

### Task 4: Frontend - Exibição Incremental de Output

**Objetivo**: Modificar o componente de console para acumular output incrementalmente ao invés de substituir.

**Componentes afetados**:

1. **Arquivo**: `desktop-angular/src/app/components/run-pipelines/run-pipelines.component.ts`

   - Modificar `handleSseMessage()` para fazer append do output recebido
   - Usar signal ou BehaviorSubject para acumular string de output

2. **Arquivo**: `desktop-angular/src/app/components/run-pipelines/run-pipelines.component.html`

   - Garantir que o template exiba todo o conteúdo acumulado, não apenas o último evento

**Mudança conceitual**:
- **Antes**: `output = event.output` (substitui)
- **Depois**: `output += event.output` (append)

**Critério de aceite**: O console mostra todo o output desde o início da execução, com scroll automático para o final.

---

### Task 5: Frontend - Console Dialog com Auto-scroll

**Objetivo**: Melhorar o `ConsoleOutputDialogComponent` para suportar auto-scroll e display em tempo real.

**Modificações necessárias**:

1. **Arquivo**: `desktop-angular/src/app/components/console-output-dialog/console-output-dialog.component.ts`

   - Adicionar lógica de auto-scroll quando novo output chega
   - Usar `@ViewChild` para referenciar o elemento de output e controlar scroll
   - Adicionar opção de "scroll para o final" habilitado por padrão

2. **Arquivo**: `desktop-angular/src/app/components/console-output-dialog/console-output-dialog.component.html`

   - Usar `<pre>` ou `<code>` com styling de terminal (background preto, texto verde)
   - Garantir que quebras de linha sejam respeitadas

**Critério de acetate**: Ao abrir o dialog durante execução, o scroll automaticamente vai para o final e novos outputs aparecem sem ação do usuário.

---

### Task 6: Frontend - Fallback com Polling Melhorado

**Objetivo**: Manter o fallback para polling, mas com endpoint específico para buscar output incremental.

**Modificações necessárias**:

1. **Arquivo**: `desktop-angular/src/app/services/api.service.ts` (ou criar `LogService`)

   - Adicionar endpoint REST para buscar output desde um offset/position específico
   - Exemplo: `GET /api/pipelines/{id}/steps/{stepId}/output?fromLine=50`

2. **Arquivo**: `run-pipelines.component.ts`

   - Modificar lógica de polling para pedir apenas o增量 output desde última posição conhecida
   - Alternativamente, manter polling simples que retorna todo output (mais simples, menos otimizado)

**Recomendação inicial**: Manter polling simples (retorna todo output), otimizar apenas se necessário.

**Critério de aceite**: Se SSE falhar, o output ainda é atualizado via polling a cada 3 segundos.

---

### Task 7: Testes de Integração

**Objetivo**: Garantir que a feature funcione end-to-end.

**Testes necessários**:

1. **Teste de execução de pipeline com output**:
   - Criar pipeline com step que gera output (ex: script com echo)
   - Executar pipeline
   - Observar output em tempo real no frontend

2. **Teste de output longo**:
   - Step que gera muitas linhas de output
   - Verificar que não há degradação de performance

3. **Teste de fallback**:
   - Desabilitar SSE temporariamente
   - Verificar que polling funciona

4. **Teste de console dialog**:
   - Durante execução, clicar para ver details
   - Verificar que dialog mostra output em tempo real

---

## Dependências entre Tasks

```
Task 1 (Backend streaming)
    |
    v
Task 2 (stderr) --> Task 3 (persistence)
    |                    |
    v                    v
    +-----------> Task 4 (Frontend append)
                       |
                       v
                   Task 5 (Dialog auto-scroll)
                       |
                       v
                   Task 6 (Polling fallback)
                       |
                       v
                   Task 7 (Testes)
```

**Sequência recomendada**: 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Observações Técnicas

1. **SSE vs WebSocket**: O projeto já tem SSE implementado. A abordagem proposta usa SSE (não WebSocket) para manter consistência com a arquitetura existente.

2. **Output storage**: O output já é armazenado em arquivo (`.agentic/pipelines/{name}/{timestamp}/step{N}-result.{ext}`). A task 3 garante que também seja persistido no banco incrementalmente.

3. **Performance**: Para outputs muito grandes, considerar:
   - Limitar tamanho máximo stored
   - Usar streaming de arquivo para outputs históricos
   - Implementar "tail -f" style para buscar apenas últimas linhas

4. **Segurança**: Sanitizar output antes de exibir para evitar XSS (especialmente se o output vier de scripts externos).

---

## Referencias

- `backend/.../service/PipelineStepService.java` - Execução de steps
- `backend/.../service/SseService.java` - Broadcasting SSE
- `backend/.../model/PipelineStep.java` - Entidade step com outputContent
- `desktop-angular/.../run-pipelines.component.ts` - UI de execução
- `desktop-angular/.../console-output-dialog.component.ts` - Dialog de output