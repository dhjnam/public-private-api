FROM node:20-alpine

COPY package.json /api/
COPY dist /api/
# COPY env /api/env/

WORKDIR /api/

RUN npm install
# ENV NODE_ENV prod

ENV MONGO_HOST=mongodb
ENV MONGO_PORT=27017
ENV MONGO_ADMIN_USER=admin
ENV MONGO_ADMIN_PWD=reallysupersecureadminpassword
ENV MONGO_USER=api
ENV MONGO_PWD=reallysupersecurepassword
ENV MONGO_DB=private-public
ENV MONGO_PATH=mongodb

ENV REDIS_URL=redis://redis:6379
ENV API_PORT=7000
ENV SESSION_SECRET=reallyssupersecuresessionsecret


CMD [ "node", "/api/index.js" ]