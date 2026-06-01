#!/bin/bash
set -e
CONTAINER="3c9da600ee1a_postgres_study"
USER="study_user"
SRC="study_db"
DST="study_test"

echo "🔄 Sincronizando $DST com $SRC..."

# Dump schema do banco real
docker exec $CONTAINER pg_dump -U $USER -d $SRC \
  --schema-only --no-owner --no-privileges \
  -f /tmp/schema_src.sql

# Encerrar conexões ativas no study_test
docker exec $CONTAINER psql -U $USER -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DST' AND pid <> pg_backend_pid();"

# Drop e recriar (comandos separados — fora de transaction)
docker exec $CONTAINER psql -U $USER -d postgres -c "DROP DATABASE IF EXISTS $DST;"
docker exec $CONTAINER psql -U $USER -d postgres -c "CREATE DATABASE $DST OWNER $USER;"

# Aplicar schema
docker exec $CONTAINER psql -U $USER -d $DST -f /tmp/schema_src.sql

echo "✅ $DST sincronizado com $SRC"
