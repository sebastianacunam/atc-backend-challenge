FROM node:16.17.0-alpine
RUN apk add --no-cache curl
WORKDIR /usr/src/app
COPY . .
CMD ["node", "server.js"]