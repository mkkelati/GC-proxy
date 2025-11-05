# Use lightweight Node.js image
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
