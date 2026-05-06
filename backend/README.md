mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

## API Documentation (Swagger)

After starting the backend, access the Swagger UI at:

http://localhost:8080/swagger-ui.html

This provides interactive API docs for all controllers.


mvnDebug clean install
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

java -Dspring.profiles.active=local -jar target\backend-3.5.0.jar

java -Dspring.profiles.active=local -Dspring.aot.enabled=true -jar target\backend-3.5.0.jar

mvn clean spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.aot.enabled=true -Dspring.profiles.active=local"

mvn clean spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local --spring.aot.enabled=true"

## GraalVM Native Image

### Building the native image

```bash
cd backend
mvn -Pnative native:compile
```

The executable will be generated in `target/`.

### GraalVM Tracing Agent

If you encounter reflection/serialization errors at runtime (e.g., `Cannot construct instance of...` or `No serializer found for class...`), it means the native image is missing reflection metadata for classes used dynamically by Jackson or other libraries.

The **GraalVM Tracing Agent** captures all reflection, serialization, proxy, and resource accesses at runtime and generates the required native-image configuration files automatically.

#### Step 1: Run with the tracing agent

```bash
cd backend
mvn -Pnative -Dagent=true spring-boot:run
```

This starts the app with the GraalVM tracing agent attached. The agent records all reflection accesses into `target/native/agent-output/`.

#### Step 2: Exercise the application

While the app is running, make requests to **all** endpoints you want to support in the native image, especially:

- **MCP endpoint**: Send `initialize`, `tools/list`, and `tools/call` requests to `/mcp`
- **REST API**: Hit all CRUD endpoints (`/api/agents`, `/api/pipelines`, etc.)
- **Swagger UI**: Browse `http://localhost:8080/swagger-ui.html`

Example MCP test requests:

```bash
# Initialize
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List tools
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"project-list","arguments":{}}}'
```

#### Step 3: Stop the application

Shut down the app gracefully (Ctrl+C). The agent flushes its recorded data on shutdown.

#### Step 4: Copy generated config files

```bash
cp target/native/agent-output/main/reflect-config.json src/main/resources/META-INF/native-image/reflect-config.json
cp target/native/agent-output/main/jni-config.json src/main/resources/META-INF/native-image/jni-config.json 2>nul
cp target/native/agent-output/main/proxy-config.json src/main/resources/META-INF/native-image/proxy-config.json 2>nul
cp target/native/agent-output/main/resource-config.json src/main/resources/META-INF/native-image/resource-config.json 2>nul
cp target/native/agent-output/main/serialization-config.json src/main/resources/META-INF/native-image/serialization-config.json 2>nul
```

#### Step 5: Rebuild the native image

```bash
mvn -Pnative native:compile
```

### Manual reflection registration

As an alternative to the tracing agent, classes can be registered via `@RegisterReflectionForBinding` in `NativeImageReflectionConfig.java`. This is already configured for MCP SDK and JPA entity classes. If you add new classes that need reflection (e.g., new MCP tool response types), add them to the `@RegisterReflectionForBinding` annotation in:

```
src/main/java/io/github/akumosstl/agentic/backend/config/NativeImageReflectionConfig.java
```

### Troubleshooting native image errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot construct instance of...` | Class not registered for reflection | Add to `@RegisterReflectionForBinding` or re-run tracing agent |
| `No serializer found for class...` | Class not registered for serialization | Add to `@RegisterReflectionForBinding` or add `SerializationFeature.FAIL_ON_EMPTY_BEANS` disabled |
| `ClassNotFoundException` at runtime | Class not included in image | Check `--allow-incomplete-classpath` in `native-image.properties` or add the dependency |
| MCP endpoints return 500 | MCP SDK classes missing reflection | Ensure all `McpSchema$*` and `McpError` classes are registered |