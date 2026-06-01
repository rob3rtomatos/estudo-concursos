#!/bin/bash
set -e
echo "🔄 Sincronizando banco de testes..."
bash "$(dirname "$0")/scripts/sync-test-db.sh"
echo "🧪 Rodando testes..."
docker exec backend_study sh -c "cd /app && npm test 2>&1"
