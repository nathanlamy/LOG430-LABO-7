# Étape 1 : Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2 : Production
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Génère les fichiers Prisma client
RUN npx prisma generate

CMD ["node", "dist/main"]
