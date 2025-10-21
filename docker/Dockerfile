# Stage 1: Build stage
FROM node:20-alpine AS build

USER root

# Skip downloading Chrome for Puppeteer (saves build time)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install latest Flowise globally
RUN npm install -g flowise

# Stage 2: Runtime stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache chromium git python3 py3-pip make g++ build-base cairo-dev pango-dev curl

# Set the environment variable for Puppeteer to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy Flowise from the build stage
COPY --from=build /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=build /usr/local/bin /usr/local/bin

# Copy custom nodes to the correct location
COPY packages/components/nodes/tools/EventlyCreateAttributeType/ /usr/local/lib/node_modules/flowise-components/dist/nodes/tools/EventlyCreateAttributeType/
COPY packages/components/nodes/tools/EventlySelectAttributeType/ /usr/local/lib/node_modules/flowise-components/dist/nodes/tools/EventlySelectAttributeType/
COPY packages/components/credentials/EventlyApi.credential.js /usr/local/lib/node_modules/flowise-components/dist/credentials/EventlyApi.credential.js

ENTRYPOINT ["flowise", "start"]
