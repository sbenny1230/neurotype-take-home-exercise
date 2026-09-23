FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
# node_modules is a volume (see docker-compose.yml), which shadows the layer
# installed above. Reconciling on start is what makes a new dependency in
# package.json show up after a plain `docker compose up`.
CMD ["sh", "-c", "npm install --no-audit --no-fund && npm run dev -- --host 0.0.0.0"]
