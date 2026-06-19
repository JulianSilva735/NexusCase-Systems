# 1. Base Stage: Entorno de Desarrollo (para correr 'npm install' y el compilador)
FROM node:20-alpine AS development

# Crear y establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de definición de paquetes
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies)
RUN npm install

# Copiar el código fuente
COPY . .

# 2. Build Stage: Compilar la aplicación (genera la carpeta 'dist')
FROM development AS build
RUN npm run build

# 3. Production Stage: Imagen final (más ligera para Railway)
FROM node:20-alpine AS production

WORKDIR /usr/src/app
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production

# Copiar la aplicación compilada desde la etapa 'build'
COPY --from=build /usr/src/app/dist ./dist

# Puerto que expone el contenedor
EXPOSE 3000

# Comando para ejecutar la aplicación compilada (lo que usará Railway)
# Aseguramos la extensión .js para evitar ambigüedades al ejecutar el bundle
CMD [ "node", "dist/main.js" ]