# Build stage
FROM node:18-alpine AS builder

# Install Python and build tools required for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application files
COPY . .

# Build the application with environment variables
# Easypanel passes REACT_APP_* variables, we need to map them to VITE_* for Vite
ARG VITE_CONVEX_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY

# Set environment variables for Vite build
# Map REACT_APP_* to VITE_* if VITE_* is not provided
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL:-""}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-${REACT_APP_SUPABASE_URL:-""}}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-${REACT_APP_SUPABASE_ANON_KEY:-""}}

# Debug: Print environment variables during build
RUN echo "=== Build Environment ==="
RUN echo "VITE_CONVEX_URL: $VITE_CONVEX_URL"
RUN echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
RUN echo "VITE_SUPABASE_ANON_KEY length: ${#VITE_SUPABASE_ANON_KEY}"

RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache gettext

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Create script for runtime env injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use entrypoint script for runtime env injection
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]