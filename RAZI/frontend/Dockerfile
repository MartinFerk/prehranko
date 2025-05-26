# Uporabi uradno Node.js sliko (lahka verzija)
FROM node:18-alpine

# Nastavi delovni direktorij
WORKDIR /app

# Kopiraj package.json in package-lock.json
COPY package*.json ./

# Namesti odvisnosti
RUN npm install

# Kopiraj preostale datoteke projekta
COPY . .

# Zgradi React aplikacijo
RUN npm run build

# Nastavi port, ki ga bo Railway uporabil
EXPOSE 3000

# Zaženi aplikacijo z uporabo start skripta iz package.json
CMD ["npm", "start"]