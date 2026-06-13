FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN mkdir -p uploads
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
