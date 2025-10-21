# Build local monorepo image with Evently custom nodes
# docker build --no-cache -t flowise-evently .

# Run image
# docker run -d -p 3000:3000 flowise-evently

FROM node:20-alpine
RUN apk add --update libc6-compat python3 make g++
# needed for pdfjs-dist
RUN apk add --no-cache build-base cairo-dev pango-dev

# Install Chromium
RUN apk add --no-cache chromium

# Install curl for container-level health checks
# Fixes: https://github.com/FlowiseAI/Flowise/issues/4126
RUN apk add --no-cache curl

#install PNPM globaly
RUN npm install -g pnpm

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV NODE_OPTIONS=--max-old-space-size=8192

WORKDIR /usr/src

# Copy app source
COPY . .

RUN pnpm install

# Установка зависимостей для api-documentation
RUN cd packages/api-documentation && pnpm install

RUN pnpm build

EXPOSE 3000

# Переменные окружения для Evently API
ENV EVENTLY_API_URL=http://evently.api:8080
ENV EVENTLY_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYTFBuX3NBMWtiNjhFTE51WlBZdUlfV29LNUJYcm5TeDdmOExKeEd4XzdrIn0.eyJleHAiOjE3NjA5NTA0NTQsImlhdCI6MTc2MDk0ODY1NCwianRpIjoidHJydGNjOmU5MWYwMzViLTNiZjMtNmRmNC04YzE2LTFhYmUwOGRlZDAyYyIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MTgwODAvcmVhbG1zL2V2ZW50bHkiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZTZmYzBhOWEtYzQ2Ni00M2I3LTkzZGYtZmY0MGViM2MwNTQwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZXZlbnRseS1jb25maWRlbnRpYWwtY2xpZW50IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLWV2ZW50bHkiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsibWFuYWdlLXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImNsaWVudEhvc3QiOiIxNzIuMTguMC4xIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LWV2ZW50bHktY29uZmlkZW50aWFsLWNsaWVudCIsImNsaWVudEFkZHJlc3MiOiIxNzIuMTguMC4xIiwiY2xpZW50X2lkIjoiZXZlbnRseS1jb25maWRlbnRpYWwtY2xpZW50In0.qNda3oq6GHQfV-BXFITG4klknDONiB-Ki7rSfL__dybrJgAMfJklKieMKMGe7jp-Z0ttCIQm0MP79IZ-Q__bUB-b0CuEabN3sHVxUf3MR9MHquf5Jmgmk025leRQI8rh-CATo5_QIF1sKnpl4HVU-B3pd1l6DXBdn3YCxSxmhMtZm4VtyeU-wOa_la4rHoXcRvRvpoMzuCiEZe6ajJ_I0sma0YJrDBaz3IwxWOwabvoSbcYWIjmANUEPvpqRK1Ysnk7rWJRNidee4nX0B25G4FdcgIWDmqMOq27iP0df8KgvhKOp-0UX_IfThcDe2h1s_x1eGmXJYjNMd0i2NKN4LA

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/ping || exit 1

CMD [ "pnpm", "start" ]