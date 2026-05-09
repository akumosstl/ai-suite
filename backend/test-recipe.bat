@echo off
REM Test Recipe Execution - Windows CMD curl examples
REM Usage: test-recipe.bat

echo ============================================
echo 1. Execute Recipe from Raw YAML (Simples!)
echo ============================================
curl -X POST http://localhost:1488/api/recipes/execute-raw -H "Content-Type: application/json" --data-binary @test-recipe.yml
echo.

echo ============================================
echo 2. Execute with Parameters
echo ============================================
curl -X POST "http://localhost:1488/api/recipes/execute-raw?parameters=%%7B%%22env%%22%%3A%%22production%%22%%7D" -H "Content-Type: application/json" --data-binary @test-recipe.yml
echo.

echo ============================================
echo 3. Validate Recipe
echo ============================================
curl -X POST http://localhost:1488/api/recipes/validate -H "Content-Type: application/json" -d "{\"yaml\": \"recipe:\n  name: test\n  version: 1.0\ntasks: []\"}"
echo.

echo ============================================
echo 4. List Recipes
echo ============================================
curl -X GET http://localhost:1488/api/recipes
echo.

pause