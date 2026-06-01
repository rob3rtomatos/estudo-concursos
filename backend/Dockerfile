# ============================================================
# Dockerfile do Backend - Node.js 18 Alpine
# ============================================================

FROM node:18-alpine

# Ferramentas necessárias para compilar módulos nativos (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar manifesto de dependências antes do código (cache de layers)
COPY package*.json ./

# Instalar dependências incluindo devDependencies (nodemon, jest, etc.)
RUN npm install

# Copiar o restante do código
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

# Rodar com nodemon em desenvolvimento para hot-reload
CMD ["npm", "run", "dev"]
