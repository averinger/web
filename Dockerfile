# Fly.io оптимизированный образ на базе Bun (маленький, быстрый, есть SQLite)
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# Устанавливаем системные зависимости для better-sqlite3 (native bindings)
RUN apk add --no-cache python3 make g++ sqlite-libs

# --- Build stage ---
FROM base AS build
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src
RUN bun run build 2>/dev/null || true  # TypeScript компиляция (если нужна)

# --- Runtime stage ---
FROM oven/bun:1.1-alpine AS runtime
WORKDIR /app

# Копируем только production deps и скомпилированный код
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./

# Создаём папку для БД (volume смонтируется сюда)
RUN mkdir -p /app/data

# Non-root user для безопасности
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

ENV PORT=8080
ENV DB_PATH=/app/data/app.db
EXPOSE 8080

# Healthcheck для Fly.io (проверяет /health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["bun", "run", "src/index.ts"]