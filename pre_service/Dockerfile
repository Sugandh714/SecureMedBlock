FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    libgmp-dev \
    libssl-dev \
    flex \
    bison \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir charm-crypto umbral flask

WORKDIR /app
COPY . .

EXPOSE 5001
CMD ["python", "pre_service.py"]