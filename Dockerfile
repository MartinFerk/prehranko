FROM node:18

# Delovni direktorij znotraj kontejnerja
WORKDIR /app

# Kopiraj samo backend kodo
COPY backend ./backend

# Nastavi delovni direktorij znotraj backend
WORKDIR /app/backend

# Namesti odvisnosti
RUN npm install

# Izpostavi port
EXPOSE 5000

# Zaženi aplikacijo
CMD ["npm", "start"]
