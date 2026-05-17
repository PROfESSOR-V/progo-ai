# Stage 1: Build the Java backend
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app/backend
# Copy pom.xml and src to build
COPY pom.xml ./
COPY src ./src
# Build the Spring Boot application
RUN mvn clean package -DskipTests

# Stage 2: Setup Python and Java runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Python, Pip, and venv
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Create virtual environment and install dependencies
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python scripts and data directory
COPY *.py ./
# Create data dir if not exists (or copy if exists)
RUN mkdir -p data
# Copy data directory (it might contain initial structure if we moved it)
COPY data/ ./data/

# Copy Java built artifact from stage 1
COPY --from=build /app/backend/target/*.jar backend.jar

# Setup environment variables for application.properties
ENV RAG_PYTHON_PATH=$VIRTUAL_ENV/bin/python3
ENV RAG_SCRIPT_PATH=/app/main.py
ENV RAG_DATA_DIR=/app/data
# Render sets the PORT env variable automatically, defaults to 10000
ENV PORT=10000

# Expose port (Render ignores EXPOSE but it's good practice)
EXPOSE 10000

# Entrypoint passing Render's PORT to Spring Boot
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} -jar backend.jar"]
