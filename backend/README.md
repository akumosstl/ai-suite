mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

## API Documentation (Swagger)

After starting the backend, access the Swagger UI at:

    http://localhost:8080/swagger-ui.html

This provides interactive API docs for all controllers.


mvnDebug clean install
mvn spring-boot:run  -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

java -Dspring.profiles.active=local -jar target\backend-3.5.0.jar

java -Dspring.profiles.active=local -Dspring.aot.enabled=true -jar target\backend-3.5.0.jar

mvn clean spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.aot.enabled=true -Dspring.profiles.active=local"

mvn clean spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local --spring.aot.enabled=true"