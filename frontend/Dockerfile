FROM node:20-alpine AS builder

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend files
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8000

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder with correct permissions
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create tmp directories and configure nginx
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chmod 777 /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    mkdir -p /var/run/nginx && \
    chmod 777 /var/run/nginx && \
    # Update nginx main config to use custom pid location
    sed -i 's|pid        /run/nginx.pid;|pid        /var/run/nginx/nginx.pid;|g' /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Run as nginx user (non-root)
USER nginx

CMD ["nginx", "-g", "daemon off;"]
