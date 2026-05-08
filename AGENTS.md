# AGENTS.md

# SYNCHRONIZATION ROUTINE

At the start of every session, read the .opencode-context file to understand the current progress and the technologies used (Spring/Angular).
After every successful implementation, update the 'Estado Atual' (Current State) and 'Próximos Passos' (Next Steps) sections in the .opencode-context file.
If there are any changes to the H2 database schema, remind me to update the initialization .sql files.

## Project Overview

This is a hybrid project with:
- **Backend**: Java Spring Boot (Maven) in `backend/`
- **Frontend**: Angular TypeScript in `desktop-angular/`

## Build Commands

### Backend (Java/Spring Boot)
```bash
# Build backend
cd backend
mvn clean install

# Run Spring Boot application
mvn spring-boot:run
```

### Frontend (Angular)
```bash
# Build frontend
cd desktop-angular
npm run build

# Development server with hot reload
npm start
```

## Test Commands

### Backend Tests
```bash
cd backend

# Run all tests
mvn test

# Run single test class
mvn test -Dtest=AgentServiceTest

# Run single test method
mvn test -Dtest=AgentServiceTest#testCreateAgent
```

### Frontend Tests (Vitest)
```bash
cd desktop-angular

# Run all tests
npm test

# Run tests matching pattern (Vitest)
npm test -- --filter="App"

# Run tests in watch mode (default)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run single test file
npm test -- runpipelines.component.spec.ts

# Run tests matching name pattern
npm test -- -t "should create"

# List available tests
npm test -- --list-tests
```

## Lint Commands

### Frontend Linting
```bash
cd desktop-angular

# Run Angular lint
ng lint

# Check formatting with Prettier
npx prettier --check "src/**/*.ts"
```

### Backend Linting
- Use Maven Checkstyle plugin or IDE-integrated linting (Eclipse/IntelliJ)
- No explicit lint script configured

## Code Style Guidelines

### TypeScript/Angular
- **Indentation**: 2 spaces (see `.editorconfig`)
- **Quotes**: Single quotes for strings
- **Semicolons**: No semicolons at end of statements
- **File naming**: `kebab-case` (e.g., `menu.component.ts`)
- **Component naming**: PascalCase class names, kebab-case file names
- **Imports**: Group imports by type (Angular, third-party, local), alphabetical within groups
- **Formatting**: Prettier configured with `printWidth: 100`, `singleQuote: true`
- **Final newline**: Always insert a final newline and trim trailing whitespace

### TypeScript Best Practices
- Use strict mode (`strict: true` in tsconfig)
- Prefer interfaces over types for object shapes
- Use `readonly` for immutable arrays/objects
- Avoid `any` - use proper typing or `unknown` with type guards
- Use arrow functions for callbacks, explicit `function` for methods

### Error Handling (TypeScript/Angular)
- Use try-catch for sync operations, catchError for observables
- Prefer typed errors over generic exceptions
- Log errors with console.error (not console.log)
- Always return a fallback value in catchError for graceful degradation
- Handle HTTP errors in services, display user-friendly messages in components

### Java
- **Indentation**: 4 spaces (standard Java convention)
- **Naming**: PascalCase for classes, camelCase for methods/variables
- **File naming**: PascalCase matching class name (e.g., `AgentController.java`)
- **Java version**: 21 (configured in Maven compiler plugin)
- **Comments**: Use Javadoc style for public APIs
- **Braces**: Same-line opening braces for methods/classes
- **Null handling**: Prefer Optional for return types, use @Nullable annotations sparingly

### SCSS
- **File naming**: `kebab-case` (e.g., `app.scss`)
- **Nesting**: Use nested selectors for component styles (max 3 levels deep)
- **Variables**: Define in shared files or component-level
- **Mixins**: Use for reusable style patterns
- **Avoid**: Deep nesting, !important, magic numbers

### Assets
- **Naming**: lowercase, hyphens for spaces (e.g., `default.fnt`, `uiskin.atlas`)
- **Location**: Place in `public/` directory for Angular, `src/main/resources/` for backend

## Architecture Patterns

### Angular Frontend
- **Standalone components** for UI and logic separation (no NgModules unless needed)
- **Service classes** for backend communication (e.g., `ApiService`)
- **Dependency injection**: Use constructor injection with `inject()` function for signals support
- **Signals**: Use Angular Signals for reactive state management (Angular 16+)
- **Routing**: Lazy loading for feature routes
- **SCSS** for styling with component encapsulation

### Spring Boot Backend
- **MVC pattern**: Controller → Service → Repository layers
- **REST API**: JSON responses with Gson
- **JPA/Hibernate**: Data persistence with H2 database
- **Spring Boot**: Auto-configuration and embedded server

## Important Notes

### Proxy Configuration
- Angular dev server proxies `/api` requests to `http://localhost:8080`
- Configured in `proxy.conf.json`

### Database
- H2 in-memory database for development
- H2 console available at `http://localhost:8080/h2-console`

### API Endpoints
- Primary: `/api/agents` for agent management
- Legacy: `/api/events` for event system

## Testing Frameworks
- **Backend**: JUnit 5 (via Spring Boot Starter Test)
- **Frontend**: Vitest (configured in Angular 21+, uses jsdom)

## Additional Best Practices

- Keep frontend and backend code separated by module/folder
- Document new components/services with JSDoc or JavaDoc style comments
- Use Angular CLI for scaffolding new components/services (`ng generate component ...`)
- Keep configuration files (e.g., `angular.json`, `application.properties`) organized and versioned
- Use TypeScript strict mode and Angular strict templates for better type safety
- Prefer standalone components over NgModule-based architecture
- Use Angular services for API communication and state management
- Follow RESTful API conventions for backend endpoints
- Use Git hooks (husky) for pre-commit checks if needed

## Common Issues
- Backend must be running on port 8080 for Angular proxy to work
- Check CORS configuration if frontend cannot reach backend
- Angular tests run in Node.js with jsdom by default

## Code Quality
- TypeScript strict mode enabled
- Angular strict templates and injection parameters
- No explicit linting for Java beyond IDE integration

## Project

**Project: Agentic Code Pipeline Execution System**

A hybrid pipeline execution system with Server-Sent Events (SSE) for real-time updates and polling fallback, built on a Java Spring Boot backend and Angular frontend.

**Core Value:** Reliable, observable pipeline execution with near real-time status updates and clear error propagation.
