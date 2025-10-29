FROM node:20 AS build
ARG TARGET_ENVIRONMENT="staging"
WORKDIR /usr/src/app
RUN sh -c '[ -z "$http_proxy" ] || ( npm config set proxy $http_proxy; npm config set https-proxy $http_proxy )'
COPY ./.env ./.env
COPY ./package.json ./package.json
COPY ./playwright.config.ts ./playwright.config.ts
COPY ./src ./src
COPY ./static ./static
COPY ./svelte.config.js ./svelte.config.js
COPY ./tests ./tests
COPY ./tsconfig.json ./tsconfig.json
COPY ./vite.config.ts ./vite.config.ts

RUN npm install vite --save-dev --loglevel=verbose

RUN VITE_TARGET_ENVIRONMENT=${TARGET_ENVIRONMENT} npm run build

FROM node:20 AS deploy

WORKDIR /app

COPY --from=build /usr/src/app/build build/
COPY --from=build /usr/src/app/package.json .

EXPOSE 3000

ENV NODE_ENV=production

CMD [ "node", "build" ]
