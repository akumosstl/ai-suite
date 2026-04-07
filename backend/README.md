mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

## API Documentation (Swagger)

After starting the backend, access the Swagger UI at:

    http://localhost:8080/swagger-ui.html

This provides interactive API docs for all controllers.
