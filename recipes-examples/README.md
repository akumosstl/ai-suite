```bash
curl -X POST http://localhost:1488/api/recipes/execute-from-path -H "Content-Type: application/json" -d "{\"path\":\"C:/Users/USER/projects/github/ai-suite/recipes-examples/only-project.yml\"}" | python -m json.tool

curl http://localhost:1488/api/recipes/174 | python -m json.tool

curl http://localhost:1488/api/recipes/174/tasks | python -m json.tool

```
