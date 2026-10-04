# devsecshop/Dockerfile
# Image DURCIE (fix du bonus conteneur, TP8).
#  - base slim et épinglée
#  - build des modules natifs isolé dans une étape builder
#  - exécution en utilisateur non privilégié (pas de root)

FROM node:20-slim AS builder
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-slim
WORKDIR /app
# Utilisateur non root
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=app:app . .
USER app
ENV PORT=3000 NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/app.js"]
