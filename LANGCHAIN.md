# LangChain4j Native AI Engine - Implementation Plan

## 1. Overview

Add a **native AI engine** to the Agentic pipeline system using `dev.langchain4j`. Today, every pipeline step spawns an external CLI process (opencode, copilot, claude, etc.) via `ProcessBuilder`. The new engine runs **in-process** via langchain4j Java API calls, eliminating the need for external CLI tools.

**Key Principle:** The existing CLI mechanism remains 100% unchanged. The new engine is an **addition**, not a replacement.

---

## 2. Architecture Summary

### Current Flow (unchanged)
```
PipelineStep → executeStep() → executeAgentStep()/executeScriptStep()
  → getProjectTargetCli() → ProcessBuilder("opencode run ...")
  → BufferedReader → SSE stream
```

### New Flow (langchain4j engine)
```
PipelineStep (engine="langchain") → executeStep() → executeLangchainStep()
  → LangchainEngineService.execute()
  → StreamingChatModel.stream() → TokenStream
  → onToken() → SSE sendStepOutput (token-by-token)
```

### Engine Selection Logic
```
1. Step has explicit `engine` field → use that engine
2. Step has explicit `cli` field → use CLI engine (existing behavior)
3. Default (no engine, no cli) → use "langchain" (NEW DEFAULT)
4. Step has cli="opencode"/"copilot"/"claude" → use CLI engine (backward compat)
```

---

## 3. Backend Changes

### 3.1 Maven Dependencies (`pom.xml`)

Add langchain4j dependencies:

```xml
<!-- LangChain4j Core -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.0.0-beta2</version>
</dependency>

<!-- Provider modules -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.0.0-beta2</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>1.0.0-beta2</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic</artifactId>
    <version>1.0.0-beta2</version>
</dependency>
```

> **Note:** Verify latest stable version at implementation time. Versions change frequently.

---

### 3.2 New Model: `AppConfig` (JPA Entity)

**Package:** `io.github.akumosstl.agentic.backend.model`

```java
@Entity
@Table(name = "app_config")
public class AppConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_key", nullable = false, unique = true)
    private String configKey;          // e.g. "OPENAI_API_KEY", "GEMINI_API_KEY", "DEFAULT_LLM_PROVIDER"

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String configValue;        // the API key or config value

    @Column(name = "description")
    private String description;        // e.g. "OpenAI API Key"

    @Column(name = "is_secret")
    private Boolean isSecret = true;   // masks value in GET responses

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

**Seed data** (auto-created on startup if not present):
- `OPENAI_API_KEY` = ""
- `GEMINI_API_KEY` = ""
- `ANTHROPIC_API_KEY` = ""
- `DEFAULT_LLM_PROVIDER` = "openai"  (options: openai, gemini, anthropic)
- `DEFAULT_LLM_MODEL` = "gpt-4o"     (provider-specific default model)

---

### 3.3 New Repository: `AppConfigRepository`

**Package:** `io.github.akumosstl.agentic.backend.repository`

```java
@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, Long> {
    Optional<AppConfig> findByConfigKey(String configKey);
    List<AppConfig> findByIsSecretTrue();
}
```

---

### 3.4 New Service: `AppConfigService`

**Package:** `io.github.akumosstl.agentic.backend.service`

**Methods:**
- `getConfigValue(String key)` → returns the value (or null)
- `setConfigValue(String key, String value)` → upsert
- `getAllConfigs()` → returns all configs (masking secret values)
- `getUnmaskedValue(String key)` → returns raw value (internal use only)
- `seedDefaults()` → creates default config entries if they don't exist

**Security:** GET endpoints always mask `isSecret=true` values (show only last 4 chars: `****abcd`). Only PUT allows setting the full value.

---

### 3.5 New Service: `LangchainEngineService`

**Package:** `io.github.akumosstl.agentic.backend.service`

This is the core service that orchestrates langchain4j calls.

```java
@Service
public class LangchainEngineService {

