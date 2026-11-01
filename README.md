# GrandRP — Fly.io Deployment

Полноценный бэкенд (Hono + Bun + SQLite) на бесплатном тарифе Fly.io.

## 🚀 Быстрый старт

### 1. Установи Fly CLI
```powershell
# PowerShell (от админа)
iwr https://fly.io/install.ps1 -useb | iex
# или: winget install Flyio.CLI
```

### 2. Авторизуйся
```bash
fly auth login
# откроется браузер → логин → вернись в терминал
```

### 3. Инициализируй приложение (в папке проекта)
```bash
cd /d/Desktop/grandrp
fly launch --no-deploy
# - Name: grandrp (или своё)
# - Region: fra (Frankfurt)
# - Postgres: No (у нас SQLite на volume)
# - Redis: No
# - Deploy now: No
```

### 4. Создай persistent volume для БД (3 GB бесплатно)
```bash
fly volumes create grandrp_data --region fra --size 3
```

### 5. Деплой
```bash
fly deploy
```

### 6. Привяжи домен `grandrp.l.cd`
```bash
fly certs add grandrp.l.cd
fly certs check grandrp.l.cd
```
Добавь в DNS (у регистратора `l.cd`):
```
Type: CNAME
Name: @ (или grandrp)
Value: grandrp.fly.dev
```
Подожди 1-5 мин — SSL выдастся автоматически (Let's Encrypt).

---

## 🛠 Локальная разработка

```bash
# Установи Bun (если нет)
irm https://bun.sh/install.ps1 | iex

cd /d/Desktop/grandrp
bun install
bun run db:init   # создаст data/app.db
bun run dev       # http://localhost:8080
```

## 📦 Структура
```
grandrp/
├── Dockerfile          # Multi-stage Bun образ
├── fly.toml            # Fly.io конфиг
├── package.json        # deps: hono, better-sqlite3
├── tsconfig.json
├── src/
│   ├── index.ts        # HTTP сервер + API routes
│   └── db/
│       ├── index.ts    # DB connection + helpers
│       └── init.ts     # Схема таблиц
└── data/               # SQLite файл (на Fly volume)
```

## 🔐 Секреты (не коммить в git!)
```bash
fly secrets set JWT_SECRET="super-secret-key"
fly secrets set API_KEY="xxx"
# Переменные доступны в process.env
```

## 📊 Мониторинг
```bash
fly logs          # логи в реальном времени
fly status        # статус машины
fly ssh console   # зайти в контейнер
fly dashboard     # открыть веб-панель
```

## 💰 Бесплатные лимиты Fly.io
- 3 VM (shared-cpu-1x, 256 MB RAM)
- 3 GB persistent volumes
- 160 GB исходящего трафика/мес
- Бесплатные TLS сертификаты
- Кастомные домены

---

## 🆘 Если что-то не работает

| Проблема | Решение |
|----------|---------|
| `fly deploy` висит | `fly apps destroy grandrp` → `fly launch` заново |
| БД не сохраняется | Проверь `fly volumes list` — volume должен быть attached |
| Домен не работает | `fly certs check grandrp.l.cd` → жди DNS propagation |
| Out of memory | Упрости код, убери лишние deps, или добавь swap в Dockerfile |

---

Made with ❤️ for **grandrp.l.cd**