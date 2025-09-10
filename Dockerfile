###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:16.17.0-alpine As development

WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./

RUN yarn --ignore-engines

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:16.7-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN yarn build

ENV NODE_ENV production

RUN yarn --production --ignore-engines

USER node

###################
# PRODUCTION
###################

FROM node:16.7-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]