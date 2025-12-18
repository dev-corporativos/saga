FROM node:20-alpine

WORKDIR /app

# Copia dependências
COPY package*.json ./

RUN npm install && \
    npm install -g typescript ts-node

# Copia o código
COPY . .

# Compila o TypeScript
RUN npm run build

EXPOSE 3003

CMD ["npm", "run", "start"]