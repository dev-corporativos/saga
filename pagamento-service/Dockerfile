FROM node:20-alpine

WORKDIR /app

# Copia dependências
COPY package*.json ./

RUN npm install

# Copia o código
COPY . .

# Compila o TypeScript
RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start"]