FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Allow pip to install system-wide in Alpine's externally-managed env
ENV PIP_BREAK_SYSTEM_PACKAGES=1
# Install locust and python runtime used by workload runner
RUN apk add --no-cache python3 py3-pip python3-dev build-base libffi-dev openssl-dev && \
  python3 -m pip install --no-cache-dir locust
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
EXPOSE 4000
CMD ["npm", "start"]
