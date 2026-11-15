# Python Scientific Backend Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code
COPY backend /app/backend

# NASA JPL / NAIF ephemeris kernels
ENV SPICE_KERNEL_DIR=/app/backend/kernels

RUN mkdir -p "$SPICE_KERNEL_DIR" \
    && curl -fsSL --retry 3 \
      https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp \
      -o "$SPICE_KERNEL_DIR/de421.bsp" \
    && curl -fsSL --retry 3 \
      https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc \
      -o "$SPICE_KERNEL_DIR/pck00011.tpc" \
    && curl -fsSL --retry 3 \
      https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls \
      -o "$SPICE_KERNEL_DIR/naif0012.tls" \
    && test -s "$SPICE_KERNEL_DIR/de421.bsp" \
    && test -s "$SPICE_KERNEL_DIR/pck00011.tpc" \
    && test -s "$SPICE_KERNEL_DIR/naif0012.tls"

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
