# devsecshop/Dockerfile
# Image de l'appli DevSecShop.
# NB : volontairement non durcie (tourne en root, image complète) — c'est la
# matière du bonus "sécurité conteneur" du TP capstone (Hadolint/Trivy).

FROM node:20

WORKDIR /app

# better-sqlite3 se compile à l'installation ; l'image node:20 complète
# embarque déjà la toolchain nécessaire.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/app.js"]
