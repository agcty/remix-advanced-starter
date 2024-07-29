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
