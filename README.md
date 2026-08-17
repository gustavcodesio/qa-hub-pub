# QA Hub

Site interno para documentar e validar QA dos mini-apps (substitui o Notion por app).

## Como rodar

```bash
cd qa-hub
npm install
npm run dev
```

- UI: http://localhost:5173
- API: http://127.0.0.1:5174

Dados em `data/db.json`. Prints e vídeos em `public/uploads/`.

## Stack

React + Vite, Tailwind, React Hook Form + Zod, TanStack Query, Express, Vitest.

## Testes

```bash
npm test
```
