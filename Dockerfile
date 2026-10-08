# ==========================================
# Stage 1: Build the Frontend & Production Assets
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json ./
RUN npm install

# Copy application source code and configuration files
COPY tsconfig.json vite.config.json* vite.config.ts index.html metadata.json ./
COPY firebase-applet-config.json* firebase-blueprint.json* ./
COPY frontend ./frontend
COPY backend ./backend
COPY src ./src

# Build the frontend single-page application into /app/dist
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for container health check
RUN apk add --no-cache curl

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled frontend distribution from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code and configs
COPY server.ts ./
COPY backend ./backend
COPY tsconfig.json ./
COPY firebase-applet-config.json* firebase-blueprint.json* ./

# In production, files from frontend/assets or src/assets are bundled into dist,
# but we also include them if runtime assets are referenced dynamically
COPY frontend/assets ./frontend/assets

# Expose production port
EXPOSE 3000

# Container Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the full-stack Express & static server
CMD ["npm", "start"]
