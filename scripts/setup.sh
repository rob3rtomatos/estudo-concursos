#!/bin/bash
# ============================================================
# setup.sh - Verifica pré-requisitos e sobe a aplicação
# Executar da raiz do projeto: bash scripts/setup.sh
# ============================================================

set -e  # Parar em qualquer erro

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

echo ""
echo "====================================="
echo " 📚 Estudo Concursos - Setup"
echo "====================================="
echo ""

# 1. Verificar Docker
command -v docker >/dev/null 2>&1 || err "Docker não encontrado. Instale em https://docs.docker.com/engine/install/ubuntu/"
log "Docker encontrado: $(docker --version)"

# 2. Verificar Docker Compose
docker compose version >/dev/null 2>&1 || err "Docker Compose v2 não encontrado."
log "Docker Compose: $(docker compose version --short)"

# 3. Verificar se está na pasta raiz do projeto
[ -f "docker-compose.yml" ] || err "Execute este script da pasta raiz do projeto (onde está o docker-compose.yml)"

# 4. Criar .env se não existir
if [ ! -f ".env" ]; then
  cp .env.example .env
  warn ".env criado a partir do .env.example. Revise as variáveis se necessário."
else
  log ".env já existe"
fi

# 5. Subir os containers
echo ""
log "Iniciando containers com Docker Compose..."
docker compose up --build -d

# 6. Aguardar o backend estar saudável
echo ""
warn "Aguardando serviços iniciarem (30s)..."
sleep 30

# 7. Testar health check
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$HTTP" = "200" ]; then
  log "Backend respondendo em http://localhost:5000"
else
  warn "Backend ainda não respondeu (código $HTTP). Verifique com: docker-compose logs backend"
fi

echo ""
echo "====================================="
echo " ✅ Setup concluído!"
echo "====================================="
echo ""
echo "  🌐 Frontend : http://localhost:3000"
echo "  🔌 Backend  : http://localhost:5000"
echo "  💾 PostgreSQL: localhost:5432"
echo ""
echo "  📋 Logs    : docker-compose logs -f"
echo "  🧪 Testes  : docker-compose run --rm backend npm test"
echo "  🛑 Parar   : docker-compose down"
echo ""
