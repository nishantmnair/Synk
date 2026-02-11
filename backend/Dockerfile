FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install system dependencies in single layer (reduces image size)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better layer caching)
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY manage.py /app/
COPY api /app/api
COPY synk_backend /app/synk_backend
COPY entrypoint.sh /app/entrypoint.sh

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Create non-root user for security (prevent container escape privilege escalation)
RUN useradd -m -u 1000 -s /bin/bash appuser && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]

# Default command (can be overridden in docker-compose.yml)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "synk_backend.asgi:application"]
