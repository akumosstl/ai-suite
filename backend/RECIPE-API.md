# Recipe Execution API

## Overview

This API allows you to execute recipes (YAML workflow definitions) directly, without needing to convert them to JSON first.

## Key Features

1. **Direct YAML Execution**: Send YAML files directly - no need for JSON conversion
2. **Duplicate Prevention**: Automatically skips creation of existing agents, scripts, and projects (by name)
3. **Simple Parameters**: Optional parameters via query string

## Endpoint: POST /api/recipes/execute-raw

### Basic Usage

```bash
# Linux/Mac
curl -X POST http://localhost:1488/api/recipes/execute-raw \
  -H "Content-Type: application/json" \
  --data-binary @test-recipe.yml

# Windows PowerShell
curl -X POST http://localhost:1488/api/recipes/execute-raw \
  -H "Content-Type: application/json" \
  --data-binary @test-recipe.yml

# Windows CMD
curl -X POST http://localhost:1488/api/recipes/execute-raw -H "Content-Type: application/json" --data-binary @test-recipe.yml
```

### With Parameters

```bash
# URL-encoded JSON in query parameter
curl -X POST "http://localhost:1488/api/recipes/execute-raw?parameters=%7B%22env%22%3A%22development%22%7D" \
  -H "Content-Type: application/json" \
  --data-binary @test-recipe.yml
```

### Python Example

```python
import requests
import json

with open('test-recipe.yml', 'r') as f:
    yaml_content = f.read()

params = {"env": "development", "version": "1.0"}
response = requests.post(
    'http://localhost:1488/api/recipes/execute-raw',
    headers={'Content-Type': 'application/json'},
    data=yaml_content,
    params={'parameters': json.dumps(params)}
)
print(response.json())
```

## Duplicate Handling

When executing a recipe:

- **Agent**: If an agent with the same `name` + `namespace` exists, it returns the existing one (no duplicate created)
- **Script**: If a script with the same `name` + `namespace` exists, it returns the existing one (no duplicate created)
- **Project**: If a project with the same `name` exists, it returns the existing one (no duplicate created)

This ensures idempotent recipe execution - you can run the same recipe multiple times safely.

## Example Recipe

```yaml
recipe:
  name: My Recipe
  version: "1.0"
  description: Example recipe

tasks:
  - id: create-agent
    type: create
    resource: agent
    ref: agent1
    agent:
      name: Test Agent
      namespace: test
      description: A test agent

  - id: create-project
    type: create
    resource: project
    ref: project1
    project:
      name: Test Project
      description: A test project
```

## Response

Success response returns the created Recipe object:

```json
{
  "id": 1,
  "name": "My Recipe",
  "version": "1.0",
  "status": "running",
  "createdAt": "2026-05-08T22:00:00.000+00:00"
}
```

Error response:

```json
{
  "error": "Error message here"
}
```

## Other Endpoints

### Validate Recipe (POST /api/recipes/validate)

```bash
curl -X POST http://localhost:1488/api/recipes/validate \
  -H "Content-Type: application/json" \
  -d '{"yaml": "recipe:\n  name: test\n  version: 1.0\ntasks: []"}'
```

### Execute from JSON (POST /api/recipes/execute)

Original endpoint requiring JSON body with escaped YAML:

```bash
curl -X POST http://localhost:1488/api/recipes/execute \
  -H "Content-Type: application/json" \
  -d '{"yaml": "recipe:\n  name: test\n  version: 1.0\ntasks: []"}'
```
