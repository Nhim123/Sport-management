# Arena API – ảnh Docker cho production (Render, VPS, Cloud Run…).
# Build:  docker build -t arena-api backend
# Chạy:   docker run -e DATABASE_URL=postgresql://… -e DIRECT_URL=postgresql://… -e CORS_ORIGIN=https://admin.example.com -p 4000:4000 arena-api

# ---- Giai đoạn build: cài đủ thư viện, sinh Prisma client, biên dịch TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build && npm prune --omit=dev

# ---- Giai đoạn chạy: chỉ giữ code đã biên dịch + thư viện cần cho production ----
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 4000
# Áp các migration chưa chạy rồi mới mở API (an toàn khi chạy lại – migration đã áp sẽ bỏ qua)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
