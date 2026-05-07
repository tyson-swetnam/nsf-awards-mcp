# Multi-stage Dockerfile for NSF Awards MCP Server
# Supports both TypeScript (current) and Go (future migration)

# =============================================================================
# Stage 1: TypeScript Builder
# =============================================================================
FROM node:18-alpine AS ts-builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files for dependency caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development && \
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build && \
    npm run type-check

# Run tests to ensure build quality
RUN npm test

# =============================================================================
# Stage 2: Go Builder (prepared for future migration)
# =============================================================================
FROM golang:1.21-alpine AS go-builder

# Set working directory
WORKDIR /app

# Install dependencies for potential Go build
RUN apk add --no-cache \
    git \
    ca-certificates

# Copy go.mod and go.sum if they exist (future migration)
# COPY go.mod go.sum ./
# RUN go mod download

# Copy Go source code (future migration)
# COPY go/ ./
# RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o nsf-awards-mcp ./cmd/server

# For now, copy the built TypeScript as fallback
COPY --from=ts-builder /app/build ./build
COPY --from=ts-builder /app/node_modules ./node_modules
COPY --from=ts-builder /app/package.json ./

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:18-alpine AS runtime

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nsf && \
    adduser -S nsf -u 1001 -G nsf

# Install runtime dependencies only
RUN apk add --no-cache \
    ca-certificates \
    dumb-init \
    curl

# Copy built application from builder stage
COPY --from=ts-builder /app/build ./build
COPY --from=ts-builder /app/node_modules ./node_modules
COPY --from=ts-builder /app/package.json ./

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R nsf:nsf /app

# Switch to non-root user
USER nsf

# Expose health check endpoint (for future web interface)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the MCP server
CMD ["node", "build/index.js"]

# =============================================================================
# Metadata
# =============================================================================
LABEL maintainer="NSF Awards MCP Server"
LABEL version="1.0.0"
LABEL description="MCP server for NSF Awards API integration"
LABEL org.opencontainers.image.source="https://github.com/user/nsf-awards-mcp"
LABEL org.opencontainers.image.documentation="https://github.com/user/nsf-awards-mcp/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.version=$VERSION