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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3000

RUN ls -l ./dist

RUN npx prisma generate

EXPOSE 3000
CMD ["node", "dist/main.js"]
