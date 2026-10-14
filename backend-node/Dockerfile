# ==============================================================================
# StockMaster Backend Node - Dockerfile Multi-Stage
# ==============================================================================
FROM node:24-alpine AS base

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Variables y exposición
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Usuario sin privilegios por seguridad
USER node

CMD ["node", "src/server.js"]
