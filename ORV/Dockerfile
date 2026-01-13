FROM python:3.10-slim

# Dodan 'mpich' za MPI podporo
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    mpich \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway ne uporablja nujno EXPOSE 5000,
# vendar je dobro za dokumentacijo
EXPOSE 5000

CMD ["python", "app.py"]