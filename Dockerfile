FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build --filter=server

FROM base AS prod-deps
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --filter=server

FROM base
COPY --from=prod-deps /usr/src/app/node_modules /app/node_modules
COPY --from=prod-deps /usr/src/app/apps/server/node_modules /app/apps/server/node_modules
COPY --from=build /usr/src/app/apps/server/dist /app/apps/server/dist
COPY --from=build /usr/src/app/apps/server/package.json /app/apps/server/package.json

WORKDIR /app/apps/server
EXPOSE 3000
CMD [ "pnpm", "start" ]