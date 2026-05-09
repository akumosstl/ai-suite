curl -X POST "http://localhost:1488/api/recipes/execute-raw?parameters=%7B%22env%22%3A%22development%22%7D" \
  -H "Content-Type: text/yaml" \
  -d @test-recipe.yml