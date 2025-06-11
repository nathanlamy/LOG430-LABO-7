#!/bin/bash

set -e

echo "Déploiement de l'image magasin-api depuis DockerHub..."

# Pull la dernière image
docker pull nathanlamyy/magasin-backend:latest

docker compose -f docker-compose.prod.yml down

docker compose -f docker-compose.prod.yml up -d

echo "Déploiement terminé. L’API est disponible sur http://10.194.32.204:3000"
