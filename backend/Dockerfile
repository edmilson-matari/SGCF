FROM node:22.18-alpine3.22
WORKDIR /app
COPY ./package*.json /app/
RUN npm install
COPY ./ /app/
EXPOSE 5432
CMD ["node", "./src/server.ts"]