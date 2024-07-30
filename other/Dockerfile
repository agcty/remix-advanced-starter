# Specify exact version for reproducibility
FROM node:20.11.1-bookworm-slim as base

# Use ARG for build-time variables
ARG PNPM_VERSION=9.5.0
ARG NODE_ENV=production

# Set environment variables
ENV NODE_ENV=$NODE_ENV

# Install pnpm and set workdir
RUN npm install -g pnpm@$PNPM_VERSION && \
    mkdir -p /app && \
    chown -R node:node /app

WORKDIR /app

# Use non-root user
USER node

# Build stage
FROM base as build

USER root

# Install build dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    openssl \
    pkg-config \
    python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

USER node

# Copy package files and install dependencies
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY --chown=node:node . .

# Build application
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# Final stage
FROM base

USER root

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    openssl \
    sqlite3 && \
    rm -rf /var/lib/apt/lists/*

USER node

# Copy built application
COPY --from=build --chown=node:node /app /app

# TODO: Add healthcheck
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#     CMD node healthcheck.js

EXPOSE 3000

# CMD ["bash"]
CMD ["pnpm", "run", "start"]