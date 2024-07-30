# Specify exact version for reproducibility
FROM node:20.11.1-bookworm-slim as base

# Use ARG for build-time variables
ARG PNPM_VERSION=9.5.0
ARG NODE_ENV=production

# Set environment variables
ENV NODE_ENV=$NODE_ENV

# Install pnpm and set workdir
RUN npm install -g pnpm@$PNPM_VERSION && \
    mkdir -p /app

WORKDIR /app

# Build stage
FROM base as build

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

# Use the following environment variables to configure Sentry
ARG SENTRY_ORG
ARG SENTRY_PROJECT

ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

# Install build dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    openssl \
    pkg-config \
    python-is-python3 \
    ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*


# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Mount the secret, set it as an environment variable, and run the build
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN) && \
    echo "SENTRY_AUTH_TOKEN is now set: $(if [ -n "$SENTRY_AUTH_TOKEN" ]; then echo 'Yes'; else echo 'No'; fi)" && \
    echo "SENTRY_ORG: $SENTRY_ORG" && \
    echo "SENTRY_PROJECT: $SENTRY_PROJECT" && \
    echo "COMMIT_SHA: $COMMIT_SHA" && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "PNPM version: $(pnpm --version)" && \
    # Set Sentry log level to debug
    # export SENTRY_LOG_LEVEL=debug && \
    # Run the build
    pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# Final stage
FROM base

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    openssl \
    sqlite3 && \
    rm -rf /var/lib/apt/lists/*

# Copy built application
COPY --from=build /app /app

EXPOSE 3000

CMD ["pnpm", "run", "start"]