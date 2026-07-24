# Мой Дашборд

Персональный дашборд для iPhone — трекер финансов, целей и привычек. Работает как PWA (устанавливается на домашний экран).

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + тёмная тема
- Radix UI / shadcn-совместимые компоненты
- Recharts — графики
- Claude Haiku — AI-сканирование чеков
- localStorage — хранение данных (без бэкенда)

## Запуск

```bash
cp .env.example .env.local
# вставь ANTHROPIC_API_KEY в .env.local
npm install
npm run dev
```

Открой http://localhost:3000

## Деплой

Смотри [GUIDE.md](./GUIDE.md) — пошаговый гайд на русском для деплоя на Vercel и установки на iPhone.