    @Autowired private AppConfigService appConfigService;
    @Autowired private SseService sseService;

    /**
     * Execute a langchain4j streaming chat call.
     * Streams tokens via SSE in real-time.
     *
     * @param prompt       The resolved prompt (after all placeholder replacements)
     * @param pipelineId   Pipeline ID for SSE routing
     * @param runId        Run ID for SSE routing (nullable)
     * @param stepId       Step ID for SSE events
     * @param stepOrder    Step order for SSE events
     * @param provider     Override provider (nullable → uses default from config)
     * @param modelName    Override model name (nullable → uses default from config)
     * @return             Full response text after completion
     */
    public String executeStreaming(
        String prompt,
        Long pipelineId, Long runId, Long stepId, int stepOrder,
        String provider, String modelName
    ) throws Exception;

    /**
     * Create a StreamingChatModel based on provider + API key from AppConfig.
     */
    private StreamingChatModel createStreamingModel(String provider, String modelName);

    /**
     * Get the effective provider (step override → config default).
     */
    private String resolveProvider(String stepProvider);

    /**
     * Get the effective model name (step override → config default).
     */
    private String resolveModelName(String provider, String stepModel);
}
```

**Key implementation details:**

#### `createStreamingModel(provider, modelName)`
```java
switch (provider) {
    case "openai":
        String openaiKey = appConfigService.getUnmaskedValue("OPENAI_API_KEY");
        if (openaiKey == null || openaiKey.isEmpty()) throw new RuntimeException("OpenAI API Key not configured");
        return OpenAiStreamingChatModel.builder()
            .apiKey(openaiKey)
            .modelName(modelName != null ? modelName : "gpt-4o")
            .build();

    case "gemini":
        String geminiKey = appConfigService.getUnmaskedValue("GEMINI_API_KEY");
        if (geminiKey == null || geminiKey.isEmpty()) throw new RuntimeException("Gemini API Key not configured");
        return GoogleAiGeminiStreamingChatModel.builder()
            .apiKey(geminiKey)
            .modelName(modelName != null ? modelName : "gemini-2.0-flash")
            .build();

    case "anthropic":
        String anthropicKey = appConfigService.getUnmaskedValue("ANTHROPIC_API_KEY");
        if (anthropicKey == null || anthropicKey.isEmpty()) throw new RuntimeException("Anthropic API Key not configured");
        return AnthropicStreamingChatModel.builder()
            .apiKey(anthropicKey)
            .modelName(modelName != null ? modelName : "claude-sonnet-4-20250514")
            .build();

    default:
        throw new RuntimeException("Unknown LLM provider: " + provider);
}
```

#### `executeStreaming(prompt, pipelineId, runId, stepId, stepOrder, provider, modelName)`

Uses langchain4j's `StreamingChatModel.chat()` with `ChatMessage` and `TokenStream`:

```java
StreamingChatModel model = createStreamingModel(resolveProvider(provider), resolveModelName(provider, modelName));

ChatMessage userMessage = UserMessage.from(prompt);
StringBuilder fullResponse = new StringBuilder();
CountDownLatch latch = new CountDownLatch(1);
AtomicReference<Throwable> error = new AtomicReference<>();

model.chat(ChatMemory.messages(userMessage), new StreamingChatModelListener() {
    // Or use TokenStream API depending on langchain4j version:
    // model.stream(ChatMemory.messages(userMessage))
    //   .onToken(token -> { ... })
    //   .onComplete(response -> { ... })
    //   .onError(Throwable -> { ... });

    @Override
    public void onToken(String token) {
        fullResponse.append(token);
        // Send each token via SSE (same pattern as streamProcessOutput)
        sendSseStepOutput(runId, pipelineId, stepId, stepOrder, token, "running");
    }

    @Override
    public void onComplete(Response<AiMessage> response) {
        latch.countDown();
    }

    @Override
    public void onError(Throwable t) {
        error.set(t);
        latch.countDown();
    }
});

