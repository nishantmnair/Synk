FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Install bash (needed for entrypoint)
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Copy project files (excluding entrypoint.sh for now)
COPY requirements.txt /app/
COPY manage.py /app/
COPY api /app/api
COPY synk_backend /app/synk_backend

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Use entrypoint script with explicit bash
ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]

# Default command (can be overridden in docker-compose.yml)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "synk_backend.asgi:application"]
