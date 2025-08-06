#!/bin/bash

# Stop on error
set -e

echo "📦 Build des images des microservices..."

docker build -t nathanlamyy/produit-service ./produit-service
docker build -t nathanlamyy/vente-service ./vente-service
docker build -t nathanlamyy/stock-service ./stock-service
docker build -t nathanlamyy/reporting-service ./reporting-service
docker build -t nathanlamyy/boutique-service ./boutique-service
docker build -t nathanlamyy/orchestrateur-saga-service ./orchestrateur-saga-service

echo "🚀 Démarrage de l'infrastructure microservices..."

docker compose -f docker-compose.microservices.yml up -d --build

echo "⏳ Attente du démarrage des bases de données..."
sleep 5  # Ajustez si nécessaire pour laisser le temps aux services de démarrer

echo "📂 Exécution des migrations Prisma en mode production..."

echo "📂 Prisma migrate + seed pour chaque service..."

echo "🔧 produit-service"
docker exec -i produit-service npx prisma migrate deploy || true
docker exec -i produit-service npx prisma db seed || true

echo "🔧 vente-service"
docker exec -i vente-service npx prisma migrate deploy || true
docker exec -i vente-service npx prisma db seed || true

echo "🔧 stock-service"
docker exec -i stock-service npx prisma migrate deploy || true
docker exec -i stock-service npx prisma db seed || true

echo "🔧 reporting-service"
docker exec -i reporting-service npx prisma migrate deploy || true
docker exec -i reporting-service npx prisma db seed || true

echo "🔧 boutique-service"
docker exec -i boutique-service npx prisma migrate deploy || true
docker exec -i boutique-service npx prisma db seed || true

echo "🔧 orchestrateur-saga-service"
docker exec -i orchestrateur-saga-service npx prisma migrate deploy || true

echo "✅ Déploiement en production terminé avec succès !"

echo ""
read -p "✅ Script terminé. Appuie sur Entrée pour quitter..."

