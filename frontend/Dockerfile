# =========================
# Build stage
# =========================
FROM node:20-bookworm-slim AS builder

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
FROM node:20-bookworm-slim

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN groupadd --system appuser && \
    useradd --system --gid appuser appuser

# Give ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 3000

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
