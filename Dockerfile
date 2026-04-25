# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 4200
CMD ["node", "dist/ecommerce_frontend/server/server.mjs"]
