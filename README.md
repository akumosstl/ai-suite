# Agentic - AI Pipeline Execution System

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

## Notes

- The backend must be running on port 8080 for the Angular proxy to work
- The Angular dev server proxies `/api` requests to `http://localhost:8080`
- H2 console is available at `http://localhost:8080/h2-console`