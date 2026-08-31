FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install structlog
RUN pip install asyncpg

# The source code is mounted at runtime via docker-compose
# We just copy the monolith main.py
COPY src/ /app/src/

CMD ["python", "src/main.py"]
