# =========================
# Build stage
# =========================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production files
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Create non-root user (safe for Alpine)
RUN addgroup -S appuser && adduser -S appuser -G appuser

USER appuser

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
