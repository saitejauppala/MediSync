
# Stage 1: Build React + Vite
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

# Install without Railpack cache mounts
RUN npm ci --cache /tmp/npm-cache --no-audit --no-fund

COPY . .

# Backend API URL is supplied by Railway
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Production static server
FROM caddy:2-alpine

WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 3000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