latch.await(5, TimeUnit.MINUTES);  // configurable timeout

if (error.get() != null) {
    throw new RuntimeException("LangChain4j streaming error: " + error.get().getMessage(), error.get());
}

return fullResponse.toString();
```

> **Note:** The exact TokenStream API depends on the langchain4j version. Version 1.0.0-beta2+ uses `model.chat(messages, StreamingChatModelListener)`. Verify at implementation time. The core pattern is: receive token → send SSE → accumulate response.

---

### 3.6 New Controller: `AppConfigController`

**Package:** `io.github.akumosstl.agentic.backend.controller`

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/app-config` | List all configs (secret values masked) |
| `GET` | `/api/app-config/{key}` | Get single config (secret masked) |
| `PUT` | `/api/app-config/{key}` | Update config value (body: `{ "value": "sk-..." }`) |
| `POST` | `/api/app-config/seed` | Force seed defaults |
| `GET` | `/api/app-config/test/{provider}` | Test if API key works for a provider (returns `{ "success": true/false, "error": "..." }`) |

**PUT request body:**
```json
{
  "value": "sk-proj-abc123..."
}
```

**GET response (masked):**
```json
{
  "configKey": "OPENAI_API_KEY",
  "configValue": "****c123",
  "description": "OpenAI API Key",
  "isSecret": true
}
```

---

### 3.7 Model Changes: `PipelineStep`

Add `engine` column:

```java
@Column(name = "engine")
private String engine;   // "langchain", "cli", null (null = default = "langchain")
```

- `"langchain"` → use LangchainEngineService
- `"cli"` → use existing ProcessBuilder flow
- `null` → use the new default: **langchain** (breaking change mitigation below)

> **Backward Compatibility:** Existing steps with `cli` field set (e.g. `cli="opencode"`) will continue to use the CLI engine regardless of the `engine` field. The logic is:
> 1. If `engine` is explicitly set → use that
> 2. Else if `cli` is explicitly set → use CLI engine
> 3. Else → use langchain (new default)

Add `llmProvider` and `llmModel` columns for per-step override:

```java
@Column(name = "llm_provider")
private String llmProvider;   // "openai", "gemini", "anthropic", null (null = use default from app_config)

@Column(name = "llm_model")
private String llmModel;      // "gpt-4o", "gemini-2.0-flash", null (null = use default from app_config)
```

---

### 3.8 Model Changes: `PipelineRunStep`

Add same fields for snapshot:

```java
@Column(name = "engine")
private String engine;

@Column(name = "llm_provider")
private String llmProvider;

@Column(name = "llm_model")
private String llmModel;
```

Populate in `PipelineRunService.createRun()` alongside existing snapshot fields.

---

### 3.9 Model Changes: `Target`

The Target entity already has a `cli` field. No changes needed to Target. The engine is a pipeline-level concept, not target-level.

---

### 3.10 Service Changes: `PipelineStepService.executeStep()`

**Modified `executeStep()` method** — add a new branch:

```java
private void executeStep(PipelineStep step, Long pipelineId, Long runId,
                         String workingDir, String runDir, String outputExtension,
                         String previousOutputFile) {
    // ... existing pre-checks (stopped pipeline, set status to running, etc.) ...

    String stepType = step.getType();
    String engine = resolveEngine(step);  // NEW METHOD

    if ("script".equals(stepType)) {
        // Script steps always use CLI/engine mechanism (unchanged)
        output = executeScriptStep(step, pipelineId, runId, stepId, workingDir, runDir, previousOutputFile);
    } else if (step.getAgent() != null) {
        if ("langchain".equals(engine)) {
            // NEW: Execute via langchain4j in-process
            output = executeLangchainStep(step, pipelineId, runId, stepId, workingDir, runDir, previousOutputFile);
        } else {
            // EXISTING: Execute via CLI process
            output = executeAgentStep(step, pipelineId, runId, stepId, workingDir, runDir, previousOutputFile);
        }
    }
    // ... rest unchanged ...
}
```

