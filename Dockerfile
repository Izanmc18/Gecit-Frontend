# Etapa 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor Web
FROM nginx:alpine
# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamos los archivos compilados. En Angular 17+ el output suele estar en dist/NOMBRE_APP/browser
# Copiaremos todo el contenido de browser
COPY --from=build /app/dist/gecit-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
