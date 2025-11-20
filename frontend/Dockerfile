FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Override at build time if you need a different backend host
# Default to the in-cluster Service name/port
ARG VITE_BACKEND_BASE_URL=http://smart-path-backend:4000
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
  chown -R root:0 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
  chmod -R g+rwX /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
