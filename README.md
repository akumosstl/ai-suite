mvn clean install -U 


# Agentic - AI Pipeline Execution System

mvn -Pnative spring-boot:process-aot


mvn -Pnative clean package -DskipTests

java -Dspring.aot.enabled=true -jar target/my-app.jar

A hybrid pipeline execution system with Server-Sent Events (SSE) for real-time updates and polling fallback, built on a Java Spring Boot backend and Angular frontend.

## Prerequisites

- **Java**: JDK 21+
- **Maven**: 3.9+
- **Node.js**: 20+
- **npm**: 10+
- **GraalVM** (optional, for native compilation): 21+

## Running the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`.

## Running the Frontend

```bash
cd desktop-angular
npm install
npm start
```

The frontend starts on `http://localhost:4200`.

## Building the Project

### Backend

```bash
cd backend
mvn clean install
```

### Frontend

```bash
cd desktop-angular
npm run build
```

## Compiling Backend to .exe

### Option 1: Using Launch4j (Recommended - JAR-based)

This method wraps the Spring Boot JAR into a Windows executable. It requires Java to be installed on the target machine.

```bash
cd backend
mvn package
```

The executable will be created at `target/backend.exe`.

### Option 2: Using GraalVM Native Image (Native Compile)

This method compiles the application to a standalone native executable (no JVM required at runtime).

**Prerequisites:**
1. Install [GraalVM for JDK 21](https://www.graalvm.org/downloads/)
2. Set `GRAALVM_HOME` environment variable
3. Install native-image component:
   ```bash
   gu install native-image
   ```

**Build native executable:**

```bash
cd backend
mvn -Pnative native:build spring-boot:process-aot
```
./mvnw -Pnative native:compile

mvn -Pnative package -DskipTests

java -jar backend/target/backend-3.5.0.jar

The native executable will be created at `target/backend`.

**To generate Windows .exe:**

```bash
cd backend
mvn -Pnative native:build@windows
```

Or rename the generated binary:
```bash
mv target/backend target/backend.exe
```

## Running as .exe

### Launch4j .exe

After building with Launch4j, run the executable:

```bash
backend\target\backend.exe
```

### GraalVM Native .exe

Run the native executable directly:

```bash
backend\target\backend.exe
```

Note: Native executables start significantly faster than JAR-based executables but have longer build times.

## Additional Commands

### Backend Tests

```bash
cd backend
mvn test
```

### Frontend Tests

```bash
cd desktop-angular
npm test
```

## MCP Server (opencode)

Add this to your `opencode.json` to connect opencode to the Agentic MCP server:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "agentic-mcp": {
      "type": "remote",
      "url": "http://localhost:1488/mcp",
      "enabled": true
    }
  }
}
```

The MCP server exposes 67 tools for managing projects, pipelines, agents, scripts, instructions, targets, templates, and system operations. It is enabled by default when `mcp.enabled=true` in `application.properties`.

### MCP Usage Examples

**Example 1 — Check how many pipelines are currently running:**

```
@list_all_pipeline_runs
```

Returns all pipeline runs across every project. Filter the results by `"status": "running"` to see which pipelines are actively executing. To get detailed step-by-step results for a specific run:

```
@get_pipeline_run id=3
```

**Example 2 — View project details with pipelines:**

```
@list_projects_with_pipelines
```

Returns every project along with its pipelines (names, statuses, step counts). For full details on a single project (agents, scripts, instructions):

```
@get_project id=1
```

## Version

2.0.0 - AI Pipeline Execution System

Release Date: 2026-04-24

## Documentation

User documentation is available in the [docs](docs/) folder. See [docs/README.md](docs/README.md) for the full index.


# recipe

```bash

curl -X POST http://localhost:8080/api/recipe-files -H "Content-Type: application/json" -d @test-recipe.json



curl -X POST http://localhost:1488/api/recipes/execute -H "Content-Type: application/json" -d "{\"yaml\": $(cat test-recipe.yml | jq -Rs .)}"


python -c "import json; print(json.dumps({'yaml': open('test-recipe.yml').read()}))" > body.json && curl -X POST http://localhost:1488/api/recipes/execute -H "Content-Type: application/json" -d @body.json

python -c "import json; print(json.dumps({'yaml': open('test-recipe.yml').read()}))" > body.json && curl -X POST http://localhost:1488/api/recipes/execute -H "Content-Type: application/json" -d @body.json
```