**New method `resolveEngine(step)`:**
```java
private String resolveEngine(PipelineStep step) {
    // 1. Explicit engine on step
    if (step.getEngine() != null && !step.getEngine().isEmpty()) {
        return step.getEngine();
    }
    // 2. Explicit CLI on step → use CLI engine
    if (step.getCli() != null && !step.getCli().isEmpty()) {
        return "cli";
    }
    // 3. Default → langchain
    return "langchain";
}
```

**New method `executeLangchainStep()`:**
```java
private String executeLangchainStep(PipelineStep step, Long pipelineId, Long runId,
                                     Long stepId, String workingDir, String runDir,
                                     String previousOutputFile) throws Exception {
    Agent agent = step.getAgent();
    String prompt = agent != null ? agent.getPrompt() : "Hello, please respond.";

    // Same placeholder resolution as executeAgentStep
    if (prompt.contains("{{previous-output-file}}")) {
        prompt = prompt.replace("{{previous-output-file}}",
            previousOutputFile != null ? previousOutputFile.replace("\\", "/") : "");
    }

    String inputContent = step.getInputContent() != null ? step.getInputContent() : "";
    inputContent = resolveInputContent(inputContent, pipelineId, step.getStepOrder(), runDir);
    prompt = prompt.replace("{{agentic-input:file}}", inputContent);

    String stepOutput = step.getStepOutput() != null ? step.getStepOutput() : "";
    prompt = prompt.replace("{{agentic-output:file}}", stepOutput);

    sendSseStepOutput(runId, pipelineId, stepId, step.getStepOrder(),
        "Executing via langchain4j (provider: " + step.getLlmProvider() + ")\n", "running");

    // Delegate to LangchainEngineService
    return langchainEngineService.executeStreaming(
        prompt, pipelineId, runId, stepId, step.getStepOrder(),
        step.getLlmProvider(), step.getLlmModel()
    );
}
```

---

### 3.11 Service Changes: `PipelineStepService.saveCli()`

Extend to also save `engine`, `llmProvider`, `llmModel`:

```java
public PipelineStep saveStepEngine(Long stepId, String engine, String llmProvider, String llmModel) {
    PipelineStep step = getStepById(stepId);
    step.setEngine(engine);
    step.setLlmProvider(llmProvider);
    step.setLlmModel(llmModel);
    return pipelineStepRepository.save(step);
}
```

---

### 3.12 Service Changes: `PipelineRunService.createRun()`

Add snapshot fields for new columns:

```java
runStep.setEngine(step.getEngine());
runStep.setLlmProvider(step.getLlmProvider());
runStep.setLlmModel(step.getLlmModel());
```

---

### 3.13 Startup Seeder: `AppConfigSeedLoader`

**Package:** `io.github.akumosstl.agentic.backend.config`

A `@Component` implementing `CommandLineRunner` (or `@PostConstruct` in AppConfigService) that creates default `AppConfig` entries if they don't exist:

- `OPENAI_API_KEY` = ""
- `GEMINI_API_KEY` = ""
- `ANTHROPIC_API_KEY` = ""
- `DEFAULT_LLM_PROVIDER` = "openai"
- `DEFAULT_LLM_MODEL` = "gpt-4o"

Similar to existing `TargetSeedLoader`.

---

### 3.14 Stop Pipeline Support

For the langchain4j engine, there is no `Process` to destroy. Instead:

- Add a `volatile boolean` flag or use the existing `stoppedPipelines` set
- In the `onToken()` callback, check `isPipelineStopped(pipelineId)` before each SSE send
- If stopped, complete the stream and throw to mark step as failed

```java
@Override
public void onToken(String token) {
    if (pipelineStepService.isPipelineStopped(pipelineId)) {
        // Cancel the streaming - langchain4j doesn't have a direct cancel API
        // but we can stop processing tokens
        return;
    }
    fullResponse.append(token);
    sendSseStepOutput(runId, pipelineId, stepId, stepOrder, token, "running");
}
```

