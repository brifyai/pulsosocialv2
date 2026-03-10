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

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]