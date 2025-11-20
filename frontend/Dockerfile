FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Override at build time if you need a different backend host
ARG VITE_BACKEND_BASE_URL=http://backend:4000
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