> **Note:** langchain4j streaming cancellation may require closing the underlying HTTP connection. This needs investigation at implementation time. A potential approach is to use a custom `OkHttpClient` with a configurable timeout, or to call `response.close()` on the underlying response object.

---

## 4. Frontend Changes

### 4.1 Config Screen: New "AI Engine" Menu Item

**File:** `desktop-angular/src/app/screens/config/config.component.ts`

Add a second menu item in the left panel alongside "Target":

```html
<mat-nav-list>
  <a mat-list-item (click)="showTargetList()" [class.active]="selectedMenu === 'target'">
    <mat-icon matListItemIcon>flag</mat-icon>
    <span matListItemTitle>Target</span>
  </a>
  <!-- NEW -->
  <a mat-list-item (click)="showAiEngineConfig()" [class.active]="selectedMenu === 'ai-engine'">
    <mat-icon matListItemIcon>smart_toy</mat-icon>
    <span matListItemTitle>AI Engine</span>
  </a>
</mat-nav-list>
```

**Right panel for AI Engine (`selectedMenu === 'ai-engine'`):**

Display a form with:
- **OpenAI API Key** — input type="password" with show/hide toggle
- **Gemini API Key** — input type="password" with show/hide toggle
- **Anthropic API Key** — input type="password" with show/hide toggle
- **Default LLM Provider** — select dropdown (openai, gemini, anthropic)
- **Default LLM Model** — text input (auto-populated based on provider)
- **Test Connection** button per provider — calls `/api/app-config/test/{provider}`
- **Save** button — calls `PUT /api/app-config/{key}` for each changed value

**UX:**
- On load, call `GET /api/app-config` and populate fields (masked values shown)
- If a field shows `****abcd`, user can clear and type new value
- If field is left with masked value, it's not sent in the update (skip unchanged)
- Test button shows spinner, then green checkmark or red X with error message

---

### 4.2 API Service: New Interfaces and Methods

**File:** `desktop-angular/src/app/services/api.service.ts`

**New interface:**
```typescript
export interface AppConfig {
  id?: number;
  configKey: string;
  configValue: string;    // masked for secrets
  description?: string;
  isSecret?: boolean;
}

export interface AppConfigTestResult {
  success: boolean;
  error?: string;
}
```

**New methods:**
```typescript
getAppConfigs(): Observable<AppConfig[]> {
  return this.http.get<AppConfig[]>(`${this.baseUrl}/app-config`);
}

updateAppConfig(key: string, value: string): Observable<AppConfig> {
  return this.http.put<AppConfig>(`${this.baseUrl}/app-config/${key}`, { value });
}

testAppConfig(provider: string): Observable<AppConfigTestResult> {
  return this.http.get<AppConfigTestResult>(`${this.baseUrl}/app-config/test/${provider}`);
}

seedAppConfig(): Observable<any> {
  return this.http.post(`${this.baseUrl}/app-config/seed`, {});
}
```

---

### 4.3 PipelineStep Interface Update

**File:** `desktop-angular/src/app/services/api.service.ts`

Add to `PipelineStep` interface:
```typescript
engine?: string;       // "langchain" | "cli"
llmProvider?: string;  // "openai" | "gemini" | "anthropic"
llmModel?: string;     // "gpt-4o" | "gemini-2.0-flash" | etc.
```

Add to `PipelineRunStep` interface:
```typescript
engine?: string;
llmProvider?: string;
llmModel?: string;
```

---

### 4.4 Step Settings Dialog: Engine Configuration

**File:** `desktop-angular/src/app/components/step-settings-dialog/step-settings-dialog.component.ts`

Add fields to the step settings dialog:

- **Engine** — select dropdown: "Default (LangChain4j)", "CLI (External Process)"
  - When "CLI" is selected → show existing CLI/parameters/arguments fields
  - When "LangChain4j" is selected → show LLM Provider and LLM Model fields
