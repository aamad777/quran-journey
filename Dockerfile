# ---------- build ----------
FROM node:20-alpine AS build

# Add build tools for native dependencies like sharp
RUN apk add --no-cache build-base g++ make

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine

# Add curl for healthcheck
RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
