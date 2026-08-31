FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 3003
HEALTHCHECK --interval=10s --timeout=5s CMD python -c "import httpx; httpx.get('http://localhost:3003/health')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3003"]