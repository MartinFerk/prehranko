FROM python:3.10-slim

# Posodobi pip in namesti sistemske knjižnice (samo kar rabiš)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Nastavi delovni direktorij
WORKDIR /app

# Kopiraj le nujne datoteke za install najprej (za boljši cache)
COPY requirements.txt .

# Namesti Python knjižnice
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Zdaj šele kopiraj preostalo aplikacijo (manj cache invalidacije)
COPY . .

# Expose port
EXPOSE 5000

# Zagon aplikacije
CMD ["python", "app.py"]
