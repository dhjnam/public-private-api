FROM node:20-alpine

COPY package.json /api/
COPY dist /api/
COPY env /api/env/

WORKDIR /api/

RUN npm install
ENV NODE_ENV prod

CMD [ "node", "/api/index.js" ]