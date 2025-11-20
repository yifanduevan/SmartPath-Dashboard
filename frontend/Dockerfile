FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Override at build time if you need a different backend host (browser-facing backend route)
ARG VITE_BACKEND_BASE_URL=https://smart-path-backend-acmeair-group3.mycluster-ca-tor-1-835845-04e8c71ff333c8969bc4cbc5a77a70f6-0000.ca-tor.containers.appdomain.cloud
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
# Optional workload API key so the UI sends x-api-key
ARG VITE_WORKLOAD_API_KEY=
ENV VITE_WORKLOAD_API_KEY=$VITE_WORKLOAD_API_KEY
RUN npm run build

FROM nginx:1.27-alpine
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
  chown -R root:0 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
  chmod -R g+rwX /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
