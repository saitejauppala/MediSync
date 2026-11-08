
FROM node:18-bookworm-slim

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies without Railpack cache mounts
RUN npm ci --omit=dev --cache /tmp/npm-cache --no-audit --no-fund

# Copy backend application
COPY . .

ENV NODE_ENV=production

# Railway injects PORT at runtime
EXPOSE 8080

CMD ["npm", "start"]
