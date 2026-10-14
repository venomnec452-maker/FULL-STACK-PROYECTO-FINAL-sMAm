# ==============================================================================
# StockMaster Frontend - Dockerfile Multi-Stage (Vite Build + Nginx Alpine)
# ==============================================================================

# Etapa 1: Compilación de la SPA con Node
FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor web ultraligero Nginx para servir los estáticos en producción
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
