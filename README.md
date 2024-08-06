# Remix Starter

This is a starter project for Remix. It includes a few common configurations that you might want to use in your own projects.

## Features

- **Remix Vite** - This project is built with Remix, a new web framework for React.
- **TypeScript** - This project is built with TypeScript.
- **ESLint** - This project is configured with ESLint.
- **Prettier** - This project is configured with Prettier.
- **Prisma** - This project is configured with Prisma.
- **Tailwind CSS** - This project is configured with Tailwind CSS.
- **Ethereum Authentication** - This project is configured with Ethereum Authentication.
- **Remix Flat Routes** - This project is configured with Flat Routes.

## Local Testing

Run the following commands in project root:

```bash
docker build -t remix-vite:latest -f other/Dockerfile .
docker run -it --rm -p 3000:3000 --env-file .env -v ./sqlite.db:/app/sqlite.db remix-vite:latest
```

## Deploy to fly directly

From project root

```bash
    fly deploy --dockerfile other/Dockerfile --remote-only # in case you want to deploy a specific Dockerfile
    # but we already have a toml file defined with the Dockerfile already set
    fly deploy
```

## Launch local postgres database

```bash
docker run -d \
  -e POSTGRES_DB=testdb \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpass \
  -p 5432:5432 \
  postgres:16-alpine

docker run \
  -e POSTGRES_DB=testdb \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpass \
  -p 5432:5432 \
  postgres:16-alpine
```

## Debug docker locally

```bash
export SENTRY_AUTH_TOKEN="" export BUILDKIT_PROGRESS=plain
DOCKER_BUILDKIT=1 docker build --no-cache \
  --build-arg COMMIT_SHA=$(git rev-parse HEAD) \
  --build-arg SENTRY_ORG=headly \
  --build-arg SENTRY_PROJECT=remix-vite-test \
  --secret id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
  -f other/Dockerfile \
  .
```
