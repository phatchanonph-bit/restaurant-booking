FROM node:20-alpine

WORKDIR /app

COPY Backend/package*.json ./
RUN npm install

COPY Backend/js ./js
COPY Frontend /frontend

ENV PORT=3000
ENV DB_HOST=db
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=1234
ENV DB_NAME=restaurant
ENV FRONTEND_DIR=/frontend

EXPOSE 3000

CMD ["npm", "run", "start"]
