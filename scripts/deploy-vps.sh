#!/usr/bin/env bash

set -Eeuo pipefail

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  COMPOSE=(docker compose)
fi

services=("$@")

if [ "${#services[@]}" -eq 0 ]; then
  services=(api web)
fi

for service in "${services[@]}"; do
  if [ "$service" != "api" ] && [ "$service" != "web" ]; then
    echo "Servico invalido: $service. Use api, web ou ambos." >&2
    exit 1
  fi
done

echo "Construindo: ${services[*]}"
"${COMPOSE[@]}" build "${services[@]}"

echo "Build concluido. Recriando apenas os servicos atualizados..."
"${COMPOSE[@]}" stop "${services[@]}"
"${COMPOSE[@]}" rm -f "${services[@]}"
"${COMPOSE[@]}" up -d postgres redis

for service in api web; do
  for selected in "${services[@]}"; do
    if [ "$selected" = "$service" ]; then
      "${COMPOSE[@]}" up -d --no-deps "$service"
    fi
  done
done

docker builder prune -f
"${COMPOSE[@]}" ps

echo "Deploy concluido sem remover volumes."