- **LLM Provider** — select: "Default (from Config)", "OpenAI", "Google Gemini", "Anthropic"
- **LLM Model** — text input with placeholder based on provider (e.g., "gpt-4o" for OpenAI)

---

### 4.5 Step CLI Dialog: Add Engine Toggle

**File:** `desktop-angular/src/app/components/step-cli-dialog/step-cli-dialog.component.ts`

Add an "Engine" toggle at the top of the dialog:
- If engine is "langchain" → show provider/model fields instead of CLI/parameters
- If engine is "cli" → show existing CLI fields

---

### 4.6 SSE Handling: No Frontend Changes Needed

The SSE event format remains identical:
```json
{"runId":1,"pipelineId":2,"stepId":3,"stepOrder":1,"output":"token text","status":"running"}
```

The frontend already handles line-by-line SSE output via `EventSource`. Token-by-token from langchain4j works the same way — each token is sent as an SSE `step-output` event. The frontend accumulates them in the output display exactly as it does now.

**The only difference:** Tokens arrive faster and individually (not as full lines). The existing `processedStepOutputs` deduplication and output accumulation logic handles this correctly.

---

## 5. H2 Database Schema Changes

Since `spring.jpa.hibernate.ddl-auto=update`, new columns are auto-created. But we need to note:

### New table: `app_config`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT |
| config_key | VARCHAR | UNIQUE, NOT NULL |
| config_value | TEXT | |
| description | VARCHAR | |
| is_secret | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Altered table: `pipeline_step`
| Column | Type | Default |
|--------|------|---------|
| engine | VARCHAR | NULL |
| llm_provider | VARCHAR | NULL |
| llm_model | VARCHAR | NULL |

### Altered table: `pipeline_run_step`
| Column | Type | Default |
|--------|------|---------|
| engine | VARCHAR | NULL |
| llm_provider | VARCHAR | NULL |
| llm_model | VARCHAR | NULL |

> **Important:** Remind user to update initialization .sql files if they exist for production deployments.

---

## 6. Implementation Order

### Phase 1: Backend Foundation (no frontend changes yet)
1. Add langchain4j dependencies to `pom.xml`
2. Create `AppConfig` entity + `AppConfigRepository`
3. Create `AppConfigService` with seed defaults
4. Create `AppConfigSeedLoader` (CommandLineRunner)
5. Create `AppConfigController` (GET/PUT endpoints, masking)
6. Add `engine`, `llmProvider`, `llmModel` columns to `PipelineStep` and `PipelineRunStep`
7. Update `PipelineRunService.createRun()` to snapshot new fields

### Phase 2: LangChain4j Engine
8. Create `LangchainEngineService` with `executeStreaming()` method
9. Implement `createStreamingModel()` for each provider (OpenAI, Gemini, Anthropic)
10. Implement token-by-token SSE streaming in `executeStreaming()`
11. Add `resolveEngine()` method to `PipelineStepService`
12. Add `executeLangchainStep()` method to `PipelineStepService`
13. Modify `executeStep()` to branch between CLI and langchain engines
14. Add `saveStepEngine()` method to `PipelineStepService`
15. Implement stop pipeline support for langchain engine
16. Add test connection endpoint to `AppConfigController`

### Phase 3: Frontend
17. Add `AppConfig` interface and API methods to `api.service.ts`
18. Add `engine`, `llmProvider`, `llmModel` to PipelineStep/PipelineRunStep interfaces
19. Add "AI Engine" menu section to Config screen
20. Build AI Engine config form (API keys, provider, model, test connection)
21. Update step-settings-dialog with engine selection
22. Update step-cli-dialog with engine toggle (optional, if used)

### Phase 4: Testing & Polish
23. Test OpenAI integration end-to-end
24. Test Gemini integration end-to-end
25. Test Anthropic integration end-to-end
26. Test SSE streaming token-by-token display
27. Test that existing CLI pipelines still work unchanged
28. Test pipeline stop with langchain engine
29. Test config API key masking in GET responses
30. Test backward compatibility: existing steps with CLI set still use CLI engine

