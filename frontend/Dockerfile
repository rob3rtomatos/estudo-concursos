# ============================================================
# Dockerfile do Frontend - React 18 + Vite (modo dev)
# ============================================================

FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Vite ouve em 0.0.0.0 para ser acessível fora do container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
