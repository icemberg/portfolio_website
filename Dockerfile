# Stage 1: Build React Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/react
COPY react/package*.json ./
RUN npm install
COPY react/ ./
RUN npm run build

# Stage 2: Build Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build-backend
WORKDIR /app/spring-boot

# Copy pom.xml and download dependencies to optimize caching
COPY spring-boot/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY spring-boot/src ./src

# Create static directory if it doesn't exist and copy frontend dist
RUN mkdir -p src/main/resources/static
COPY --from=build-frontend /app/react/dist/ ./src/main/resources/static/

# Build the final JAR, skipping tests for speed
RUN mvn clean package -DskipTests -B

# Stage 3: Final Runtime Image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Non-root user for security (Production best practice)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from build stage
COPY --from=build-backend /app/spring-boot/target/*.jar app.jar

# Expose port (defaulting to 8080 or the one from env)
EXPOSE 8080

# Run the backend with the production profile enabled
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