---

## 7. Backward Compatibility Guarantee

| Scenario | Behavior |
|----------|----------|
| Existing step with `cli="opencode"` and no `engine` field | `resolveEngine()` returns `"cli"` → uses ProcessBuilder (unchanged) |
| Existing step with `cli="copilot"` and no `engine` field | `resolveEngine()` returns `"cli"` → uses ProcessBuilder (unchanged) |
| New step with no `cli` and no `engine` | `resolveEngine()` returns `"langchain"` → uses langchain4j |
| New step with `engine="cli"` | Uses ProcessBuilder even if no `cli` set (falls back to project target CLI) |
| New step with `engine="langchain"` and `llmProvider="gemini"` | Uses Gemini via langchain4j |
| Script step (any engine) | Always uses CLI/script execution (langchain is for agent steps only) |

**Nothing changes for existing pipelines.** The `engine` column defaults to NULL, and NULL + existing `cli` → CLI engine.

---

## 8. API Key Security Considerations

1. **H2 DB storage:** API keys are stored in the H2 database file (`~/.agentic/db/agentic_db`). The H2 file is local-only and password-protected (`sa/agentic123`).
2. **GET masking:** All GET responses mask secret values. Only `****last4` is shown.
3. **PUT only:** API keys can only be set via PUT (not retrieved in full).
4. **No logging:** LangchainEngineService must never log the API key.
5. **No exposure in SSE:** API key errors are shown as "API Key not configured" (not the key itself).
6. **Future improvement:** Consider encrypting values at rest with a derived key. Not in scope for v1.

---

## 9. Files to Create

| File | Type |
|------|------|
| `backend/src/main/java/.../model/AppConfig.java` | JPA Entity |
| `backend/src/main/java/.../repository/AppConfigRepository.java` | JPA Repository |
| `backend/src/main/java/.../service/AppConfigService.java` | Service |
| `backend/src/main/java/.../service/LangchainEngineService.java` | Service |
| `backend/src/main/java/.../controller/AppConfigController.java` | REST Controller |
| `backend/src/main/java/.../config/AppConfigSeedLoader.java` | Startup Seeder |

## 10. Files to Modify

| File | Change |
|------|--------|
| `backend/pom.xml` | Add langchain4j dependencies |
| `backend/.../model/PipelineStep.java` | Add `engine`, `llmProvider`, `llmModel` columns |
| `backend/.../model/PipelineRunStep.java` | Add `engine`, `llmProvider`, `llmModel` columns |
| `backend/.../service/PipelineStepService.java` | Add `resolveEngine()`, `executeLangchainStep()`, modify `executeStep()` |
| `backend/.../service/PipelineRunService.java` | Snapshot new fields in `createRun()` |
| `desktop-angular/src/app/services/api.service.ts` | Add AppConfig interface, API methods, PipelineStep fields |
| `desktop-angular/src/app/screens/config/config.component.ts` | Add AI Engine menu + config form |
| `desktop-angular/src/app/components/step-settings-dialog/step-settings-dialog.component.ts` | Add engine/provider/model fields |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| langchain4j API changes between beta and stable | Pin version, test before upgrading |
| Token-by-token SSE may flood frontend with events | Langchain4j token emission is typically 20-50 tokens/sec, similar to CLI output rate. No issue expected. |
| No process to kill for stop pipeline | Use `stoppedPipelines` flag + check in onToken callback. Investigate HTTP connection close for forced cancellation. |
| API keys in H2 database | Local-only DB, masked in API. Document security implication. |
| Default engine change could break existing workflows | `resolveEngine()` logic ensures CLI steps keep using CLI. Only NEW steps without explicit CLI default to langchain. |
| Multiple StreamingChatModel instances | Create model per-request (lightweight). Consider caching model instances per provider+key combo for performance. |
