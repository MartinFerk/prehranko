FROM node:18

# Delovni direktorij znotraj kontejnerja
WORKDIR /app

# Kopiraj package.json in ostalo iz backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Kopiraj preostalo kodo
COPY backend ./ 

# Izpostavi port
EXPOSE 5000

# Zaženi aplikacijo – Railway bo sam poskrbel za MONGO_URI
CMD ["npm", "start"]
