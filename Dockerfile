# Stage 1: Build Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Download dependencies first for better caching
COPY spring-boot/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the JAR
COPY spring-boot/src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Final Runtime Image (Lean and Java-only)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy ONLY the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the default backend port
EXPOSE 8080

# Run the backend with production profile
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
